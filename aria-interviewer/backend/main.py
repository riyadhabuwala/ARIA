from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from typing import Optional
from collections import Counter
from interview_agent import agent
from resume_parser import extract_resume_text
from elevenlabs_tts import text_to_speech
from confidence_analyzer import analyze_full_interview
from chat_context_builder import build_context_string
from resume_quality import analyse_resume_quality
from supabase_client import (
    save_interview_session,
    get_user_sessions,
    get_session_by_id,
    get_analytics_data,
    get_user_streak_data,
    get_resume_profile,
    get_latest_job_results,
    save_resume_profile,
    save_resume_quality,
    get_cached_quality,
    create_coach_conversation,
    update_coach_conversation,
    get_coach_conversations,
    add_coach_message,
    get_coach_messages,
    delete_coach_conversation,
)
from job_agent import JobMatchAgent
import uuid
import os
import json
from dotenv import load_dotenv
from groq import AsyncGroq

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(ENV_PATH)

app = FastAPI(title="ARIA Interview API")
job_agent = JobMatchAgent()
chat_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

CHATBOT_SYSTEM_PROMPT = """
You are ARIA Career Coach - a personal AI career advisor embedded
inside the ARIA interview practice platform.

You have been given real data about this specific user below.
Use it to give personalised, specific, and actionable advice.
Always refer to their actual scores, skills, and job data.
Never give generic advice when you have specific data to reference.

PERSONALITY:
- Encouraging but honest - do not sugarcoat weak performance
- Concise - answer in 3-5 sentences unless a detailed plan is asked
- Specific - cite actual numbers from the user data when available
- Actionable - every answer should end with something they can do

SCOPE:
- Only answer: careers, interviews, job search, skills, user ARIA data,
    study plans, resume advice
- If unrelated topic, say:
    "I'm your career coach - I can help with interviews, jobs,
    and your ARIA performance. What would you like to work on?"

FORMAT:
- Use short paragraphs, not large bullet walls
- Do not use markdown or asterisks for emphasis
- Write numbers plainly (e.g., 85/100, 3 filler words)
- For study plans: use numbered steps
- Keep responses under 150 words unless user asks for more detail

HERE IS THE USER'S DATA:
{context}
"""

