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
    duration_seconds: int,
    messages: list = None,
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
        "confidence_json": confidence_data,
        "filler_word_count": confidence_data.get("total_filler_words", 0),
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
