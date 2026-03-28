import json
import os

from dotenv import load_dotenv
from groq import Groq

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(ENV_PATH)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

PROFILE_EXTRACTION_PROMPT = """
You are an expert resume parser for the Indian job market.
Analyze this resume and extract a structured profile.

Return ONLY a valid JSON object with exactly these fields:
{
  "full_name": "candidate's full name or empty string",
  "current_role": "most recent job title or expected role if fresher",
  "experience_years": <integer, 0 if fresher>,
  "is_fresher": <true if 0-1 years experience>,
  "skills": ["skill1", "skill2", ...],
  "top_skills": ["top 5 most prominent skills only"],
  "education": "highest degree + field + college name",
  "preferred_locations": ["city1", "city2"],
  "job_titles_to_search": [
    "exact job title 1 to search for",
    "exact job title 2 to search for",
    "exact job title 3 to search for"
  ],
  "domain": "primary domain e.g. Software Engineering / Data Science / Web Development",
  "summary": "2 sentence professional summary of this candidate"
}

RULES:
- preferred_locations: if resume mentions a city, use it.
  Otherwise default to ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune"]
- job_titles_to_search: think about what this person would search on Naukri/LinkedIn
  e.g. "Python Developer", "SDE 1", "Junior Data Scientist"
- skills: extract ALL technical skills mentioned
- top_skills: pick the 5 most valuable/prominent ones
- Return pure JSON only - no markdown, no explanation
"""


async def extract_profile(resume_text: str) -> dict:
    """Use Groq to extract a structured professional profile from resume text."""
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": PROFILE_EXTRACTION_PROMPT},
                {"role": "user", "content": f"Resume:\n{(resume_text or '')[:4000]}"},
            ],
            temperature=0.1,
            max_tokens=1000,
        )
        raw = (response.choices[0].message.content or "").strip()

        if raw.startswith("```"):
            raw = raw.split("```", 2)[1]
            if raw.lower().startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        profile = json.loads(raw)
        return profile

    except json.JSONDecodeError:
        return {
            "full_name": "",
            "current_role": "Software Engineer",
            "experience_years": 0,
            "is_fresher": True,
            "skills": [],
            "top_skills": [],
            "education": "",
            "preferred_locations": ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune"],
            "job_titles_to_search": ["Software Engineer", "Developer", "SDE 1"],
            "domain": "Software Engineering",
            "summary": "Candidate seeking opportunities in software roles.",
        }
    except Exception as e:
        raise Exception(f"Profile extraction failed: {str(e)}")


QUERY_GENERATION_PROMPT = """
You are a job search expert specializing in the Indian job market.
Given a candidate profile, generate exactly 4 targeted search queries
for Indian job portals like Naukri, LinkedIn India, and Indeed India.

Return ONLY a JSON array of 4 strings. No explanation.
Example: ["Python developer Mumbai 2 years", "Backend engineer Pune Django"]

RULES:
- Make queries specific and realistic - what a human would type on Naukri
- Mix location variants: use both specific city and "India"
- If fresher: add "fresher" or "0-2 years" or "entry level" to some queries
- If experienced: include years of experience
- Queries should cover different angles of the same profile
- Keep each query under 8 words
"""


async def generate_search_queries(profile: dict) -> list[str]:
    """Use Groq to generate smart, India-focused job search queries."""
    try:
        profile_summary = f"""
Role: {profile.get('current_role', 'Software Engineer')}
Experience: {profile.get('experience_years', 0)} years
Top skills: {', '.join(profile.get('top_skills', [])[:5])}
Locations: {', '.join(profile.get('preferred_locations', ['Bangalore'])[:3])}
Is fresher: {profile.get('is_fresher', False)}
Job titles to search: {', '.join(profile.get('job_titles_to_search', []))}
"""

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": QUERY_GENERATION_PROMPT},
                {"role": "user", "content": profile_summary},
            ],
            temperature=0.3,
            max_tokens=200,
        )
        raw = (response.choices[0].message.content or "").strip()

        if raw.startswith("```"):
            raw = raw.split("```", 2)[1]
            if raw.lower().startswith("json"):
                raw = raw[4:]

        queries = json.loads(raw.strip())
        if isinstance(queries, list):
            cleaned = [str(q).strip() for q in queries if str(q).strip()]
            if len(cleaned) >= 4:
                return cleaned[:4]
            if cleaned:
                while len(cleaned) < 4:
                    cleaned.append(cleaned[-1])
                return cleaned[:4]

    except Exception:
        pass

    role = profile.get("current_role", "Software Engineer")
    location = (profile.get("preferred_locations") or ["Bangalore"])[0]
    top_skill = (profile.get("top_skills") or ["Python"])[0]
    is_fresher = bool(profile.get("is_fresher"))

    return [
        f"{role} {location}",
        f"{role} India",
        f"{top_skill} developer India",
        f"{role} fresher India" if is_fresher else f"Senior {role} India",
    ]
