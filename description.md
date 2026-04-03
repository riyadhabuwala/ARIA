# ARIA - Project Description

## Overview
ARIA is an AI-powered mock interview platform that conducts voice-based interviews, analyzes confidence and filler words in real time, and produces detailed performance reports. It also supports resume parsing and quality scoring, interview history, analytics, job matching, and an AI career coach chat.

## Core Features
- Voice-based interviews with browser speech recognition
- Adaptive AI interviewer powered by Groq models
- Multiple interview domains (Software Engineering, Web Development, Data Science, AI, HR)
- Resume upload (PDF) with text extraction and quality analysis
- Natural text-to-speech using ElevenLabs with browser fallback
- Animated avatar and visual speaking indicators
- Real-time confidence and filler-word analysis
- Interview recording with playback and download
- Interview history dashboard and analytics trends
- Detailed performance reports with scores and recommendations
- AI career coach chat and post-interview debrief
- Job matching and skill-gap insights

## Tech Stack
### Backend
- Python, FastAPI, Uvicorn
- Groq SDK for AI interviewing
- pdfplumber for PDF resume parsing
- httpx for HTTP requests (e.g., ElevenLabs)
- supabase-py for database operations and auth
- Pydantic for validation

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Recharts for analytics charts
- Lottie for animated avatar
- Supabase JS for auth and data access

### External Services
- Groq for AI model inference
- ElevenLabs for neural text-to-speech
- Supabase for Auth and PostgreSQL
- Web Speech API for speech recognition
- MediaRecorder API for audio capture

## System Architecture
Frontend (React/Vite) communicates with a FastAPI backend. The backend calls external AI and TTS services (Groq, ElevenLabs) and persists user data to Supabase (Auth + PostgreSQL). The frontend also uses browser-native APIs for speech recognition and recording.

## Main User Flow
1. Sign up or log in (Supabase Auth)
2. Choose interview domain and optional resume upload
3. Voice-based interview with AI responses
4. Live confidence tracking and feedback
5. Final report with scores and recommendations
6. Review interview history, analytics, job matches, and coaching

## API Endpoints (Backend)
### Core Interview
- POST /api/parse-resume
- POST /api/start-interview
- POST /api/send-message
- POST /api/generate-report
- POST /api/save-session

### Audio and Analysis
- POST /api/text-to-speech
- POST /api/analyze-confidence

### User Data and History
- GET /api/history/{user_id}
- GET /api/session/{session_id}
- GET /api/analytics/{user_id}

### Profile and Resume
- POST /api/profile/save-resume
- GET /api/profile/{user_id}
- POST /api/resume/quality

### Job Matching and Coaching
- POST /api/job-match/scan
- GET /api/job-match/results/{user_id}
- POST /api/chat
- POST /api/chat/debrief

### Health
- GET /health

## Database (Supabase)
Primary tables include:
- interview_sessions: core interview records and reports
- user_resume_profiles: resume text, extracted data, quality scores
- job_match_results: job scan results and recommendations
- chat_conversations: stored chat context (optional)

