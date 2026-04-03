# ARIA — AI Recruitment Interview Assistant

An AI-powered mock interview platform that conducts realistic voice-based interviews and generates detailed performance reports. ARIA helps users prepare for job interviews with personalized questions, real-time confidence analysis, and comprehensive feedback.

## 🎯 Key Features

- **Voice-Based Interviews** — Realistic conversational interviews using browser Speech APIs
- **AI-Powered Interviewer** — Adaptive questions powered by Groq AI
- **Multiple Domains** — Software Engineering, Web Development, Data Science, AI, HR
- **Resume Upload** — Personalized questions based on your PDF resume
- **Natural TTS** — ElevenLabs voice synthesis with browser fallback
- **Animated Avatar** — Lottie-animated ARIA with visual indicators
- **Confidence Analysis** — Real-time filler word detection and confidence scoring
- **Interview Recording** — Record, playback, and download your interview audio
- **Interview History** — Dashboard with past interview summaries and trends
- **Detailed Reports** — Performance scores, hiring recommendations, and improvement tips

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, FastAPI, Groq SDK, Supabase |
| **Frontend** | React (Vite), Tailwind CSS, Lottie, Recharts |
| **Voice** | ElevenLabs TTS, Web Speech API |
| **Auth & DB** | Supabase (Auth + PostgreSQL) |

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- API keys: Groq, ElevenLabs, Supabase

### Backend Setup
```bash
cd aria-interviewer/backend
pip install -r requirements.txt

# Configure .env with your API keys
# GROQ_API_KEY, ELEVENLABS_API_KEY, SUPABASE_URL, etc.

uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd aria-interviewer/frontend
npm install

# Configure .env with Supabase credentials
# VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

npm run dev
```

Visit `http://localhost:5173` (frontend runs here)

## 📖 Full Documentation

For detailed setup instructions, API endpoints, database schema, project structure, and troubleshooting, see [aria-interviewer/README.md](aria-interviewer/README.md).

## 🎮 Usage

1. Open the application at `http://localhost:5173`
2. Sign up or log in with your email
3. Start a new interview and select a domain
4. Optionally upload your resume for personalized questions
5. Speak your answers using the microphone
6. Receive real-time confidence feedback
7. Get a detailed performance report with scores and recommendations
8. Download your interview recording

## 📂 Project Structure

```
ARIA-project/
├── aria-interviewer/
│   ├── backend/          # FastAPI server + AI logic
│   ├── frontend/         # React UI + interview interface
│   └── README.md         # Detailed documentation
├── .gitignore
└── README.md             # This file
```

## 🔑 Environment Variables

### Backend (.env)
- `GROQ_API_KEY` — Groq API key for AI
- `ELEVENLABS_API_KEY` — ElevenLabs API key for voice
- `ELEVENLABS_VOICE_ID` — Voice ID (default: EXAVITQu4vr4xnSDxMaL)
- `SUPABASE_URL` — Your Supabase project URL
- `SUPABASE_SERVICE_KEY` — Supabase service role key

### Frontend (.env)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key

## 💡 Key Highlights

- **Dark Mode** — Professional dark theme for better focus
- **Progressive Enhancement** — Works without ElevenLabs/Lottie (graceful fallbacks)
- **Real-Time Analysis** — Live confidence scoring and filler word detection
- **Responsive Design** — Works on desktop and tablet browsers
- **Chrome Optimized** — Best results with Chrome/Edge for speech recognition

## 🐛 Troubleshooting

- **Speech not working?** Use Chrome/Edge browser
- **No audio output?** Check ElevenLabs API key or ensure browser allows audio
- **Can't upload resume?** Ensure it's a valid PDF file
- **Backend connection failed?** Verify backend is running on port 8000

## 📝 Recent Updates

- UI improvements for professional interviews
- Dark theme consistency across the app
- Enhanced confidence analysis accuracy

## 🤝 Contributing

This is an AI interview practice platform. Feel free to fork, improve, and deploy your own version.

## 📄 License

This project is open source and available under the MIT License.

---

**Get started now:** Follow the [Quick Start](#-quick-start) section above to set up ARIA locally!
