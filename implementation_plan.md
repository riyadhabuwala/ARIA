# ARIA Codebase Quality Audit & Broken Functionality Report

Full review of the ARIA AI Interviewer application — frontend (React/Vite) and backend (FastAPI/Python).

---

## 🔴 Critical — Broken Functionality

These are issues that **will cause runtime errors or incorrect behavior** for users right now.

---

### C1. `profileApi.saveResumeProfile` sends wrong payload shape

#### [Resume.jsx:82](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/components/Resume.jsx#L82) → [profileApi.js:20-27](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/api/profileApi.js#L20-L27) → [main.py:288-300](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/backend/main.py#L288-L300)

The frontend calls `saveResumeProfile(userId, resumeText, extractedProfile, file.name)` which sends a payload with keys `extracted_profile` and `resume_filename` — but the backend's `SaveResumeRequest` model only accepts `user_id`, `resume_text`, and `filename`. The extra fields are **silently ignored** by Pydantic, meaning the extracted profile and original filename are never saved.

```diff
# profileApi.js currently sends:
  extracted_profile: profile,       # ❌ Backend doesn't read this
  resume_filename: resumeFilename,  # ❌ Backend expects "filename"

# Backend expects:
  class SaveResumeRequest(BaseModel):
      user_id: str
      resume_text: str
-     filename: str = ""            # mismatched key name
+     filename: str = ""            # frontend sends "resume_filename" instead
```

> [!CAUTION]
> **Impact:** Resume filename never persists. Users upload a resume but the file name shown in the profile is always blank.

---

### C2. `.env.production` has placeholder Supabase key — production auth is broken

#### [.env.production:3](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/.env.production#L3)

```
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

This means any production/Vercel deployment will fail to initialize Supabase, breaking authentication entirely.

> [!CAUTION]
> **Impact:** All Vercel deployments silently fail — users see an infinite loading screen because Supabase auth throws before the app renders.

---

### C3. `Settings.jsx` — Delete account uses admin API client-side (will always fail)

#### [Settings.jsx:132](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/components/Settings.jsx#L132)

```js
const { error } = await supabase.auth.admin.deleteUser(user.id);
```

`supabase.auth.admin` is only available with the **service role key**. The frontend client uses the **anon key**, so this call will **always throw a 403 Forbidden**. Account deletion is completely broken.

> [!CAUTION]
> **Impact:** "Terminate Account" button always throws an error. Needs a backend endpoint using the service key.

---

### C4. `Settings.jsx` — Password change ignores `currentPassword`

#### [Settings.jsx:116-127](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/components/Settings.jsx#L116-L127)

The form collects `currentPassword` but never uses it — `supabase.auth.updateUser({ password })` does NOT verify the old password. Any authenticated user can set any new password without re-authentication, which is a **security vulnerability**.

> [!WARNING]
> **Impact:** Security issue — no re-authentication before password change. The `currentPassword` input field is cosmetic only.

---

### C5. `AuthContext` — Children blocked during loading (double loading guard)

#### [AuthContext.jsx:31](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/context/AuthContext.jsx#L31)

```jsx
{!loading && children}
```

And then `App.jsx` line 153:
```jsx
if (loading) return <LoadingScreen />;
```

The `AuthProvider` already blocks rendering children until loading is done. Then `AppContent` also checks `loading` and shows `<LoadingScreen />`. Because the first guard already blocks `AppContent` from ever rendering while loading, the second guard's `loading` **is always false** when it runs. This isn't a crash bug, but it masks the loading state — users see a blank page instead of the loading screen because `AuthProvider` renders nothing during the auth check.

> [!WARNING]
> **Impact:** During initial auth resolution, users see a **blank white page** instead of the loading animation.

---

### C6. `InterviewRoom` — Stale `transcript` captured by closure in `handleMicRelease`

#### [InterviewRoom.jsx:140-147](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/components/InterviewRoom.jsx#L140-L147)

```js
function handleMicRelease() {
    stopListening();
    setTimeout(() => {
      if (transcript.trim()) {          // ← stale closure
        handleSendAnswer(transcript.trim());
      }
    }, 500);
  }