## Module-by-Module Walkthrough
### Backend (FastAPI)
- [aria-interviewer/backend/main.py](aria-interviewer/backend/main.py) - FastAPI app entry point and route definitions.
- [aria-interviewer/backend/interview_agent.py](aria-interviewer/backend/interview_agent.py) - Interview session logic and AI prompt flow.
- [aria-interviewer/backend/chat_context_builder.py](aria-interviewer/backend/chat_context_builder.py) - Builds structured context for AI chat/coaching.
- [aria-interviewer/backend/prompts.py](aria-interviewer/backend/prompts.py) - System and task prompts used by AI workflows.
- [aria-interviewer/backend/resume_parser.py](aria-interviewer/backend/resume_parser.py) - PDF resume text extraction.
- [aria-interviewer/backend/resume_profiler.py](aria-interviewer/backend/resume_profiler.py) - Turns resume text into a structured profile.
- [aria-interviewer/backend/resume_quality.py](aria-interviewer/backend/resume_quality.py) - Resume quality scoring and suggestions.
- [aria-interviewer/backend/confidence_analyzer.py](aria-interviewer/backend/confidence_analyzer.py) - Filler-word detection and confidence scoring.
- [aria-interviewer/backend/elevenlabs_tts.py](aria-interviewer/backend/elevenlabs_tts.py) - ElevenLabs TTS integration and fallback handling.
- [aria-interviewer/backend/supabase_client.py](aria-interviewer/backend/supabase_client.py) - Supabase connection and data access helpers.
- [aria-interviewer/backend/job_agent.py](aria-interviewer/backend/job_agent.py) - Job matching orchestration.
- [aria-interviewer/backend/job_apis.py](aria-interviewer/backend/job_apis.py) - External job API clients and search helpers.
- [aria-interviewer/backend/job_match_schema.sql](aria-interviewer/backend/job_match_schema.sql) - SQL schema for job-matching tables.
- [aria-interviewer/backend/requirements.txt](aria-interviewer/backend/requirements.txt) - Backend Python dependencies.

