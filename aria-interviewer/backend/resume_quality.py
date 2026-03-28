import json
import os
from typing import Any

from dotenv import load_dotenv
from groq import Groq

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(ENV_PATH)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

QUALITY_ANALYSIS_PROMPT = """
You are an expert resume reviewer and ATS specialist with 10 years
of experience reviewing resumes for top Indian tech companies
(Google, Amazon, Flipkart, Zomato, Zepto, etc.).

Analyse this resume thoroughly and return a JSON object with
EXACTLY this structure - no extra fields, no markdown:

{
  "overall_score": <integer 0-100>,
  "grade": "<Excellent|Good|Needs Work|Poor>",
  "grade_reason": "<1 sentence explaining the overall score>",

  "sections": {
    "contact_info":     { "present": <bool>, "score": <0-10>, "note": "<specific note>" },
    "professional_summary": { "present": <bool>, "score": <0-10>, "note": "<specific note>" },
    "work_experience":  { "present": <bool>, "score": <0-10>, "note": "<specific note>" },
    "education":        { "present": <bool>, "score": <0-10>, "note": "<specific note>" },
    "skills":           { "present": <bool>, "score": <0-10>, "note": "<specific note>" },
    "projects":         { "present": <bool>, "score": <0-10>, "note": "<specific note>" },
    "achievements":     { "present": <bool>, "score": <0-10>, "note": "<specific note>" },
    "certifications":   { "present": <bool>, "score": <0-10>, "note": "<specific note>" }
  },

  "ats_analysis": {
    "target_role": "<the most likely role this resume targets>",
    "keyword_match_percent": <integer 0-100>,
    "keywords_found": ["keyword1", "keyword2"],
    "keywords_missing": ["keyword1", "keyword2"],
    "ats_friendly": <bool>,
    "ats_issues": ["issue1", "issue2"]
  },

  "quantification_score": <integer 0-10>,
  "quantification_note": "<are there numbers/metrics in achievements?>",

  "length_assessment": "<Too Short|Good Length|Too Long>",
  "length_note": "<specific note about resume length>",

  "improvements": [
    {
      "priority": 1,
      "title": "<short title>",
      "description": "<specific, actionable improvement - 1-2 sentences>",
      "impact": "<High|Medium|Low>"
    },
    {
      "priority": 2,
      "title": "<short title>",
      "description": "<specific, actionable improvement>",
      "impact": "<High|Medium|Low>"
    },
    {
      "priority": 3,
      "title": "<short title>",
      "description": "<specific, actionable improvement>",
      "impact": "<High|Medium|Low>"
    }
  ],

  "strengths": ["strength1", "strength2", "strength3"]
}

SCORING GUIDE for overall_score:
- 90-100: Excellent - strong sections, quantified achievements, ATS optimised
- 70-89:  Good - most sections present, minor gaps
- 50-69:  Needs Work - key sections missing or weak
- 0-49:   Poor - major structural problems

Be honest and specific. Do not inflate scores.
If a section is missing, mark present: false and score: 0.
Return ONLY the JSON object. No explanation before or after.
"""


