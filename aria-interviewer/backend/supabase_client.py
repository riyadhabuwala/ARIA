import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)


def save_interview_session(
    user_id: str,
    domain: str,
    candidate_name: str,
    report: dict,
    confidence_data: dict,
    duration_seconds: int
) -> dict:
    """Save completed interview session to Supabase."""
    data = {
        "user_id": user_id,
        "domain": domain,
        "candidate_name": candidate_name,
        "overall_score": report.get("overall_score"),
        "grade": report.get("grade"),
        "summary": report.get("summary"),
        "report_json": report,
        "confidence_score": confidence_data.get("confidence_score", 0),
        "filler_word_count": confidence_data.get("total_filler_words", 0),
        "duration_seconds": duration_seconds,
    }

    result = supabase.table("interview_sessions").insert(data).execute()
    return result.data[0] if result.data else {}


def get_user_sessions(user_id: str) -> list:
    """Get all interview sessions for a user, newest first."""
    result = (
        supabase.table("interview_sessions")
        .select("id, domain, candidate_name, overall_score, grade, created_at, duration_seconds, confidence_score")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def get_session_by_id(session_id: str) -> dict:
    """Get full details of a single interview session."""
    result = (
        supabase.table("interview_sessions")
        .select("*")
        .eq("id", session_id)
        .single()
        .execute()
    )
    return result.data or {}