### Frontend (React + Vite)
- [aria-interviewer/frontend/src/main.jsx](aria-interviewer/frontend/src/main.jsx) - React bootstrap and app mounting.
- [aria-interviewer/frontend/src/App.jsx](aria-interviewer/frontend/src/App.jsx) - Top-level app routes and layout wiring.
- [aria-interviewer/frontend/src/index.css](aria-interviewer/frontend/src/index.css) - Global Tailwind base styles and theme tokens.
- [aria-interviewer/frontend/src/api/apiClient.js](aria-interviewer/frontend/src/api/apiClient.js) - Shared API client and request helpers.
- [aria-interviewer/frontend/src/api/interviewApi.js](aria-interviewer/frontend/src/api/interviewApi.js) - Interview-related API calls.
- [aria-interviewer/frontend/src/api/authApi.js](aria-interviewer/frontend/src/api/authApi.js) - Auth and session API calls.
- [aria-interviewer/frontend/src/api/coachApi.js](aria-interviewer/frontend/src/api/coachApi.js) - Career coach and debrief endpoints.
- [aria-interviewer/frontend/src/api/jobsApi.js](aria-interviewer/frontend/src/api/jobsApi.js) - Job match and job search endpoints.
- [aria-interviewer/frontend/src/api/profileApi.js](aria-interviewer/frontend/src/api/profileApi.js) - Resume profile endpoints.
- [aria-interviewer/frontend/src/api/analyticsApi.js](aria-interviewer/frontend/src/api/analyticsApi.js) - Analytics and history endpoints.
- [aria-interviewer/frontend/src/components/InterviewRoom.jsx](aria-interviewer/frontend/src/components/InterviewRoom.jsx) - Core interview UI and audio controls.
- [aria-interviewer/frontend/src/components/Transcript.jsx](aria-interviewer/frontend/src/components/Transcript.jsx) - Live transcript display.
- [aria-interviewer/frontend/src/components/ConfidencePanel.jsx](aria-interviewer/frontend/src/components/ConfidencePanel.jsx) - Real-time confidence meter.
- [aria-interviewer/frontend/src/components/FeedbackReport.jsx](aria-interviewer/frontend/src/components/FeedbackReport.jsx) - Post-interview report view.
- [aria-interviewer/frontend/src/components/Analytics.jsx](aria-interviewer/frontend/src/components/Analytics.jsx) - Analytics dashboard shell.
- [aria-interviewer/frontend/src/components/AnalyticsCharts.jsx](aria-interviewer/frontend/src/components/AnalyticsCharts.jsx) - Charts and trends visualization.
- [aria-interviewer/frontend/src/components/History.jsx](aria-interviewer/frontend/src/components/History.jsx) - Interview history list.
- [aria-interviewer/frontend/src/components/HistoryCard.jsx](aria-interviewer/frontend/src/components/HistoryCard.jsx) - Individual history card view.
- [aria-interviewer/frontend/src/components/ResumeUpload.jsx](aria-interviewer/frontend/src/components/ResumeUpload.jsx) - Resume upload UI and parsing flow.
- [aria-interviewer/frontend/src/components/ResumeQualityScore.jsx](aria-interviewer/frontend/src/components/ResumeQualityScore.jsx) - Resume quality breakdown and suggestions.
- [aria-interviewer/frontend/src/components/JobMatches.jsx](aria-interviewer/frontend/src/components/JobMatches.jsx) - Job match results list.
- [aria-interviewer/frontend/src/components/JobCard.jsx](aria-interviewer/frontend/src/components/JobCard.jsx) - Job match card.
- [aria-interviewer/frontend/src/components/AICoach.jsx](aria-interviewer/frontend/src/components/AICoach.jsx) - Career coach chat UI.
- [aria-interviewer/frontend/src/components/ChatWidget.jsx](aria-interviewer/frontend/src/components/ChatWidget.jsx) - Chat entry and message flow.
- [aria-interviewer/frontend/src/components/ARIAWaveform.jsx](aria-interviewer/frontend/src/components/ARIAWaveform.jsx) - Visual speech waveform/animation.
- [aria-interviewer/frontend/src/components/ARIAWaveformStrip.jsx](aria-interviewer/frontend/src/components/ARIAWaveformStrip.jsx) - Compact waveform animation.
- [aria-interviewer/frontend/src/components/RecordingControls.jsx](aria-interviewer/frontend/src/components/RecordingControls.jsx) - Audio recording buttons and state.
- [aria-interviewer/frontend/src/components/CameraPermissionScreen.jsx](aria-interviewer/frontend/src/components/CameraPermissionScreen.jsx) - Permission handling UI.
- [aria-interviewer/frontend/src/components/LoadingScreen.jsx](aria-interviewer/frontend/src/components/LoadingScreen.jsx) - App-wide loading state.
- [aria-interviewer/frontend/src/components/LeftSidebar.jsx](aria-interviewer/frontend/src/components/LeftSidebar.jsx) - Main navigation sidebar.
- [aria-interviewer/frontend/src/components/MobileHeader.jsx](aria-interviewer/frontend/src/components/MobileHeader.jsx) - Mobile navigation header.
- [aria-interviewer/frontend/src/components/Layout.jsx](aria-interviewer/frontend/src/components/Layout.jsx) - Shared page layout wrapper.
- [aria-interviewer/frontend/src/components/ThemeToggle.jsx](aria-interviewer/frontend/src/components/ThemeToggle.jsx) - Light/dark theme switch.
- [aria-interviewer/frontend/src/components/Settings.jsx](aria-interviewer/frontend/src/components/Settings.jsx) - Settings view.
- [aria-interviewer/frontend/src/components/Profile.jsx](aria-interviewer/frontend/src/components/Profile.jsx) - User profile shell.
- [aria-interviewer/frontend/src/components/ProfileSummary.jsx](aria-interviewer/frontend/src/components/ProfileSummary.jsx) - Profile summary panel.
- [aria-interviewer/frontend/src/components/DomainSelector.jsx](aria-interviewer/frontend/src/components/DomainSelector.jsx) - Domain selection UI.
- [aria-interviewer/frontend/src/components/EndInterviewModal.jsx](aria-interviewer/frontend/src/components/EndInterviewModal.jsx) - End interview confirmation.
- [aria-interviewer/frontend/src/components/ScoreGauge.jsx](aria-interviewer/frontend/src/components/ScoreGauge.jsx) - Overall score gauge.
- [aria-interviewer/frontend/src/components/ScoreRadarChart.jsx](aria-interviewer/frontend/src/components/ScoreRadarChart.jsx) - Skill radar visualization.
- [aria-interviewer/frontend/src/pages/LandingPage.jsx](aria-interviewer/frontend/src/pages/LandingPage.jsx) - Marketing/entry page.
- [aria-interviewer/frontend/src/pages/CareerCoachPage.jsx](aria-interviewer/frontend/src/pages/CareerCoachPage.jsx) - Coach page wrapper.
- [aria-interviewer/frontend/src/pages/JobMatchPage.jsx](aria-interviewer/frontend/src/pages/JobMatchPage.jsx) - Job match page wrapper.
- [aria-interviewer/frontend/src/context/AuthContext.jsx](aria-interviewer/frontend/src/context/AuthContext.jsx) - Authentication context provider.
- [aria-interviewer/frontend/src/context/ThemeContext.jsx](aria-interviewer/frontend/src/context/ThemeContext.jsx) - Theme state and persistence.
- [aria-interviewer/frontend/src/hooks/useChatbot.js](aria-interviewer/frontend/src/hooks/useChatbot.js) - Chat flow state and streaming helpers.
- [aria-interviewer/frontend/src/hooks/useRecording.js](aria-interviewer/frontend/src/hooks/useRecording.js) - MediaRecorder lifecycle management.
- [aria-interviewer/frontend/src/hooks/useSpeechRecognition.js](aria-interviewer/frontend/src/hooks/useSpeechRecognition.js) - Speech-to-text wrapper.
- [aria-interviewer/frontend/src/hooks/useSpeechSynthesis.js](aria-interviewer/frontend/src/hooks/useSpeechSynthesis.js) - TTS playback and fallback logic.
- [aria-interviewer/frontend/src/hooks/useConfidenceTracker.js](aria-interviewer/frontend/src/hooks/useConfidenceTracker.js) - Confidence tracking state.
- [aria-interviewer/frontend/src/hooks/useCamera.js](aria-interviewer/frontend/src/hooks/useCamera.js) - Camera access and preview setup.
- [aria-interviewer/frontend/src/utils/formatters.js](aria-interviewer/frontend/src/utils/formatters.js) - Shared formatting helpers.
- [aria-interviewer/frontend/public/manifest.json](aria-interviewer/frontend/public/manifest.json) - Web app manifest.
- [aria-interviewer/frontend/public/sw.js](aria-interviewer/frontend/public/sw.js) - Service worker for caching/offline behavior.

