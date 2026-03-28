# ARIA Platform - Quick Testing Guide 🚀

## How to Test Everything in 5 Minutes

### Step 1: Start the Application
```bash
# Terminal 1 - Frontend
cd aria-interviewer/frontend
npm run dev
# Open: http://localhost:5173

# Terminal 2 - Backend
cd aria-interviewer/backend
python main.py
# Backend running on: http://localhost:8000
```

---

## Step 2: Test Authentication Flow

**Action:** Visit http://localhost:5173/

**Expected:**
- ✅ Landing Page loads (NOT dashboard)
- ✅ "Get Started" or "Sign In" button visible
- ✅ Can navigate to Login page

**Action:** Try to access `/dashboard` without login

**Expected:**
- ✅ Redirected to `/login`
- ✅ Cannot access protected routes

**Action:** Sign up or login with test account

**Expected:**
- ✅ After login → Automatically redirected to `/dashboard`
- ✅ Dashboard loads with user name/email visible

---

## Step 3: Test Sidebar Navigation

**All the following should work:**

| Link | URL | Expected |
|------|-----|----------|
| Dashboard | `/dashboard` | Shows stats & recent interviews |
| Start Interview | `/interview` | Shows domain selector |
| Analytics | `/analytics` | Shows performance analytics |
| History | `/history` | Shows interview table |
| Resume | `/resume` | Shows resume manager |
| Job Matches | `/job-match` | Shows 10 job cards |
| AI Coach | `/coach` | Shows coach interface |
| Profile | `/profile` | Shows user profile |
| Settings | `/settings` | Shows settings page |

---

## Step 4: Test Analytics Page ✅ (THE BIG FIX)

**URL:** http://localhost:5173/analytics

**Expected to see:**

1. **Four Stat Cards:**
   - Total Interviews (e.g., "5")
   - Average Score (e.g., "85/100")
   - Best Score (e.g., "92/100")
   - Avg Confidence (e.g., "78%")

2. **Performance by Domain Section:**
   - Domain name (e.g., "Python", "JavaScript")
   - Score and interview count
   - Progress bar showing score

3. **Key Insights Section:**
   - If interviews exist: Shows insights like "You've completed 5 interviews..."
   - If no interviews: Shows "No interview data yet"

**IF BLANK:** ❌ Check browser console (F12) for errors

---

## Step 5: Test History Page

**URL:** http://localhost:5173/history

**Expected:**

1. **Table with columns:**
   - Domain (e.g., "Python")
   - Date (e.g., "Mar 21, 2026, 02:15 PM")
   - Score (e.g., "85/100")
   - Confidence (e.g., "78/100")
   - Grade (e.g., "A", "B", "C" with colors)
   - Duration (e.g., "15m")

2. **Summary Stats at bottom:**
   - Total Interviews count
   - Average Score
   - Best Score

3. **Empty state if no interviews:** "No interviews yet" message

---

## Step 6: Test Resume Page

**URL:** http://localhost:5173/resume

### Scenario A: No Resume Uploaded Yet
**Expected:**
- Drag & drop area visible
- "Select PDF File" button
- No profile information shown

**Action:** Upload a PDF resume

**Expected:**
- Success message appears
- Page refreshes
- Shows "Profile Information" section with:
  - Contact info (email, phone, location)
  - Skills (as tags)
  - Experience summary

### Scenario B: Resume Already Uploaded
**Expected:**
- Profile information card displayed
- "Update Resume" button visible
- AI-powered feedback section shows

---

## Step 7: Test Job Matches Page

**URL:** http://localhost:5173/job-match

**Expected:**

1. **10 job cards** displaying:
   - Job Title
   - Company Name
   - Location
   - Salary (if available)
   - Match Score (X%)

2. **Back button** returns to dashboard

3. **No errors** in Network tab or Console

---

## Step 8: Test Dashboard Page

**URL:** http://localhost:5173/dashboard

**Expected:**

1. **Statistics displayed correctly:**
   - Total Score (NOT 10000/100 ❌)
   - Average Score
   - Best Score
   - Confidence (NOT 10000/100 ❌)

2. **Recent Interviews section:**
   - If interviews exist: Shows table with sessions
   - If no interviews: Shows "Start your first interview" button ✅
   - NOT "Upload your resume first" ❌

3. **Quick actions working:**
   - "Start Interview" button → Goes to /interview
   - "View Job Matches" button → Goes to /job-match (NOT /jobs ❌)

---

## Step 9: Test Sign Out

**Action:** Click user profile → "Sign Out"

**Expected:**
- ✅ Signed out successfully
- ✅ Redirected to `/landing` (landing page)
- ✅ Cannot access `/dashboard` anymore (redirects to login)

---

## Step 10: Check Browser Console

**Open DevTools:** Press `F12` → Console tab

**Expected:**
- ❌ NO red error messages
- ❌ NO "undefined" errors
- ⚠️ OK: Blue/gray info logs like:
  ```
  [apiClient] API Base URL: http://localhost:8000
  [jobsApi] Fetching job results for user: ...
  [Analytics] Loaded data: {...}
  ```

---

## 🔴 Common Issues & Fixes

### Issue: Analytics shows blank/black page
**Fix:** Page should now load properly with stat cards and domain performance
- Browser: Refresh page (Ctrl+R)
- Backend: Verify `/api/analytics/{userId}` endpoint returns data
- Console: Check for API errors (F12 → Network tab)

### Issue: Confidence shows 10000/100
**Fix:** This is now corrected in Dashboard.jsx
- Clear browser cache or do hard refresh (Ctrl+Shift+R)

### Issue: Resume shows upload form when resume uploaded
**Fix:** Now uses `has_resume` flag from API response
- Clear cache and refresh
- Verify backend returns `has_resume: true` in profile API

### Issue: Sign out button doesn't work
**Fix:** Now fully implemented
- Check if button is clickable (verify no errors in console)
- Verify you're redirected to landing page

### Issue: Job Matches shows empty
**Fix:** Changed dependency from `[user]` to `[user?.id]`
- Verify endpoint `/api/job-match/results/{userId}` returns data
- Check Network tab in DevTools

---

## ✅ Success Criteria

All items below should be checked:

- [✅] Landing page loads (not redirected to dashboard)
- [✅] Login/Sign up works
- [✅] Can access all 9 sidebar menu items
- [✅] Analytics page shows stat cards (not blank)
- [✅] History page shows interview table
- [✅] Resume page can upload/display resume
- [✅] Job Matches shows 10 jobs
- [✅] Dashboard confidence shows correct number (not 10000)
- [✅] Dashboard button says "Start your first interview" (not resume upload)
- [✅] Job Matches accessed via /job-match (not /jobs)
- [✅] Sign out works and redirects to landing
- [✅] No red errors in browser console
- [✅] All navigation links work

---

## 🎉 You're All Set!

If all tests pass → **Ready to commit to GitHub!**

Use this command to create a commit:

```bash
git add -A
git commit -m "Complete platform implementation: fix analytics, history, resume, navigation, and sign out"
git push origin master
```

---

## Questions?

Check:
1. **FINAL_VERIFICATION_REPORT.md** - Detailed verification report
2. **Browser Console (F12)** - For error messages
3. **Network Tab (F12)** - To see API responses
4. **Backend Logs** - For server-side errors
