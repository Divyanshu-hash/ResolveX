"""ResolveX Backend - AI Service (Ollama for Categorization, Groq for Insights)."""
import os
import json
import logging
import requests
from groq import Groq
from typing import Optional, Dict, Any

# Configure logging
logger = logging.getLogger(__name__)

# Ollama config (LOCAL)
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_CATEGORY_MODEL = "phi3:mini"


class AIService:
    _instance = None
    _groq_client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        # Initialize Groq (ONLY for insights)
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        if self.groq_api_key:
            try:
                self._groq_client = Groq(api_key=self.groq_api_key)
                logger.info("Groq AI initialized successfully (Insights only).")
            except Exception as e:
                logger.error(f"Failed to initialize Groq AI: {e}")
                self._groq_client = None
        else:
            logger.warning("GROQ_API_KEY not found. Insights will be unavailable.")

    # -------------------------------------------------
    # Complaint Categorization (Ollama - FAST, LOCAL)
    # -------------------------------------------------
    def predict_category_and_urgency(
        self, title: str, description: str
    ) -> Optional[Dict[str, str]]:
        """
        Predicts category and urgency (priority) using Ollama.
        Returns {"category": "...", "priority": "..."} or None.
        """

        prompt = f"""
Analyze the complaint and return ONLY valid JSON.

Complaint Title: {title}
Complaint Description: {description}

Categories: Electrical, Plumbing, HVAC, IT, Security, Cleaning, General
Priorities: low, medium, high, critical

Return format:
{{"category": "Electrical", "priority": "high"}}
"""

        try:
            response = requests.post(
                OLLAMA_URL,
                json={
                    "model": OLLAMA_CATEGORY_MODEL,
                    "prompt": prompt,
                    "stream": False,
                },
                timeout=5,  # fast fail
            )

            output = response.json().get("response", "").strip()
            return self._parse_response(output)

        except Exception as e:
            logger.error(f"Ollama categorization failed: {e}")
            return None

    # -------------------------------------------------
    # Analytics / Executive Insights (Groq - QUALITY)
    # -------------------------------------------------
    def generate_dashboard_insights(self, summary_data: Dict[str, Any]) -> str:
        """
        Generates executive summary insights using Groq.
        Returns markdown string.
        """

        if not self._groq_client:
            return "AI Insights are currently unavailable (Groq client not initialized)."

        prompt = f"""
You are a senior data analyst preparing an **executive briefing** for facility management leadership.
Your goal is to transform raw operational data into **clear, human-readable insights**
that help managers quickly understand risks, performance, and next actions.

⚠️ VERY IMPORTANT PRIORITY RULE:
- If there are **CRITICAL or HIGH priority complaints**, they MUST appear at the very top.
- Treat these as urgent issues that require immediate management attention.
- Clearly explain:
  • What the issue is  
  • Which category it belongs to  
  • How many complaints are affected  
  • Why it is risky (safety, service disruption, compliance, reputation)

Analyze the data below and produce a **well-structured, easy-to-read markdown report**.

Data:
{json.dumps(summary_data, indent=2)}

📌 Structure your response EXACTLY in the following order:

## 🚨 Urgent Issues (Critical & High Priority)
- Highlight all critical and high-priority complaints first.
- If none exist, clearly state: *“No critical or high-priority complaints at this time.”*

## 📊 Operational Overview
- Summarize the overall complaint volume and resolution status.
- Mention open vs resolved complaints and resolution efficiency.
- Call out any unusual patterns (e.g., very low or very high resolution times).

## 👥 Staff Performance Insights
- Identify top-performing staff members based on resolved complaints.
- Mention underutilization or imbalance if visible.
- Keep this constructive and performance-focused.

## 📈 Category & Trend Analysis
- Highlight the most common complaint categories.
- Point out rising or recurring issues.
- Mention any concerning trends over time (monthly patterns, repeated issues).

## ✅ Actionable Recommendations
- Provide **clear, practical, and prioritized actions** management can take.
- Focus on:
  • Risk reduction  
  • Faster resolution  
  • Better categorization  
  • Staff efficiency  
- Keep recommendations realistic and easy to implement.

📝 Writing style guidelines:
- Use simple, professional language (no technical jargon).
- Be concise but insightful.
- Write as if this will be read by a busy manager in under 2 minutes.
- Avoid repeating raw numbers unless they add value.

The final output should feel like a **human-written executive report**, not an AI response.
"""

        try:
            chat_completion = self._groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="meta-llama/llama-4-maverick-17b-128e-instruct",
            )
            return chat_completion.choices[0].message.content

        except Exception as e:
            logger.error(f"Groq Insights failed: {e}")
            return "AI Insights are currently unavailable."

    # -------------------------------------------------
    # Shared JSON Parser
    # -------------------------------------------------
    def _parse_response(self, text: str) -> Optional[Dict[str, str]]:
        try:
            text = text.strip()

            # Remove markdown fences if present
            if text.startswith("```"):
                text = text.split("```")[1]

            result = json.loads(text)
            return {
                "category": result.get("category", "General"),
                "priority": result.get("priority", "medium").lower(),
            }

        except Exception as e:
            logger.error(f"Failed to parse AI response: {e}")
            return None