## Project Structure
```
ARIA/
├── aria-interviewer/
│   ├── backend/
│   │   ├── main.py
│   │   ├── interview_agent.py
│   │   ├── resume_parser.py
│   │   ├── prompts.py
│   │   ├── elevenlabs_tts.py
│   │   ├── confidence_analyzer.py
│   │   ├── supabase_client.py
│   │   ├── requirements.txt
│   │   └── job_match_schema.sql
│   ├── frontend/
│   │   ├── public/
│   │   │   ├── animations/
│   │   │   └── icons/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   ├── utils/
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tailwind.config.js
│   │   └── vite.config.js
│   ├── render.yaml
│   └── README.md
├── README.md
└── documentation and reports (project summaries, test reports)
```

## Environment Variables
### Backend (.env)
- GROQ_API_KEY
- ELEVENLABS_API_KEY
- ELEVENLABS_VOICE_ID
- SUPABASE_URL
- SUPABASE_SERVICE_KEY

### Frontend (.env)
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## How to Run (Local)
1. Backend
   - cd aria-interviewer/backend
   - pip install -r requirements.txt
   - uvicorn main:app --reload --port 8000
2. Frontend
   - cd aria-interviewer/frontend
   - npm install
   - npm run dev

## Notes
- Chrome or Edge is recommended for speech recognition reliability.
- ElevenLabs TTS falls back to the browser speech engine if the API is unavailable.
- Interview sessions persist in Supabase; active interviews also maintain in-memory state for responsiveness.
