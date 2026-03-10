# ARIA — AI Recruitment Interview Assistant

An AI-powered mock interview platform that conducts realistic voice-based interviews and generates detailed performance reports.

## Features

### Week 1 — Core
- Select interview domain (Software Engineering, Web Development, Data Science, AI, HR)
- Optional PDF resume upload for personalized questions
- Voice-based interview using browser Speech APIs
- Adaptive AI interviewer powered by Groq
- Detailed performance report with scores and recommendations

### Week 2 — Enhancements
- **ElevenLabs TTS** — Natural AI voice with browser TTS fallback
- **Lottie Animated Avatar** — Visual speaking/thinking indicator for ARIA
- **Supabase Auth & History** — Email/password login, interview history dashboard
- **Confidence & Filler Analysis** — Real-time filler word detection, confidence scoring, trend analysis
- **Interview Recording** — Record, playback, and download your interview audio

## Tech Stack

- **Backend:** Python, FastAPI, Groq SDK, pdfplumber, httpx (ElevenLabs), supabase-py
- **Frontend:** React (Vite), Tailwind CSS, lottie-react, @supabase/supabase-js
- **Voice:** ElevenLabs TTS (with browser fallback), Web Speech API (recognition)
- **Auth/DB:** Supabase (Auth + PostgreSQL)

---

## Setup & Run

### 1. Backend

```bash
cd aria-interviewer/backend

# Install dependencies
pip install -r requirements.txt

# Configure environment variables in .env:
#   GROQ_API_KEY=your_groq_api_key
#   ELEVENLABS_API_KEY=your_elevenlabs_api_key
#   ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
#   SUPABASE_URL=your_supabase_project_url
#   SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Start the server
uvicorn main:app --reload --port 8000
```

The backend runs at **http://localhost:8000**. Verify with: `http://localhost:8000/health`

### 2. Frontend

```bash
cd aria-interviewer/frontend

# Install dependencies
npm install

# Configure environment variables in .env:
#   VITE_SUPABASE_URL=your_supabase_project_url
#   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start the dev server
npm run dev
```

The frontend runs at **http://localhost:5173**.

### 3. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Create the `interview_sessions` table:

```sql
CREATE TABLE interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  domain TEXT NOT NULL,
  overall_score INTEGER,
  grade TEXT,
  hiring_recommendation TEXT,
  duration_seconds INTEGER DEFAULT 0,
  confidence_score REAL,
  report_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert"
  ON interview_sessions FOR INSERT
  WITH CHECK (true);
```

3. Copy the project URL, anon key, and service role key into the respective `.env` files.

---

## Usage

1. Open **http://localhost:5173** in Chrome (required for speech recognition)
2. Sign up or log in with your email and password
3. From the Dashboard, click **Start New Interview**
4. Enter your name and select an interview domain
5. Optionally upload your PDF resume
6. ARIA will greet you — watch the animated avatar respond
7. Use the microphone button (hold to speak) or type your answers
8. Monitor your confidence score in real-time (bottom-right panel)
9. After 5–7 questions, a detailed report is generated with confidence analysis
10. Download your interview recording from the report page
11. Return to Dashboard to view your interview history

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/parse-resume` | Upload PDF, get extracted text |
| POST | `/api/start-interview` | Start new interview session |
| POST | `/api/send-message` | Send answer, get next question |
| POST | `/api/generate-report` | Generate performance report |
| POST | `/api/text-to-speech` | Convert text to ElevenLabs audio |
| POST | `/api/analyze-confidence` | Analyze filler words & confidence |
| POST | `/api/save-session` | Save interview to Supabase |
| GET | `/api/history/{user_id}` | Get user's interview history |
| GET | `/api/session/{session_id}` | Get single session detail |

---

## Project Structure

```
aria-interviewer/
├── backend/
│   ├── main.py                  # FastAPI app + all routes
│   ├── interview_agent.py       # Groq AI logic + session management
│   ├── resume_parser.py         # PDF text extraction
│   ├── prompts.py               # System prompts
│   ├── elevenlabs_tts.py        # ElevenLabs TTS integration
│   ├── confidence_analyzer.py   # Filler word & confidence analysis
│   ├── supabase_client.py       # Supabase DB operations
│   ├── .env                     # API keys & config
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── public/
│   │   └── animations/          # Lottie animation JSONs
│   ├── src/
│   │   ├── components/
│   │   │   ├── DomainSelector.jsx
│   │   │   ├── ResumeUpload.jsx
│   │   │   ├── InterviewRoom.jsx
│   │   │   ├── Transcript.jsx
│   │   │   ├── FeedbackReport.jsx
│   │   │   ├── AuthPage.jsx       # Login / signup
│   │   │   ├── Dashboard.jsx      # Interview history
│   │   │   ├── HistoryCard.jsx    # Single history entry
│   │   │   ├── ARIAAvatar.jsx     # Animated avatar
│   │   │   ├── ConfidencePanel.jsx# Real-time confidence
│   │   │   └── RecordingControls.jsx
│   │   ├── hooks/
│   │   │   ├── useSpeechRecognition.js
│   │   │   ├── useSpeechSynthesis.js  # ElevenLabs + fallback
│   │   │   ├── useRecording.js        # MediaRecorder
│   │   │   └── useConfidenceTracker.js
│   │   ├── api/
│   │   │   ├── interviewApi.js
│   │   │   └── authApi.js         # Supabase client
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state provider
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                       # Supabase keys
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## Notes

- Use **Chrome** for best speech recognition support
- ElevenLabs TTS automatically falls back to browser speech synthesis if the API key is missing or the request fails
- The Lottie avatar uses a CSS fallback if animation files fail to load
- Interview sessions are persisted in Supabase; in-memory sessions still used for active interviews
