import re


FILLER_WORDS = [
    "um", "uh", "like", "you know", "basically", "literally",
    "kind of", "sort of", "i mean", "right", "actually",
    "so yeah", "hmm", "err", "well", "okay so"
]

WEAK_OPENERS = [
    "i think maybe", "i'm not sure", "i don't really know",
    "i guess", "probably", "i might be wrong"
]

STRONG_OPENERS = [
    "i believe", "in my experience", "the approach i'd take",
    "from my work", "specifically", "to answer that"
]


def analyze_answer(answer_text: str, question_number: int) -> dict:
    """Analyze a single answer for confidence metrics."""
    text_lower = (answer_text or "").lower()
    words = text_lower.split()
    total_words = len(words)

    # Count filler words
    filler_count = 0
    filler_found = []
    for filler in FILLER_WORDS:
        count = text_lower.count(filler)
        if count > 0:
            filler_count += count
            filler_found.append(filler)

    # Check openers
    has_weak_opener = any(w in text_lower for w in WEAK_OPENERS)
    has_strong_opener = any(s in text_lower for s in STRONG_OPENERS)

    # Filler word percentage
    filler_percentage = round((filler_count / max(total_words, 1)) * 100, 1)

    # Confidence score calculation (0-100)
    score = 100
    score -= min(filler_count * 5, 30)        # max -30 for fillers
    if total_words < 20:
        score -= 20           # very short answer
    if total_words < 10:
        score -= 20           # extremely short
    if has_weak_opener:
        score -= 10
    if has_strong_opener:
        score += 10
    score = max(0, min(100, score))

    strengths = []
    improvements = []
    feedback_parts = []

    if filler_count == 0:
        strengths.append("Minimal filler words")
        feedback_parts.append("Great fluency with minimal fillers")
    elif filler_count <= 2:
        strengths.append("Controlled filler usage")
        improvements.append("Reduce filler words for a sharper delivery")
        feedback_parts.append("Good control, but a few fillers can be reduced")
    else:
        improvements.append("Too many filler words")
        feedback_parts.append("Try pausing instead of using filler words")

    if total_words >= 30:
        strengths.append("Adequate answer depth")
    else:
        improvements.append("Answer is too short")
        feedback_parts.append("Add more detail and examples")

    if has_strong_opener:
        strengths.append("Confident opening")
    if has_weak_opener:
        improvements.append("Avoid uncertain opening phrases")

    feedback = ". ".join(dict.fromkeys(feedback_parts)) or "Good response. Keep practicing for consistency."

    return {
        "question_number": question_number,
        "answer_index": question_number,
        "answer_text": answer_text,
        "total_words": total_words,
        "filler_count": filler_count,
        "filler_words_found": filler_found,
        "filler_percentage": filler_percentage,
        "has_weak_opener": has_weak_opener,
        "has_strong_opener": has_strong_opener,
        "answer_length": "short" if total_words < 30 else "medium" if total_words < 80 else "long",
        "confidence_score": score,
        "score": score,
        "word_count": total_words,
        "feedback": feedback,
        "strengths": list(dict.fromkeys(strengths)),
        "improvements": list(dict.fromkeys(improvements)),
    }


def analyze_full_interview(answers: list) -> dict:
    """Analyze all answers and produce aggregate confidence report."""
    if not answers:
        return {
            "confidence_score": 0,
            "overall_score": 0,
            "total_filler_words": 0,
            "total_fillers": 0,
            "total_answers": 0,
            "average_words_per_answer": 0,
            "avg_word_count": 0,
            "answers": [],
            "per_answer_breakdown": [],
            "filler_frequency": {},
            "improvement_tips": [],
            "tips": [],
            "most_used_fillers": [],
        }

    analyses = [analyze_answer(a, i + 1) for i, a in enumerate(answers)]

    total_filler = sum(a["filler_count"] for a in analyses)
    avg_confidence = round(sum(a["confidence_score"] for a in analyses) / len(analyses))
    avg_words = round(sum(a["total_words"] for a in analyses) / len(analyses))

    # Build per-answer breakdown
    breakdown = []
    detailed_answers = []
    filler_frequency = {}
    for a in analyses:
        level = "High" if a["confidence_score"] >= 70 else \
                "Medium" if a["confidence_score"] >= 40 else "Low"
        breakdown.append({
            "question_number": a["question_number"],
            "confidence_level": level,
            "confidence_score": a["confidence_score"],
            "filler_count": a["filler_count"],
            "word_count": a["total_words"],
            "filler_words": a["filler_words_found"]
        })

        detailed_answers.append({
            "answer_index": a["answer_index"],
            "question_number": a["question_number"],
            "answer_text": a["answer_text"],
            "score": a["score"],
            "filler_words_found": a["filler_words_found"],
            "filler_count": a["filler_count"],
            "word_count": a["word_count"],
            "feedback": a["feedback"],
            "strengths": a["strengths"],
            "improvements": a["improvements"],
        })

        for fw in a["filler_words_found"]:
            filler_frequency[fw] = filler_frequency.get(fw, 0) + 1

    # Trend analysis
    scores = [a["confidence_score"] for a in analyses]
    trend = "improving" if scores[-1] > scores[0] else \
            "declining" if scores[-1] < scores[0] else "stable"

    tips = []
    if total_filler > 10:
        tips.append("Practice reducing filler words like 'um' and 'uh' — try pausing silently instead")
    if avg_words < 30:
        tips.append("Try to give more detailed answers — aim for at least 3-4 sentences per response")
    if any(a["has_weak_opener"] for a in analyses):
        tips.append("Start answers with confident openers like 'In my experience...' or 'I believe...'")
    if trend == "declining":
        tips.append("Your confidence seemed to decrease toward the end — practice pacing yourself")

    if not tips:
        tips.append("Good communication overall — keep it up")

    return {
        "confidence_score": avg_confidence,
        "overall_score": avg_confidence,
        "total_filler_words": total_filler,
        "total_fillers": total_filler,
        "total_answers": len(answers),
        "average_words_per_answer": avg_words,
        "avg_word_count": avg_words,
        "confidence_trend": trend,
        "per_answer_breakdown": breakdown,
        "answers": detailed_answers,
        "filler_frequency": filler_frequency,
        "improvement_tips": tips,
        "tips": tips,
        "most_used_fillers": list(set(
            fw for a in analyses for fw in a["filler_words_found"]
        ))[:5]
    }
