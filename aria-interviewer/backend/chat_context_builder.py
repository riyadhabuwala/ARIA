from collections import Counter

from supabase_client import supabase


def get_user_context(user_id: str) -> dict:
    """Fetch profile, recent interviews, and latest job matches for a user."""
    profile_data = {}
    interviews = []
    job_results = {}

    try:
        result = (
            supabase.table("user_resume_profiles")
            .select("extracted_profile, resume_text, updated_at")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if result.data:
            profile_data = result.data
    except Exception:
        pass

    try:
        result = (
            supabase.table("interview_sessions")
            .select(
                "domain, overall_score, grade, confidence_score,"
                "filler_word_count, duration_seconds, report_json,"
                "confidence_breakdown, created_at"
            )
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(3)
            .execute()
        )
        interviews = result.data or []
    except Exception:
        pass

    try:
        result = (
            supabase.table("job_match_results")
            .select("jobs, queries_used, total_fetched, last_scanned_at")
            .eq("user_id", user_id)
            .order("last_scanned_at", desc=True)
            .limit(1)
            .execute()
        )
        if result.data:
            job_results = result.data[0]
    except Exception:
        pass

    return {
        "profile": profile_data,
        "interviews": interviews,
        "job_results": job_results,
    }


def build_context_string(user_id: str) -> str:
    """Build a concise, prompt-ready context block from Supabase data."""
    data = get_user_context(user_id)
    parts = []

    profile = data.get("profile", {}).get("extracted_profile") or {}
    if profile:
        parts.append("=== CANDIDATE PROFILE ===")
        parts.append(f"Name: {profile.get('full_name', 'Unknown')}")
        parts.append(f"Role: {profile.get('current_role', 'Not specified')}")
        parts.append(
            f"Experience: {profile.get('experience_years', 0)} years"
            f"{' (Fresher)' if profile.get('is_fresher') else ''}"
        )
        parts.append(f"Education: {profile.get('education', 'Not specified')}")
        parts.append(f"Top Skills: {', '.join(profile.get('top_skills', []))}")
        parts.append(f"All Skills: {', '.join(profile.get('skills', [])[:15])}")
        parts.append(
            f"Preferred Locations: {', '.join(profile.get('preferred_locations', []))}"
        )
        parts.append(f"Domain: {profile.get('domain', 'Not specified')}")
        if profile.get("summary"):
            parts.append(f"Summary: {profile['summary']}")
        parts.append("")

    interviews = data.get("interviews") or []
    if interviews:
        parts.append(f"=== INTERVIEW HISTORY (last {len(interviews)} sessions) ===")

        for i, session in enumerate(interviews):
            parts.append(
                f"\n--- Interview {i + 1} ({str(session.get('created_at', ''))[:10]}) ---"
            )
            parts.append(f"Domain: {session.get('domain', 'Unknown')}")
            parts.append(
                f"Score: {session.get('overall_score', 0)}/100 | "
                f"Grade: {session.get('grade', 'Unknown')}"
            )
            parts.append(
                f"Confidence Score: {session.get('confidence_score', 0)}/100"
            )
            parts.append(
                f"Filler Words Used: {session.get('filler_word_count', 0)}"
            )
            duration = session.get("duration_seconds", 0) or 0
            parts.append(f"Duration: {duration // 60}m {duration % 60}s")

            report = session.get("report_json") or session.get("report") or {}
            sections = report.get("sections") or {}
            if sections:
                parts.append("Section Scores:")
                for section_name, section_data in sections.items():
                    if isinstance(section_data, dict):
                        score = section_data.get("score", "N/A")
                        parts.append(f"  - {section_name}: {score}/100")

            strengths = report.get("strengths") or []
            if strengths:
                parts.append(f"Strengths: {'; '.join(strengths[:3])}")

            improvements = report.get("improvement_areas") or []
            if improvements:
                parts.append(f"Areas to Improve: {'; '.join(improvements[:3])}")

            hiring = report.get("hiring_recommendation")
            if hiring:
                parts.append(f"Hiring Recommendation: {hiring}")

            qb = report.get("question_breakdown") or []
            if qb:
                sorted_qb = sorted(qb, key=lambda x: x.get("score", 10))
                parts.append("Weakest Questions:")
                for q in sorted_qb[:3]:
                    parts.append(f"  Q: {str(q.get('question', ''))[:80]}")
                    parts.append(
                        f"  Score: {q.get('score', 0)}/10 | "
                        f"Missing: {q.get('what_was_missing', 'N/A')}"
                    )

            cb = session.get("confidence_breakdown") or {}
            if cb:
                total_fillers = cb.get("total_fillers") or cb.get("total_filler_words") or 0
                avg_words = cb.get("avg_word_count") or cb.get("average_words_per_answer") or 0
                filler_freq = cb.get("filler_frequency") or {}
                tips = cb.get("tips") or cb.get("improvement_tips") or []
                trend = cb.get("confidence_trend", "")

                if total_fillers:
                    parts.append(f"Total Filler Words: {total_fillers}")
                if filler_freq:
                    top_fillers = sorted(
                        filler_freq.items(),
                        key=lambda x: x[1],
                        reverse=True,
                    )[:3]
                    top_fillers_text = ", ".join([f"{w}({c}x)" for w, c in top_fillers])
                    parts.append(f"Most Used Fillers: {top_fillers_text}")
                if avg_words:
                    parts.append(f"Avg Words per Answer: {avg_words}")
                if trend:
                    parts.append(f"Confidence Trend: {trend}")
                if tips:
                    parts.append(f"Communication Tips: {'; '.join(tips[:2])}")

        parts.append("")
    else:
        parts.append("=== INTERVIEW HISTORY ===")
        parts.append("No interviews completed yet.")
        parts.append("")

    job_results = data.get("job_results") or {}
    jobs = job_results.get("jobs") or []
    if jobs:
        parts.append("=== JOB MATCH RESULTS ===")
        last_scan = str(job_results.get("last_scanned_at", ""))[:10]
        total = job_results.get("total_fetched", 0)
        parts.append(f"Last Scanned: {last_scan} | Total Jobs Scanned: {total}")

        parts.append("Top Matched Jobs:")
        for j in jobs[:5]:
            parts.append(
                f"  {j.get('match_score', 0)}% - {j.get('title', '')} at "
                f"{j.get('company', '')} ({j.get('location', '')}) "
                f"[{j.get('verdict', '')}]"
            )
            if j.get("missing_skills"):
                parts.append(f"    Missing: {', '.join(j['missing_skills'][:3])}")

        all_missing = []
        for j in jobs:
            all_missing.extend(j.get("missing_skills") or [])
        if all_missing:
            top_missing = [skill for skill, _ in Counter(all_missing).most_common(5)]
            parts.append(f"Most Common Skill Gaps: {', '.join(top_missing)}")

        queries = job_results.get("queries_used") or []
        if queries:
            parts.append(f"Search Queries Used: {', '.join(queries[:3])}")

        parts.append("")
    else:
        parts.append("=== JOB MATCH RESULTS ===")
        parts.append("No job scan completed yet.")
        parts.append("")

    context = "\n".join(parts).strip()
    return context if context else "No user context available."