def _normalize_quality_result(result: dict[str, Any]) -> dict[str, Any]:
    """Ensure the response always matches the required schema."""
    safe = _empty_result("Unknown")

    safe["overall_score"] = int(result.get("overall_score", safe["overall_score"]) or 0)
    safe["overall_score"] = max(0, min(100, safe["overall_score"]))

    grade = str(result.get("grade", safe["grade"]) or safe["grade"]).strip()
    safe["grade"] = grade if grade in {"Excellent", "Good", "Needs Work", "Poor"} else "Needs Work"

    grade_reason = str(result.get("grade_reason", "") or "").strip()
    safe["grade_reason"] = grade_reason or "Resume quality analysed."

    section_keys = [
        "contact_info",
        "professional_summary",
        "work_experience",
        "education",
        "skills",
        "projects",
        "achievements",
        "certifications",
    ]
    sections = result.get("sections") if isinstance(result.get("sections"), dict) else {}
    safe_sections: dict[str, Any] = {}
    for key in section_keys:
        value = sections.get(key) if isinstance(sections.get(key), dict) else {}
        score = int(value.get("score", 0) or 0)
        score = max(0, min(10, score))
        safe_sections[key] = {
            "present": bool(value.get("present", False)),
            "score": score,
            "note": str(value.get("note", "") or "").strip(),
        }
    safe["sections"] = safe_sections

    ats = result.get("ats_analysis") if isinstance(result.get("ats_analysis"), dict) else {}
    keyword_match_percent = int(ats.get("keyword_match_percent", 0) or 0)
    safe["ats_analysis"] = {
        "target_role": str(ats.get("target_role", "Unknown") or "Unknown"),
        "keyword_match_percent": max(0, min(100, keyword_match_percent)),
        "keywords_found": [str(k) for k in (ats.get("keywords_found") or []) if str(k).strip()],
        "keywords_missing": [str(k) for k in (ats.get("keywords_missing") or []) if str(k).strip()],
        "ats_friendly": bool(ats.get("ats_friendly", False)),
        "ats_issues": [str(i) for i in (ats.get("ats_issues") or []) if str(i).strip()],
    }

    quantification_score = int(result.get("quantification_score", 0) or 0)
    safe["quantification_score"] = max(0, min(10, quantification_score))
    safe["quantification_note"] = str(result.get("quantification_note", "") or "").strip()

    length_assessment = str(result.get("length_assessment", "Unknown") or "Unknown").strip()
    safe["length_assessment"] = (
        length_assessment if length_assessment in {"Too Short", "Good Length", "Too Long"} else "Good Length"
    )
    safe["length_note"] = str(result.get("length_note", "") or "").strip()

    improvements = result.get("improvements") if isinstance(result.get("improvements"), list) else []
    safe_improvements = []
    for idx, item in enumerate(improvements[:3], start=1):
        if not isinstance(item, dict):
            continue
        impact = str(item.get("impact", "Medium") or "Medium").strip()
        if impact not in {"High", "Medium", "Low"}:
            impact = "Medium"
        safe_improvements.append(
            {
                "priority": idx,
                "title": str(item.get("title", "") or "").strip() or f"Improvement {idx}",
                "description": str(item.get("description", "") or "").strip() or "Add more specific details.",
                "impact": impact,
            }
        )
    safe["improvements"] = safe_improvements

    safe["strengths"] = [str(s) for s in (result.get("strengths") or []) if str(s).strip()][:3]
    return safe


async def analyse_resume_quality(resume_text: str, job_missing_skills: list[str] | None = None) -> dict:
    """
    Analyse resume quality using Groq AI and return a structured report.

    job_missing_skills: list of skills missing from job matches to include
    in connected insights.
    """
    if not resume_text or len(resume_text.strip()) < 100:
        return _empty_result("Resume text too short to analyse")

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": QUALITY_ANALYSIS_PROMPT},
                {"role": "user", "content": f"Resume to analyse:\n\n{resume_text[:5000]}"},
            ],
            temperature=0.1,
            max_tokens=2000,
        )

        raw = (response.choices[0].message.content or "").strip()

        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        parsed = json.loads(raw)
        result = _normalize_quality_result(parsed)

        if job_missing_skills:
            resume_skills_lower = resume_text.lower()
            missing_from_resume = [
                skill for skill in job_missing_skills if skill and skill.lower() not in resume_skills_lower
            ][:5]
            result["job_match_insights"] = {
                "skills_to_add": missing_from_resume,
                "total_job_missing": len(job_missing_skills),
                "message": "These skills appear in your job matches but are missing from your resume",
            }
        else:
            result["job_match_insights"] = None

        return result

    except json.JSONDecodeError:
        return _empty_result("Could not parse AI response")
    except Exception as e:
        raise Exception(f"Resume analysis failed: {str(e)}")


def _empty_result(reason: str) -> dict:
    return {
        "overall_score": 0,
        "grade": "Unknown",
        "grade_reason": reason,
        "sections": {
            "contact_info": {"present": False, "score": 0, "note": ""},
            "professional_summary": {"present": False, "score": 0, "note": ""},
            "work_experience": {"present": False, "score": 0, "note": ""},
            "education": {"present": False, "score": 0, "note": ""},
            "skills": {"present": False, "score": 0, "note": ""},
            "projects": {"present": False, "score": 0, "note": ""},
            "achievements": {"present": False, "score": 0, "note": ""},
            "certifications": {"present": False, "score": 0, "note": ""},
        },
        "ats_analysis": {
            "target_role": "Unknown",
            "keyword_match_percent": 0,
            "keywords_found": [],
            "keywords_missing": [],
            "ats_friendly": False,
            "ats_issues": [],
        },
        "quantification_score": 0,
        "quantification_note": "",
        "length_assessment": "Unknown",
        "length_note": "",
        "improvements": [],
        "strengths": [],
        "job_match_insights": None,
    }
