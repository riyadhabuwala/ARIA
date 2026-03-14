import os
from datetime import datetime, timedelta, timezone

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
    duration_seconds: int,
    confidence_breakdown: dict = None,
    messages: list = None,
) -> dict:
    """Save completed interview session to Supabase."""
    breakdown = confidence_breakdown or confidence_data or {}
    data = {
        "user_id": user_id,
        "domain": domain,
        "candidate_name": candidate_name,
        "overall_score": report.get("overall_score"),
        "grade": report.get("grade"),
        "summary": report.get("summary"),
        "report_json": report,
        "confidence_score": breakdown.get("confidence_score", breakdown.get("overall_score", 0)),
        "confidence_json": confidence_data,
        "confidence_breakdown": breakdown,
        "filler_word_count": breakdown.get("total_filler_words", breakdown.get("total_fillers", 0)),
        "duration_seconds": duration_seconds,
        "messages_json": messages or [],
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
    """Get a single interview session by ID with full report data."""
    result = (
        supabase.table("interview_sessions")
        .select("*")
        .eq("id", session_id)
        .single()
        .execute()
    )
    return result.data or {}


def get_analytics_data(user_id: str) -> dict:
    """Get aggregated analytics for a user's interview history."""
    result = (
        supabase.table("interview_sessions")
        .select("overall_score, confidence_score, domain, created_at, grade")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .execute()
    )
    sessions = result.data or []

    if not sessions:
        return {"has_data": False}

    scores = [s["overall_score"] for s in sessions if s["overall_score"]]
    confidence = [s["confidence_score"] for s in sessions if s["confidence_score"]]

    score_trend = [
        {
            "date": s["created_at"][:10],
            "score": s["overall_score"],
            "confidence": s["confidence_score"]
        }
        for s in sessions
    ]

    domain_counts = {}
    domain_avg_scores = {}
    for s in sessions:
        d = s["domain"]
        domain_counts[d] = domain_counts.get(d, 0) + 1
        if d not in domain_avg_scores:
            domain_avg_scores[d] = []
        if s["overall_score"]:
            domain_avg_scores[d].append(s["overall_score"])

    domain_stats = [
        {
            "domain": d,
            "count": domain_counts[d],
            "avg_score": round(
                sum(domain_avg_scores.get(d, [0])) /
                max(len(domain_avg_scores.get(d, [1])), 1)
            )
        }
        for d in domain_counts
    ]

    grade_counts = {}
    for s in sessions:
        g = s.get("grade", "Unknown")
        grade_counts[g] = grade_counts.get(g, 0) + 1

    return {
        "has_data": True,
        "total_interviews": len(sessions),
        "average_score": round(sum(scores) / max(len(scores), 1)),
        "best_score": max(scores) if scores else 0,
        "average_confidence": round(sum(confidence) / max(len(confidence), 1)),
        "score_trend": score_trend,
        "domain_stats": domain_stats,
        "grade_distribution": [
            {"grade": g, "count": c} for g, c in grade_counts.items()
        ],
        "improvement": scores[-1] - scores[0] if len(scores) > 1 else 0
    }


async def save_resume_profile(
    user_id: str,
    resume_text: str,
    profile: dict,
    resume_filename: str = "",
) -> None:
    """Save or update a user's resume profile."""
    payload = {
        "user_id": user_id,
        "resume_text": resume_text,
        "extracted_profile": profile,
    }
    if resume_filename:
        payload["resume_filename"] = resume_filename
    supabase.table("user_resume_profiles").upsert(payload, on_conflict="user_id").execute()


def get_resume_profile(user_id: str) -> dict | None:
    """Get saved resume profile for a user."""
    result = (
        supabase.table("user_resume_profiles")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    data = result.data or []
    return data[0] if data else None


async def save_job_results(
    user_id: str,
    scan_id: str,
    jobs: list,
    queries: list,
    total_fetched: int,
) -> None:
    """Save job matching scan results."""
    supabase.table("job_match_results").insert(
        {
            "user_id": user_id,
            "scan_id": scan_id,
            "jobs": jobs,
            "queries_used": queries,
            "total_fetched": total_fetched,
        }
    ).execute()


def get_latest_job_results(user_id: str) -> dict | None:
    """Get the latest saved job match scan for a user."""
    result = (
        supabase.table("job_match_results")
        .select("*")
        .eq("user_id", user_id)
        .order("last_scanned_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def save_resume_quality(user_id: str, quality_data: dict) -> None:
    """Cache resume quality score to avoid re-running on every visit."""
    supabase.table("user_resume_profiles").update(
        {
            "quality_score": quality_data,
            "quality_analysed_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("user_id", user_id).execute()


def get_cached_quality(user_id: str) -> dict | None:
    """
    Get cached quality score if analysed within last 24 hours.
    Returns None if stale or missing.
    """
    try:
        result = (
            supabase.table("user_resume_profiles")
            .select("quality_score, quality_analysed_at")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if not result.data:
            return None

        quality = result.data.get("quality_score")
        analysed_at = result.data.get("quality_analysed_at")
        if not quality or not analysed_at:
            return None

        analysed_time = datetime.fromisoformat(analysed_at.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) - analysed_time > timedelta(hours=24):
            return None

        return quality
    except Exception:
        return None