# ── CORS ─────────────────────────────────────────────────────────
# Allows any localhost port (5173, 5174, 5175, 5176, etc.)
# so Vite's port auto-increment never causes CORS errors

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"(http://localhost:\d+|https://aria[^.]*\.vercel\.app)",
    allow_origins=[
        "https://aria-lyart.vercel.app",
        "https://aria-interviewer.vercel.app",
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


class ChatRequest(BaseModel):
    user_id: str
    message: str
    conversation_history: list = []


class CoachConversationCreate(BaseModel):
    user_id: str
    title: str = "New Chat"
    last_message_preview: str = ""


class CoachMessageCreate(BaseModel):
    user_id: str
    role: str
    content: str
    title: Optional[str] = None
    last_message_preview: Optional[str] = None


class DebriefRequest(BaseModel):
    user_id: str
    report: dict
    confidence_data: Optional[dict] = {}
    previous_score: Optional[int] = 0


class ResumeQualityRequest(BaseModel):
    user_id: str
    force_refresh: bool = False


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
    greeting = await agent.create_session(
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
        result = await agent.send_message(req.session_id, req.message)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/generate-report")
async def generate_report(req: ReportRequest):
    """Generate and return the final performance report as JSON."""
    try:
        report = await agent.generate_report(req.session_id)
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
def analyze_confidence(req: ConfidenceRequest):
    """Analyze all interview answers for confidence metrics."""
    result = analyze_full_interview(req.answers)
    return result


@app.post("/api/save-session")
def save_session(req: SaveSessionRequest):
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
def get_history(user_id: str):
    """Get interview history for a user."""
    sessions = get_user_sessions(user_id)
    return {"sessions": sessions}


@app.get("/api/session/{session_id}")
def get_session(session_id: str):
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
def get_analytics(user_id: str):
    """Get progress analytics for a user."""
    try:
        data = get_analytics_data(user_id)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/streak/{user_id}")
def get_user_streak(user_id: str):
    """Get interview streak data for a user."""
    try:
        sessions = get_user_sessions(user_id)
        if sessions is None:
            raise HTTPException(status_code=404, detail="User not found")
        streak_data = get_user_streak_data(user_id)
        return streak_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


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
def get_profile_route(user_id: str):
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
def get_job_results(user_id: str):
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


@app.post("/api/resume/quality")
async def get_resume_quality(req: ResumeQualityRequest):
    """
    Analyse quality of the user's saved resume.
    Connects job-match missing skills to resume gaps.
    """
    if not req.force_refresh:
        cached = get_cached_quality(req.user_id)
        if cached:
            return {**cached, "cached": True}

    profile_data = get_resume_profile(req.user_id)
    if not profile_data or not profile_data.get("resume_text"):
        raise HTTPException(
            status_code=400,
            detail="No resume found. Please upload your resume first.",
        )

    resume_text = profile_data["resume_text"]
    job_missing_skills: list[str] = []

    try:
        job_results = get_latest_job_results(req.user_id)
        jobs = (job_results or {}).get("jobs") or []
        if jobs:
            all_missing: list[str] = []
            for job in jobs:
                all_missing.extend(job.get("missing_skills") or [])
            skill_counts = Counter(all_missing)
            job_missing_skills = [skill for skill, _ in skill_counts.most_common(8)]
    except Exception:
        job_missing_skills = []

    try:
        result = await analyse_resume_quality(
            resume_text=resume_text,
            job_missing_skills=job_missing_skills,
        )
        try:
            save_resume_quality(req.user_id, result)
        except Exception:
            pass
        return {**result, "cached": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/coach/conversations/{user_id}")
def list_coach_conversations(user_id: str):
    """List stored coach conversations for a user."""
    try:
        conversations = get_coach_conversations(user_id)
        return {"conversations": conversations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/coach/conversations")
def create_coach_conversation_route(req: CoachConversationCreate):
    """Create a new coach conversation."""
    try:
        conversation = create_coach_conversation(
            user_id=req.user_id,
            title=req.title,
            last_message_preview=req.last_message_preview,
        )
        return {"conversation": conversation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/coach/conversations/{conversation_id}/messages")
def list_coach_messages(conversation_id: str, user_id: str):
    """List messages for a coach conversation."""
    try:
        messages = get_coach_messages(user_id, conversation_id)
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/coach/conversations/{conversation_id}/messages")
def add_coach_message_route(conversation_id: str, req: CoachMessageCreate):
    """Add a message to a coach conversation."""
    if req.role not in {"user", "assistant"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    try:
        message = add_coach_message(
            conversation_id=conversation_id,
            user_id=req.user_id,
            role=req.role,
            content=req.content,
        )
        title = req.title
        last_message_preview = req.last_message_preview or req.content[:100]
        if title is None and req.role == "user":
            trimmed = req.content.strip()
            title = (trimmed[:50] + "...") if len(trimmed) > 50 else trimmed
        if title:
            update_coach_conversation(
                conversation_id=conversation_id,
                user_id=req.user_id,
                title=title,
                last_message_preview=last_message_preview,
            )
        return {"message": message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/coach/conversations/{conversation_id}")
def delete_coach_conversation_route(conversation_id: str, user_id: str):
    """Delete a coach conversation and all messages."""
    try:
        delete_coach_conversation(user_id, conversation_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
async def chat_with_coach(req: ChatRequest):
    """Career coach chatbot with user-specific context, streamed via SSE."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message required")

    try:
        context = build_context_string(req.user_id)
    except Exception as e:
        context = "User data temporarily unavailable."
        print(f"Context build error: {e}")

    system_prompt = CHATBOT_SYSTEM_PROMPT.format(context=context)
    history = req.conversation_history[-6:] if req.conversation_history else []

    messages = [{"role": "system", "content": system_prompt}]
    for item in history:
        if isinstance(item, dict) and item.get("role") and item.get("content"):
            messages.append({"role": item["role"], "content": item["content"]})
    messages.append({"role": "user", "content": req.message})

    async def generate():
        try:
            stream = await chat_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.7,
                max_tokens=400,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    yield f"data: {json.dumps({'content': delta.content})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/chat/debrief")
async def generate_debrief(req: DebriefRequest):
    """Generate a proactive post-interview debrief message."""
    report = req.report or {}
    overall_score = report.get("overall_score", 0)
    grade = report.get("grade", "")
    domain = report.get("domain", "your interview")
    hiring_rec = report.get("hiring_recommendation", "")
    sections = report.get("sections") or {}
    question_breakdown = report.get("question_breakdown") or []
    strengths = report.get("strengths") or []
    improvements = report.get("improvement_areas") or []

    weakest_section = None
    weakest_score = 100
    for section_name, section_data in sections.items():
        if isinstance(section_data, dict):
            score = section_data.get("score", 100)
            if score < weakest_score:
                weakest_score = score
                weakest_section = section_name.replace("_", " ").title()

    weakest_question = None
    if question_breakdown:
        sorted_qb = sorted(question_breakdown, key=lambda x: x.get("score", 10))
        if sorted_qb:
            weakest_question = str(sorted_qb[0].get("question", ""))[:80]

    score_change = overall_score - req.previous_score
    score_change_text = ""
    if req.previous_score > 0:
        if score_change > 0:
            score_change_text = f" - up **{score_change} points** from last time"
        elif score_change < 0:
            score_change_text = f" - down {abs(score_change)} points from last time"
        else:
            score_change_text = " - same as last time"

    confidence_score = (
        req.confidence_data.get("overallScore")
        or req.confidence_data.get("overall_score")
        or req.confidence_data.get("confidence_score")
        or 0
    )
    total_fillers = (
        req.confidence_data.get("totalFillers")
        or req.confidence_data.get("total_fillers")
        or req.confidence_data.get("total_filler_words")
        or 0
    )

    debrief_prompt = f"""
You are ARIA Career Coach. The user just completed a {domain} interview.
Generate a SHORT, warm, personalised debrief message (max 4 sentences).

Interview results:
- Score: {overall_score}/100 ({grade}){score_change_text}
- Hiring recommendation: {hiring_rec}
- Weakest section: {weakest_section} ({weakest_score}/100)
- Weakest question: {weakest_question}
- Confidence score: {confidence_score}/100
- Filler words used: {total_fillers}
- Top strength: {strengths[0] if strengths else 'N/A'}
- Top improvement area: {improvements[0] if improvements else 'N/A'}

RULES:
- Start with their score and an honest reaction (celebrate if good, encourage if low)
- Mention ONE specific weakness with the actual score
- End with exactly ONE question offering 2 options
- Use **bold** for numbers e.g. **78/100**
- Max 4 sentences total
- Tone: warm coach, not a robot
- Do NOT say "Great job" if score is below 60
"""

    try:
        response = await chat_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": debrief_prompt}],
            temperature=0.7,
            max_tokens=150,
        )
        debrief_message = (response.choices[0].message.content or "").strip()
        return {"debrief": debrief_message}
    except Exception:
        fallback = (
            f"You scored **{overall_score}/100** ({grade}) in your {domain} interview"
            f"{score_change_text}. "
        )
        if weakest_section:
            fallback += f"Your weakest area was **{weakest_section}** ({weakest_score}/100). "
        fallback += (
            "Want me to explain what a stronger answer looks like, "
            "or create a focused study plan for you?"
        )
        return {"debrief": fallback}


@app.get("/health")
async def health():
    return {"status": "ARIA backend is running"}
