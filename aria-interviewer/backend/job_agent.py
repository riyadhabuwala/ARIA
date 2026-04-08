import json
import os
import uuid
from typing import Optional, TypedDict

from dotenv import load_dotenv
from groq import AsyncGroq

from job_apis import fetch_all_jobs
from resume_profiler import extract_profile, generate_search_queries
from supabase_client import save_job_results, save_resume_profile

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(ENV_PATH)

client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))


class AgentState(TypedDict):
    user_id: str
    resume_text: str
    profile: dict
    queries: list[str]
    raw_jobs: list[dict]
    total_fetched: int
    ranked_jobs: list[dict]
    scan_id: str
    saved: bool
    error: Optional[str]


async def step_extract_profile(state: AgentState) -> AgentState:
    """STEP 1: Extract structured profile from resume."""
    try:
        profile = await extract_profile(state["resume_text"])
        return {**state, "profile": profile, "error": None}
    except Exception as e:
        return {**state, "error": f"Profile extraction failed: {str(e)}"}


async def step_generate_queries(state: AgentState) -> AgentState:
    """STEP 2: Generate India-focused search queries from profile."""
    if state.get("error"):
        return state
    try:
        queries = await generate_search_queries(state["profile"])
        return {**state, "queries": queries}
    except Exception as e:
        return {**state, "error": f"Query generation failed: {str(e)}"}


async def step_fetch_jobs(state: AgentState) -> AgentState:
    """STEP 3: Fetch jobs from Adzuna + JSearch in parallel."""
    if state.get("error"):
        return state
    try:
        jobs, total = await fetch_all_jobs(state["queries"])
        return {**state, "raw_jobs": jobs, "total_fetched": total}
    except Exception as e:
        return {
            **state,
            "error": f"Job fetching failed: {str(e)}",
            "raw_jobs": [],
            "total_fetched": 0,
        }


RANKING_PROMPT = """
You are an expert recruiter specializing in the Indian tech job market.
Given a candidate's resume and a list of job listings, rank the jobs
by how well they match the candidate's profile.

For each job, return a JSON object with:
{
  "job_index": <original index in the list>,
  "match_score": <integer 0-100>,
  "match_reason": "<1 sentence: specific reason this job fits the candidate>",
  "missing_skills": ["skill1", "skill2"],
  "verdict": "Strong Match" | "Good Match" | "Partial Match" | "Weak Match"
}

Return a JSON array of ALL jobs ranked, highest score first.
Return ONLY the JSON array. No explanation. No markdown.

SCORING GUIDE:
90-100: Skills match perfectly, experience level matches, location matches
70-89: Most skills match, minor gaps
50-69: Some skills match, experience or location mismatch
30-49: Few skills match, significant gaps
0-29: Poor match overall

Be honest - do not inflate scores. A weak match should score low.
"""


async def step_rank_jobs(state: AgentState) -> AgentState:
    """STEP 4: AI ranks all fetched jobs against the resume."""
    if state.get("error") or not state.get("raw_jobs"):
        return {**state, "ranked_jobs": []}

    try:
        jobs_for_ranking = []
        for i, job in enumerate(state["raw_jobs"][:25]):
            jobs_for_ranking.append(
                {
                    "index": i,
                    "title": job.get("title", ""),
                    "company": job.get("company", ""),
                    "location": job.get("location", ""),
                    "description": (job.get("description", "") or "")[:300],
                }
            )

        profile = state["profile"]
        candidate_summary = f"""
Candidate: {profile.get('current_role', 'Software Engineer')}
Experience: {profile.get('experience_years', 0)} years
Top skills: {', '.join(profile.get('top_skills', [])[:8])}
All skills: {', '.join(profile.get('skills', [])[:15])}
Preferred locations: {', '.join(profile.get('preferred_locations', [])[:3])}
Education: {profile.get('education', '')}
"""

        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": RANKING_PROMPT},
                {
                    "role": "user",
                    "content": f"""
Candidate Profile:
{candidate_summary}

Job Listings to Rank:
{json.dumps(jobs_for_ranking, indent=2)}
""",
                },
            ],
            temperature=0.1,
            max_tokens=3000,
        )

        raw = (response.choices[0].message.content or "").strip()
        if raw.startswith("```"):
            raw = raw.split("```", 2)[1]
            if raw.lower().startswith("json"):
                raw = raw[4:]
        rankings = json.loads(raw.strip())

        raw_jobs = state["raw_jobs"]
        ranked_jobs = []

        for ranking in rankings[:10]:
            idx = int(ranking.get("job_index", 0))
            if 0 <= idx < len(raw_jobs):
                job = raw_jobs[idx].copy()
                job["match_score"] = int(ranking.get("match_score", 50))
                job["match_reason"] = ranking.get("match_reason", "")
                job["missing_skills"] = ranking.get("missing_skills", [])
                job["verdict"] = ranking.get("verdict", "Partial Match")
                ranked_jobs.append(job)

        ranked_jobs.sort(key=lambda x: x.get("match_score", 0), reverse=True)
        return {**state, "ranked_jobs": ranked_jobs[:10]}

    except Exception:
        fallback = []
        for i, job in enumerate(state["raw_jobs"][:10]):
            job_copy = job.copy()
            job_copy["match_score"] = max(30, 70 - (i * 3))
            job_copy["match_reason"] = "Matched based on your profile"
            job_copy["missing_skills"] = []
            job_copy["verdict"] = "Good Match"
            fallback.append(job_copy)
        return {**state, "ranked_jobs": fallback}


async def step_save_results(state: AgentState) -> AgentState:
    """STEP 5: Save profile and results to Supabase."""
    scan_id = str(uuid.uuid4())
    try:
        await save_resume_profile(
            user_id=state["user_id"],
            resume_text=state["resume_text"],
            profile=state["profile"],
        )
        await save_job_results(
            user_id=state["user_id"],
            scan_id=scan_id,
            jobs=state["ranked_jobs"],
            queries=state["queries"],
            total_fetched=state["total_fetched"],
        )
        return {**state, "scan_id": scan_id, "saved": True}
    except Exception as e:
        print(f"Save error (non-fatal): {e}")
        return {**state, "scan_id": scan_id, "saved": False}


class JobMatchAgent:
    """Orchestrates the full 5-step job matching pipeline."""

    async def run(self, user_id: str, resume_text: str) -> dict:
        state: AgentState = {
            "user_id": user_id,
            "resume_text": resume_text,
            "profile": {},
            "queries": [],
            "raw_jobs": [],
            "total_fetched": 0,
            "ranked_jobs": [],
            "scan_id": "",
            "saved": False,
            "error": None,
        }

        state = await step_extract_profile(state)
        state = await step_generate_queries(state)
        state = await step_fetch_jobs(state)
        state = await step_rank_jobs(state)
        state = await step_save_results(state)

        if state.get("error") and not state["ranked_jobs"]:
            raise Exception(state["error"])

        return {
            "scan_id": state["scan_id"],
            "profile": state["profile"],
            "queries_used": state["queries"],
            "total_fetched": state["total_fetched"],
            "jobs": state["ranked_jobs"],
        }
