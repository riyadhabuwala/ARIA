import os
import json
import time
from groq import AsyncGroq
from dotenv import load_dotenv
from prompts import build_system_prompt

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(ENV_PATH)


class InterviewAgent:
    SESSION_TTL = 1800  # 30 minutes

    def __init__(self):
        self.client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
        self.sessions = {}  # session_id -> conversation_history
        self._timestamps = {}  # session_id -> last_activity_time

    def _cleanup_expired(self):
        """Remove sessions that have been inactive for longer than SESSION_TTL."""
        now = time.time()
        expired = [
            sid for sid, ts in self._timestamps.items()
            if now - ts > self.SESSION_TTL
        ]
        for sid in expired:
            self.sessions.pop(sid, None)
            self._timestamps.pop(sid, None)
        if expired:
            print(f"[InterviewAgent] Cleaned up {len(expired)} expired session(s)")

    def _touch(self, session_id: str):
        """Update the last activity timestamp for a session."""
        self._timestamps[session_id] = time.time()

    async def create_session(self, session_id: str, domain: str,
                       candidate_name: str, resume_text: str = "") -> str:
        """Initialize a new interview session, return AI greeting."""
        self._cleanup_expired()

        # Safety cap: reject if too many concurrent sessions
        if len(self.sessions) >= 50:
            raise ValueError("Server is at capacity. Please try again later.")

        system_prompt = build_system_prompt(domain, candidate_name, resume_text)
        self.sessions[session_id] = [
            {"role": "system", "content": system_prompt}
        ]
        self._touch(session_id)
        return await self._get_ai_response(session_id)

    async def send_message(self, session_id: str, user_message: str) -> dict:
        """Send user answer, get AI next question. Returns response + is_done flag."""
        self._cleanup_expired()

        if session_id not in self.sessions:
            raise ValueError("Session not found")

        self._touch(session_id)
        self.sessions[session_id].append({
            "role": "user",
            "content": user_message
        })

        response = await self._get_ai_response(session_id)
        is_done = "INTERVIEW_COMPLETE" in response
        clean_response = response.replace("INTERVIEW_COMPLETE", "").strip()

        return {
            "message": clean_response,
            "is_done": is_done,
            "has_feedback": len(clean_response) > 30
        }

    async def generate_report(self, session_id: str) -> dict:
        """Request final performance report as JSON."""
        if session_id not in self.sessions:
            raise ValueError("Session not found")

        self._touch(session_id)
        self.sessions[session_id].append({
            "role": "user",
            "content": "GENERATE_REPORT_NOW"
        })

        response = await self._get_ai_response(session_id)

        # Strip any accidental markdown fences
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        clean = clean.strip()

        return json.loads(clean)

    async def _get_ai_response(self, session_id: str) -> str:
        completion = await self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=self.sessions[session_id],
            temperature=1,
            max_tokens=8192,
            top_p=1,
            stream=False,
            stop=None
        )
        response = completion.choices[0].message.content

        self.sessions[session_id].append({
            "role": "assistant",
            "content": response
        })

        return response

    def end_session(self, session_id: str):
        """Clean up session from memory."""
        self.sessions.pop(session_id, None)
        self._timestamps.pop(session_id, None)


agent = InterviewAgent()  # singleton

