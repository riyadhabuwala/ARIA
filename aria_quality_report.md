# ARIA — Project Quality Report & Vercel Deployment Guide

## Executive Summary

ARIA is a **well-architected, feature-rich** AI interview platform with a FastAPI backend + React/Vite frontend. The codebase is clean, modular, and well-organized. However, there are **6 critical production blockers** and several high-priority improvements to address before deployment.

| Category | Grade | Details |
|----------|-------|---------|
| **Architecture** | A- | Clean separation, modular backend, good API layer |
| **Code Quality** | B+ | Well-structured, consistent patterns, JSDoc present |
| **Security** | 🔴 F | API keys committed to Git, no rate limiting, CORS wildcards |
| **Production Readiness** | 🟡 C | Build succeeds, but critical deployment gaps |
| **UI/UX** | A | Premium design system, dark/light themes, good animations |
| **Performance** | B | Good code-splitting, but backend bottlenecks exist |

---

## 🔴 CRITICAL — Production Blockers (Must Fix Before Deploy)

> [!CAUTION]
> These issues **MUST** be resolved before any public deployment. They can cause security breaches, data loss, or complete application failure.

### 1. API Keys Exposed in Git

**File:** [.env](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/backend/.env)

All API keys (Groq, ElevenLabs, Supabase service key, Adzuna, RapidAPI) are committed directly in the `.env` file. Even though `.gitignore` lists `.env`, the file has already been tracked. Anyone with repo access can steal these keys.

**Impact:** Complete account compromise — attackers can use your Groq credits, access your Supabase database with service-role privileges (bypassing all RLS), and make API calls on your dime.

**Fix:**
```bash
# 1. Rotate ALL keys immediately (Groq, ElevenLabs, Supabase, Adzuna, RapidAPI)
# 2. Remove .env from Git history:
git rm --cached backend/.env frontend/.env
git commit -m "chore: remove .env files from tracking"
# 3. For Render/Vercel: set keys via dashboard environment variables only
```

---

### 2. Frontend `.env.production` Has Placeholder Supabase Key

**File:** [.env.production](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/.env.production)

```
VITE_SUPABASE_ANON_KEY=your-anon-key-here   ← PLACEHOLDER!
```

The production build will ship with a broken Supabase client. **Auth, history, analytics — everything will fail in production.**

**Fix:** Replace with the real anon key, or set `VITE_SUPABASE_ANON_KEY` as a Vercel environment variable.

---

### 3. In-Memory Session Storage (Backend)

