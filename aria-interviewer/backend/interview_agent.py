import os
import json
from groq import Groq
from dotenv import load_dotenv
from prompts import build_system_prompt

load_dotenv()


class InterviewAgent:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.sessions = {}  # session_id -> conversation_history

    def create_session(self, session_id: str, domain: str,
                       candidate_name: str, resume_text: str = "") -> str:
        """Initialize a new interview session, return AI greeting."""
        system_prompt = build_system_prompt(domain, candidate_name, resume_text)
        self.sessions[session_id] = [
            {"role": "system", "content": system_prompt}
        ]
        return self._get_ai_response(session_id)

    def send_message(self, session_id: str, user_message: str) -> dict:
        """Send user answer, get AI next question. Returns response + is_done flag."""
        if session_id not in self.sessions:
            raise ValueError("Session not found")

        self.sessions[session_id].append({
            "role": "user",
            "content": user_message
        })

        response = self._get_ai_response(session_id)
        is_done = "INTERVIEW_COMPLETE" in response
        clean_response = response.replace("INTERVIEW_COMPLETE", "").strip()

        return {
            "message": clean_response,
            "is_done": is_done
        }

    def generate_report(self, session_id: str) -> dict:
        """Request final performance report as JSON."""
        if session_id not in self.sessions:
            raise ValueError("Session not found")

        self.sessions[session_id].append({
            "role": "user",
            "content": "GENERATE_REPORT_NOW"
        })

        response = self._get_ai_response(session_id)

        # Strip any accidental markdown fences
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        clean = clean.strip()

        return json.loads(clean)

    def _get_ai_response(self, session_id: str) -> str:
        completion = self.client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=self.sessions[session_id],
            temperature=1,
            max_completion_tokens=8192,
            top_p=1,
            reasoning_effort="medium",
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
        if session_id in self.sessions:
            del self.sessions[session_id]


agent = InterviewAgent()  # singleton
