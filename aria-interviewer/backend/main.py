from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from interview_agent import agent
from resume_parser import extract_resume_text
from elevenlabs_tts import text_to_speech
from confidence_analyzer import analyze_full_interview
from supabase_client import (
    save_interview_session,
    get_user_sessions,
    get_session_by_id,
    get_analytics_data,
    get_resume_profile,
    get_latest_job_results,
    save_resume_profile,
)
from job_agent import JobMatchAgent
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ARIA Interview API")
job_agent = JobMatchAgent()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://aria-interviewer.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── MODELS ──────────────────────────────────────────────────────

class StartRequest(BaseModel):
    domain: str
    candidate_name: str
    resume_text: str = ""


class MessageRequest(BaseModel):
    session_id: str
    message: str


class ReportRequest(BaseModel):
    session_id: str


class SaveSessionRequest(BaseModel):
    user_id: str
    domain: str
    candidate_name: str
    report: dict
    confidence_data: dict
    confidence_breakdown: dict = {}
    duration_seconds: int
    messages: list = []


class ConfidenceRequest(BaseModel):
    answers: list[str]


class SaveResumeRequest(BaseModel):
    user_id: str
    resume_text: str
    filename: str = ""


class ScanRequest(BaseModel):
    user_id: str


# ── ROUTES ──────────────────────────────────────────────────────

@app.post("/api/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """Upload PDF resume and get extracted text back."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    content = await file.read()
    text = extract_resume_text(content)
    return {"resume_text": text}


@app.post("/api/start-interview")
async def start_interview(req: StartRequest):
    """Create new interview session, return session_id + opening message."""
    session_id = str(uuid.uuid4())
    greeting = agent.create_session(
        session_id=session_id,
        domain=req.domain,
        candidate_name=req.candidate_name,
        resume_text=req.resume_text
    )
    return {
        "session_id": session_id,
        "message": greeting,
        "is_done": False
    }


@app.post("/api/send-message")
async def send_message(req: MessageRequest):
    """Send candidate answer, receive next question or completion signal."""
    try:
        result = agent.send_message(req.session_id, req.message)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/generate-report")
async def generate_report(req: ReportRequest):
    """Generate and return the final performance report as JSON."""
    try:
        report = agent.generate_report(req.session_id)
        agent.end_session(req.session_id)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@app.post("/api/text-to-speech")
async def tts_endpoint(request: dict):
    """Convert AI message text to speech audio."""
    text = request.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    try:
        audio_bytes = await text_to_speech(text)
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


@app.post("/api/analyze-confidence")
async def analyze_confidence(req: ConfidenceRequest):
    """Analyze all interview answers for confidence metrics."""
    result = analyze_full_interview(req.answers)
    return result


@app.post("/api/save-session")
async def save_session(req: SaveSessionRequest):
    """Save completed interview to database."""
    try:
        saved = save_interview_session(
            user_id=req.user_id,
            domain=req.domain,
            candidate_name=req.candidate_name,
            report=req.report,
            confidence_data=req.confidence_data,
            confidence_breakdown=req.confidence_breakdown,
            duration_seconds=req.duration_seconds,
            messages=req.messages,
        )
        return {"success": True, "session_id": saved.get("id")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history/{user_id}")
async def get_history(user_id: str):
    """Get interview history for a user."""
    sessions = get_user_sessions(user_id)
    return {"sessions": sessions}


@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """Get full session details by ID."""
    try:
        session = get_session_by_id(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/{user_id}")
async def get_analytics(user_id: str):
    """Get progress analytics for a user."""
    try:
        data = get_analytics_data(user_id)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/profile/save-resume")
async def save_resume_route(req: SaveResumeRequest):
    """Save resume text to user profile for future scans."""
    try:
        await save_resume_profile(
            user_id=req.user_id,
            resume_text=req.resume_text,
            profile={},
            resume_filename=req.filename,
        )
        return {"success": True, "message": "Resume saved to profile"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/profile/{user_id}")
async def get_profile_route(user_id: str):
    """Get saved resume and extracted profile for user."""
    profile = get_resume_profile(user_id)
    if not profile:
        return {"has_resume": False}
    return {
        "has_resume": True,
        "filename": profile.get("resume_filename", ""),
        "extracted_profile": profile.get("extracted_profile"),
        "updated_at": profile.get("updated_at"),
    }


@app.post("/api/job-match/scan")
async def run_job_scan(req: ScanRequest):
    """Run the job match pipeline using the user's saved resume."""
    profile_data = get_resume_profile(req.user_id)
    if not profile_data or not profile_data.get("resume_text"):
        raise HTTPException(
            status_code=400,
            detail="No resume found. Please upload your resume first.",
        )

    try:
        result = await job_agent.run(
            user_id=req.user_id,
            resume_text=profile_data["resume_text"],
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/job-match/results/{user_id}")
async def get_job_results(user_id: str):
    """Get the most recent job match result set for a user."""
    results = get_latest_job_results(user_id)
    if not results:
        return {"has_results": False}
    return {
        "has_results": True,
        "scan_id": results.get("scan_id"),
        "jobs": results.get("jobs", []),
        "queries_used": results.get("queries_used", []),
        "total_fetched": results.get("total_fetched", 0),
        "last_scanned_at": results.get("last_scanned_at"),
    }


@app.get("/health")
async def health():
    return {"status": "ARIA backend is running"}