**File:** [interview_agent.py](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/backend/interview_agent.py#L14)

```python
self.sessions = {}  # session_id -> conversation_history  ← IN MEMORY!
```

All active interview sessions live in a Python dictionary. This means:
- **Server restart = all active interviews lost** (Render free tier restarts every ~15 min of inactivity)
- **Multiple workers = session not found** (if Render scales to 2+ workers)
- **Memory leak potential** — sessions accumulate if `end_session()` isn't called

**Fix (minimal):** Add a TTL dict that auto-expires sessions after 30 minutes:
```python
import time

class InterviewAgent:
    def __init__(self):
        self.sessions = {}
        self.session_timestamps = {}
        self.SESSION_TTL = 1800  # 30 minutes

    def _cleanup_expired(self):
        now = time.time()
        expired = [sid for sid, ts in self.session_timestamps.items()
                   if now - ts > self.SESSION_TTL]
        for sid in expired:
            del self.sessions[sid]
            del self.session_timestamps[sid]
```

**Fix (proper):** Use Redis or store session history in Supabase.

---

### 4. CORS Wildcard Pattern Allows Any Vercel App

**File:** [main.py:L85-L88](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/backend/main.py#L85-L88)

```python
allow_origins=[
    "https://aria-interviewer.vercel.app",
    "https://*.vercel.app",  # ← ANY vercel app can hit your API!
],
```

**Impact:** Any attacker can deploy a Vercel app and call your backend API endpoints, consuming your Groq/ElevenLabs credits.

**Fix:** Remove the wildcard and add only your actual Vercel URL:
```python
allow_origins=[
    "https://aria-interviewer.vercel.app",
    # Add your exact Vercel deployment URLs only
],
```

---

### 5. No Rate Limiting on AI Endpoints

**Impact:** A single malicious user can spam `/api/chat`, `/api/start-interview`, `/api/generate-report` and exhaust your Groq API credits in minutes.

**Fix:** Add `slowapi` rate limiting:
```bash
pip install slowapi
```
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/start-interview")
@limiter.limit("5/minute")
async def start_interview(request: Request, req: StartRequest):
    ...
```

---

### 6. No React Error Boundaries

If any component throws (e.g., malformed API response), the **entire app white-screens**. There are no error boundaries anywhere.

**Fix:** Add a root-level error boundary in `App.jsx`:
```jsx
import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}
```

---

## 🟡 High Priority — Production Improvements

### 7. `console.log` Statements in Production Code

**Files:** [apiClient.js:L2](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/api/apiClient.js#L2), [apiClient.js:L57](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/api/apiClient.js#L57)

```javascript
console.log('[apiClient] API Base URL:', BASE_URL);  // Leaks your backend URL
console.log(`[apiClient] Response from ${endpoint}:`, data);  // Logs ALL API data
```

These expose your API URL and all response data in the browser console. **Remove or guard behind NODE_ENV.**

---

### 8. Missing `VITE_API_BASE_URL` in `.env.production`

The `.env.production` file sets `VITE_API_BASE_URL=https://aria-backend.onrender.com`, but this must match your **actual** Render deployment URL. If you haven't deployed the backend yet, the frontend will fail silently.

**Action:** Verify the Render URL is correct after deploying the backend.

---

### 9. No Request Timeout on Frontend Fetch Calls

[apiClient.js](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/api/apiClient.js) doesn't set any `AbortController` timeout. If the backend hangs (Render cold start is ~30-60 seconds), users see an infinite spinner.

**Fix:**
```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);
const response = await fetch(url, { ...options, signal: controller.signal });
clearTimeout(timeout);
```

---

### 10. Backend `requirements.txt` Missing Version Pins

**File:** [requirements.txt](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/backend/requirements.txt)

```
fastapi        ← no version!
uvicorn
groq
supabase
```

A `pip install` on Render will pull the latest versions, which may introduce breaking changes.

**Fix:** Pin versions:
```
fastapi==0.111.0
uvicorn==0.29.0
groq==0.8.0
pdfplumber==0.11.0
python-multipart==0.0.9
python-dotenv==1.0.1
pydantic==2.7.1
httpx==0.27.0
supabase==2.4.0
```

---

### 11. No Loading/Error States for Slow Backend

Render free tier has **30-60 second cold starts**. The app should show a "Loading… backend is waking up" message when the first API call takes unusually long, instead of a blank spinner.

---

### 12. Duplicate Route Definitions

**File:** [App.jsx](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/App.jsx)

`/jobs` (L242-L251) and `/job-match` (L370-L379) both render `<JobMatchPage />` with identical props. This creates confusion about which URL to use.

**Fix:** Remove the `/job-match` route and keep only `/jobs`.

---

### 13. AuthContext Blocks Initial Render

**File:** [AuthContext.jsx:L31](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/context/AuthContext.jsx#L31)

```jsx
{!loading && children}  // Nothing renders until auth check completes
```

If Supabase is slow (or cold-starting), users see a blank screen. The `LoadingScreen` component is only shown by `AppContent`, not the provider itself.

---

### 14. Missing `rel="noopener noreferrer"` on External Links

Any `<a target="_blank">` links in `JobCard.jsx`, `FeedbackReport.jsx`, etc. should include `rel="noopener noreferrer"` for security.

---

## 🟢 What's Working Well

| Feature | Assessment |
|---------|-----------|
| **Code Splitting** | ✅ Excellent — `manualChunks` in Vite config splits vendor, charts, supabase, lottie |
| **Design System** | ✅ Premium CSS variables, dark/light theme, glassmorphism |
| **API Architecture** | ✅ Clean `apiClient.js` abstraction with proper error handling |
| **Supabase Integration** | ✅ Well-structured with RLS, proper auth flow |
| **AI Prompts** | ✅ Very detailed, structured prompts with clear scoring rubrics |
| **Confidence Analysis** | ✅ Smart heuristics for filler words, openers, answer length |
| **Resume Quality** | ✅ Robust normalization with `_normalize_quality_result()` |
| **Job Matching Pipeline** | ✅ Clean 5-step agent pattern with proper error handling |
| **SPA Routing** | ✅ `vercel.json` rewrites configured correctly for client-side routing |
| **PWA Setup** | ✅ Service worker registered, manifest present |

---

## 📊 Performance Bottlenecks

### Backend

| Bottleneck | Endpoint | Impact |
|------------|----------|--------|
| **Job scan pipeline** | `/api/job-match/scan` | Runs 5 sequential API calls (profile extraction → query generation → 8 parallel job API calls → AI ranking → DB save). Takes **15-30 seconds.** |
| **Context builder** | `/api/chat` → `build_context_string()` | Makes **3 separate Supabase queries** on every chat message. Should be cached per-session. |
| **Render cold starts** | All endpoints | Free tier spins down after 15 min inactivity. First request takes 30-60 sec. |
| **In-memory sessions** | `/api/send-message` | Session dict grows unbounded if interviews aren't completed. |

### Frontend

| Bottleneck | Component | Impact |
|------------|-----------|--------|
| **Recharts bundle** | `charts-*.js` | ~419 KB chunk loaded even on pages without charts |
| **Lottie animations** | Public assets | JSON animation files can be 100KB+ each |
| **No lazy loading** | All routes | All 33 components load on initial mount |

**Recommendation:** Add `React.lazy()` for heavy routes:
```jsx
const CareerCoachPage = React.lazy(() => import('./pages/CareerCoachPage'));
const FeedbackReport = React.lazy(() => import('./components/FeedbackReport'));
```

---

## 🚀 Vercel Deployment Guide (Frontend Only)

> [!IMPORTANT]
> Vercel can only host the **frontend** (static React/Vite build). The **backend** (Python/FastAPI) must stay on Render (or Railway/Fly.io).

### Step-by-Step

#### 1. Fix Critical Issues First
- [ ] Replace `.env.production` placeholder with real keys
- [ ] Remove `console.log` from apiClient.js
- [ ] Verify backend is deployed on Render and note the URL
- [ ] Remove CORS wildcard from backend

#### 2. Prepare for Vercel

Your `vercel.json` is already correctly configured:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# From the frontend directory:
cd aria-interviewer/frontend

# Deploy
vercel
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No (first time)
- **Project name?** → `aria-interviewer`
- **Framework?** → Vite (should auto-detect)
- **Root directory?** → `./` (you're already in frontend/)

#### 4. Set Environment Variables in Vercel Dashboard

Go to **Project Settings → Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://aria-backend.onrender.com` (your actual Render URL) |
| `VITE_SUPABASE_URL` | `https://pamxzhjtubmboowrmcep.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your actual Supabase anon key |

> [!WARNING]
> After setting env vars, trigger a **redeploy** — Vercel injects `VITE_*` vars at build time, not runtime.

#### 5. Update Backend CORS

After deployment, add your actual Vercel URL to the backend CORS:
```python
allow_origins=[
    "https://aria-interviewer.vercel.app",
    "https://aria-interviewer-YOUR-USERNAME.vercel.app",
],
```

#### 6. Verify Deployment

- [ ] Landing page loads
- [ ] Sign up / Login works (Supabase auth)
- [ ] Start interview → questions flow correctly
- [ ] Report generation works
- [ ] Dashboard shows history
- [ ] Career Coach chat streams properly

---

## Enhancement Suggestions (Post-Deployment)

| # | Enhancement | Effort | Impact |
|---|------------|--------|--------|
| 1 | Add React Error Boundaries with retry UI | Low | High |
| 2 | Implement request retry with exponential backoff in apiClient | Low | High |
| 3 | Add "Backend warming up…" state for cold starts | Low | Medium |
| 4 | Lazy-load heavy routes (`CareerCoachPage`, `FeedbackReport`) | Low | Medium |
| 5 | Cache `build_context_string()` result for 5 min per user | Low | Medium |
| 6 | Add Sentry/LogRocket for error tracking in production | Medium | High |
| 7 | Add a global `<Suspense>` fallback with branded loader | Low | Medium |
| 8 | Implement proper backend health-check on app startup | Low | Medium |

---

> **Bottom line:** The app is well-built with a strong feature set. Fix the 6 critical blockers (especially API key exposure and the `.env.production` placeholder), and you're ready to deploy.