```

`transcript` is captured at the time `handleMicRelease` is defined. Since `useSpeechRecognition` updates `transcript` state asynchronously, the 500ms timeout often reads the **old** value, not the final recognized text. This causes answers to be sent empty or incomplete.

> [!CAUTION]
> **Impact:** Voice answers are frequently **empty or truncated**. This breaks the core interview flow for voice users.

---

### C7. Duplicate `/jobs` and `/job-match` routes for the same component

#### [App.jsx:218-227](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/App.jsx#L218-L227) and [App.jsx:344-353](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/App.jsx#L344-L353)

Both `/jobs` and `/job-match` render `<JobMatchPage>` identically. The sidebar links to `/jobs` while the Dashboard's `onJobMatch` navigates to `/job-match`. This causes confusion — the same page loads at two URLs with no redirect.

> [!IMPORTANT]
> **Impact:** Duplicate routes, inconsistent navigation. Pick one canonical path and redirect the other.

---

## 🟠 High — Significant Quality Issues

---

### H1. `Profile.jsx` — Radar chart uses fake/hardcoded scores

#### [Profile.jsx:90-96](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/components/Profile.jsx#L90-L96)

```js
const getRadarData = () => [
    { skill: 'TECHNICAL', score: analytics?.technical_score || 75 },
    // ...
```

The analytics API (`get_analytics_data`) never returns `technical_score`, `communication_score`, `behavioral_score`, or `problem_solving_score`. These fields don't exist. **Every user always sees the same hardcoded fallback scores** (75, 80, 70, 85, 78).

> [!IMPORTANT]
> **Impact:** The "Psychometric Evaluation" radar chart is meaningless — it always shows the same static data.

---

### H2. `Profile.jsx` — Badge conditions reference non-existent `sessions` property

#### [Profile.jsx:57](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/components/Profile.jsx#L57) and [Profile.jsx:98-102](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/components/Profile.jsx#L98-L102)

```js
if (aData.value?.sessions) calculateInterviewStreak(aData.value.sessions);
```

The analytics API returns `score_trend`, `domain_stats`, `grade_distribution` — but **never `sessions`**. The streak calculation never runs. `getUserStats()` also reads `analytics?.sessions?.length` which is always `undefined`, so all badges show as unearned.

> [!IMPORTANT]
> **Impact:** All badges permanently locked. Interview streak always shows 0.

---

### H3. `AICoach.jsx` — Placeholder component with hardcoded dark mode classes

#### [AICoach.jsx](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/components/AICoach.jsx)

This component is a stub with hardcoded `dark:text-white`, `dark:bg-gray-800` classes that don't match the rest of the design system (which uses CSS variables). It renders nothing useful — just a static placeholder. But it's **imported and routed** in `App.jsx`.

> [!IMPORTANT]
> **Impact:** Dead route. This component was meant to be replaced by `CareerCoachPage` but is still imported and doesn't match the design system.

---

### H4. Dashboard sequential API fetching — slow load on cold starts

#### [Dashboard.jsx:67-101](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/components/Dashboard.jsx#L67-L101)

The dashboard makes 4 sequential API calls (history → analytics → jobs → resume quality) wrapped in try/catch chains. On Render free tier with cold starts, this creates **15-25 second load times**. A `/api/dashboard/:user_id` endpoint already exists in `dashboardApi.js` but **no corresponding backend route exists**.

> [!WARNING]
> **Impact:** Extremely slow dashboard load, especially on cold starts. The `getDashboardData` client function calls a non-existent endpoint.

---

### H5. `History.jsx` — Missing `useCallback` dependency warning

#### [History.jsx:11-15](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/components/History.jsx#L11-L15)

```jsx
useEffect(() => {
    if (user?.id) {
      loadHistory();   // ← loadHistory not in deps
    }
  }, [user?.id]);
```

`loadHistory` is not wrapped in `useCallback` and not included in the dependency array. React will warn about this in development.

---

### H6. `History.jsx` — Conflicting width classes on progress bar

#### [History.jsx:111](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/components/History.jsx#L111)

```html
<div className="w-16 h-1 w-full bg-[var(--bg-elevated)] ..."
```

`w-16` and `w-full` on the same element — Tailwind will only apply one. This makes the score bar unpredictable in width.

---

### H7. `Resume.jsx` — Hardcoded filter list (fake data)

#### [Resume.jsx:256-270](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/components/Resume.jsx#L256-L270)

The "Quick Filters" sidebar shows hardcoded values: "Resume Version 1.0 — 100%", "Backend Focused — 80%", "Fullstack Draft — 35%". These are **entirely static and meaningless** — they never change based on user data.

---

## 🟡 Medium — Code Quality & Maintainability

---

### M1. Massive file litter: 15+ `-Riya` duplicate files

The repository contains duplicates for many files:
- `main-Riya.py`, `interview_agent-Riya.py`, `job_agent-Riya.py`, etc.
- `App-Riya.jsx`, `Dashboard-Riya.jsx`, `InterviewRoom-Riya.jsx`, etc.
- `.env-Riya.production`, `requirements-Riya.txt`, etc.

These appear to be personal backups that clutter the repository. They should be removed and tracked via version control (git) instead.

---

### M2. `.env` file committed to repo with real Supabase credentials

#### [frontend/.env](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/.env)

Contains a real `VITE_SUPABASE_ANON_KEY` JWT. While anon keys are designed to be public, committing `.env` files trains bad habits and risks leaking the backend `.env` which contains the **service role key**.

> [!WARNING]
> **Impact:** Backend `.env` should NEVER be committed. Check if `backend/.env` is also in git history — if so, rotate the `SUPABASE_SERVICE_KEY` and `GROQ_API_KEY` immediately.

---

### M3. `InterviewRoom.jsx` — 960 lines of inline styles

This file is 960 lines with extensive inline `style={{}}` objects (no CSS classes). This makes it extremely hard to maintain, doesn't benefit from theme variables, and has zero reusability.

---

### M4. `console.log` statements left in production code

Found in: `apiClient.js`, `jobsApi.js`, `Resume.jsx`, `CareerCoachPage-Riya.jsx`. These should be removed for production.

---

### M5. Missing error boundaries

No React error boundaries exist anywhere. A crash in any component (e.g., a JSON parse failure in the report page) will white-screen the entire app.

---

### M6. `InterviewAgent` — In-memory session storage

#### [interview_agent.py:14](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/backend/interview_agent.py#L14)

```python
self.sessions = {}  # session_id -> conversation_history
```

Interview sessions are stored in a Python dictionary. On Render free tier, the server restarts frequently. Any in-progress interview is **lost** on restart. Also, under multiple workers (gunicorn), sessions won't be shared between workers.

---

### M7. `apiClient.js` — `defaultOptions` merged wrong

#### [apiClient.js:13-19](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/api/apiClient.js#L13-L19)

```js
const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options     // ← this overwrites headers above with options.headers again
};
```

The spread `...options` at the end will overwrite `headers` if `options` contains a `headers` key. The custom Content-Type header merge above is then discarded. It works by accident for current usage, but is logically wrong.

---

### M8. Backend missing `/api/dashboard/:user_id` endpoint

#### [dashboardApi.js:10-12](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/api/dashboardApi.js#L10-L12)

The frontend has a `getDashboardData()` function that calls `/api/dashboard/{user_id}` — but this endpoint does **not exist** in `main.py`. The Dashboard component doesn't even use this function (it makes 4 separate calls instead). Dead code that references a non-existent endpoint.

---

### M9. `ThemeContext` — `localStorage.setItem` not called for system theme

#### [ThemeContext.jsx:10-35](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/src/context/ThemeContext.jsx#L10-L35)

When `theme === "system"`, the function returns early inside the `if` block, skipping the `localStorage.setItem` and `document.documentElement.setAttribute` calls outside the `if`. So switching to system theme doesn't persist the data-theme attribute properly on first load.

---

### M10. No `VITE_API_BASE_URL` in dev `.env`

#### [frontend/.env](file:///c:/Users/Riya/OneDrive/Desktop/nirma/ARIA/aria-interviewer/frontend/.env)

The dev `.env` doesn't set `VITE_API_BASE_URL`, so the api client falls back to `http://localhost:8000`. This is correct for local dev but should be documented.

