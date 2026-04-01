import asyncio
import os

import httpx
from dotenv import load_dotenv

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(ENV_PATH)

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")


async def fetch_adzuna(query: str, location: str = "india") -> list[dict]:
    """Fetch jobs from Adzuna India API and normalize them."""
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        return []

    url = "https://api.adzuna.com/v1/api/jobs/in/search/1"
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "what": query,
        "where": location,
        "results_per_page": 10,
        "content-type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            results = data.get("results", [])

        normalized = []
        for job in results:
            normalized.append(
                {
                    "title": job.get("title", ""),
                    "company": job.get("company", {}).get("display_name", "Unknown"),
                    "location": job.get("location", {}).get("display_name", "India"),
                    "description": (job.get("description", "") or "")[:500],
                    "salary_min": job.get("salary_min"),
                    "salary_max": job.get("salary_max"),
                    "apply_url": job.get("redirect_url", ""),
                    "created": job.get("created", ""),
                    "source": "Adzuna",
                    "id": str(job.get("id", "")),
                }
            )
        return normalized
    except Exception as e:
        print(f"Adzuna API error: {e}")
        return []


async def fetch_jsearch(query: str) -> list[dict]:
    """Fetch jobs from JSearch API and normalize them."""
    if not RAPIDAPI_KEY:
        return []

    url = "https://jsearch.p.rapidapi.com/search"
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    }
    params = {
        "query": f"{query} India",
        "page": "1",
        "num_pages": "1",
        "date_posted": "month",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            results = data.get("data", [])

        normalized = []
        for job in results[:8]:
            city = job.get("job_city") or ""
            country = job.get("job_country") or "India"
            location = f"{city}, {country}".strip(", ")
            normalized.append(
                {
                    "title": job.get("job_title", ""),
                    "company": job.get("employer_name", "Unknown"),
                    "location": location,
                    "description": (job.get("job_description", "") or "")[:500],
                    "salary_min": job.get("job_min_salary"),
                    "salary_max": job.get("job_max_salary"),
                    "apply_url": job.get("job_apply_link", ""),
                    "created": job.get("job_posted_at_datetime_utc", ""),
                    "source": job.get("job_publisher", "JSearch"),
                    "id": job.get("job_id", ""),
                }
            )
        return normalized
    except Exception as e:
        print(f"JSearch API error: {e}")
        return []


def deduplicate_jobs(jobs: list[dict]) -> list[dict]:
    """Remove duplicate jobs using title+company identity."""
    seen = set()
    unique = []

    for job in jobs:
        title = (job.get("title") or "").lower().strip()
        company = (job.get("company") or "").lower().strip()
        key = f"{title}_{company}"
        if key and key not in seen:
            seen.add(key)
            unique.append(job)
    return unique


async def fetch_all_jobs(queries: list[str]) -> tuple[list[dict], int]:
    """Fetch all jobs from both providers for up to 4 queries in parallel."""
    tasks = []
    for query in (queries or [])[:4]:
        tasks.append(fetch_adzuna(query))
        tasks.append(fetch_jsearch(query))

    if not tasks:
        return [], 0

    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_jobs = []
    for result in results:
        if isinstance(result, list):
            all_jobs.extend(result)

    deduped = deduplicate_jobs(all_jobs)
    return deduped, len(all_jobs)