---

## 🔵 Low — Minor Issues & Polish

| # | Issue | File | Detail |
|---|-------|------|--------|
| L1 | `fix.js` in project root | `fix.js` | Orphan script, not part of the app |
| L2 | Service worker registration for non-existent `sw.js` | `main.jsx:21` | No `sw.js` file in `/public`, fails silently |
| L3 | `postcss.config.js` and `tailwind.config.js` exist but TailwindCSS is a devDependency | config files | Working, but Tailwind+CSS vars hybrid may confuse future devs |
| L4 | `render.yaml` and `render-Riya.yaml` duplicates | deploy configs | Confusing for CI/CD |
| L5 | `backend.log` and `frontend.log` committed | log files | Should be in `.gitignore` |
| L6 | `animate-fadeIn`, `animate-fadeUp`, `animate-shake` used but not defined | Various components | Tailwind animations referenced but not configured in `tailwind.config.js` |
| L7 | `JobMatchPage` imports `ThemeToggle` separately | `JobMatchPage.jsx:2` | The Layout wrapper already handles theme; this is redundant |
| L8 | `useSpeechSynthesis` and `textToSpeech` both exist | hooks + API | Unclear which TTS path is primary (browser vs ElevenLabs API) |
| L9 | `index.html` missing SEO meta tags | `index.html` | No description, og:tags, etc. |
| L10 | `requirements.txt` has no version pins | `requirements.txt` | Reproducibility risk |

---

## Proposed Fix Priority

| Priority | Count | Items |
|----------|-------|-------|
| 🔴 **Critical** | 7 | C1–C7: runtime errors, broken features, security holes |
| 🟠 **High** | 7 | H1–H7: wrong data display, dead code, performance |
| 🟡 **Medium** | 10 | M1–M10: maintainability, code quality |
| 🔵 **Low** | 10 | L1–L10: polish, minor cleanup |

---

## Open Questions

> [!IMPORTANT]
> 1. **Should I proceed to fix the Critical (C1–C7) and High (H1–H7) issues?** I can prepare an execution plan for each.
> 2. **Do you want the `-Riya` duplicate files removed?** This affects ~15 files.
> 3. **Is the Render free-tier in-memory session loss (M6) acceptable**, or should we add Redis/DB-backed sessions?
> 4. **Should I create the missing `/api/dashboard/:user_id` backend endpoint** to fix the sequential fetching?
