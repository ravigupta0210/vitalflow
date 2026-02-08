"""
Google Gemini AI Client for VitalFlow
"""

import google.generativeai as genai
from config.settings import settings
import json
import re
from typing import Optional


class GeminiAPIError(Exception):
    """Exception raised when Gemini API fails"""
    pass


class GeminiClient:
    """Wrapper for Google Gemini AI API"""

    def __init__(self):
        self.is_configured = False
        self.model = None

        if settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel(
                    model_name='models/gemini-2.5-flash',
                    generation_config={
                        'temperature': settings.AI_TEMPERATURE,
                        'top_p': 0.95,
                        'top_k': 40,
                        'max_output_tokens': settings.AI_MAX_TOKENS,
                    },
                    safety_settings=[
                        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    ]
                )
                self.is_configured = True
                print("✅ Gemini AI client configured successfully")
            except Exception as e:
                print(f"⚠️ Failed to configure Gemini: {e}")
        else:
            print("⚠️ GEMINI_API_KEY not set - AI features will use fallback responses")

    async def generate(self, prompt: str, expect_json: bool = False) -> str:
        """Generate response from Gemini AI

        Raises GeminiAPIError when API fails - callers should catch and use fallback
        """
        if not self.is_configured:
            raise GeminiAPIError("Gemini API is not configured")

        try:
            response = await self.model.generate_content_async(prompt)

            if response.text:
                result = response.text

                # Clean up JSON if expected
                if expect_json:
                    result = self._extract_json(result)

                return result
            else:
                print("⚠️ Empty response from Gemini")
                raise GeminiAPIError("Empty response from Gemini API")

        except GeminiAPIError:
            raise  # Re-raise our own errors
        except Exception as e:
            print(f"⚠️ Gemini generation error: {e}")
            raise GeminiAPIError(f"Gemini API error: {str(e)}")

    def _extract_json(self, text: str) -> str:
        """Extract JSON from response text"""
        # Try to find JSON in code blocks
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
        if json_match:
            return json_match.group(1).strip()

        # Try to find JSON object or array
        json_match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', text)
        if json_match:
            return json_match.group(1).strip()

        return text

    def _get_fallback_response(self, expect_json: bool) -> str:
        """Return fallback response when Gemini is unavailable"""
        if expect_json:
            return json.dumps({
                "error": "AI service temporarily unavailable",
                "fallback": True
            })
        return "I apologize, but I'm having trouble processing your request right now. Please try again later."

    async def chat(self, messages: list, system_prompt: str = "") -> str:
        """Chat-style generation with message history

        Raises GeminiAPIError when API fails - callers should catch and use fallback
        """
        if not self.is_configured:
            raise GeminiAPIError("Gemini API is not configured")

        try:
            # Build conversation
            chat = self.model.start_chat(history=[])

            # Send system prompt first if provided
            if system_prompt:
                await chat.send_message_async(f"System: {system_prompt}")

            # Send message history
            for msg in messages[:-1]:  # All but the last message
                role = "User: " if msg['role'] == 'user' else "Assistant: "
                await chat.send_message_async(f"{role}{msg['content']}")

            # Send final message and get response
            if messages:
                response = await chat.send_message_async(f"User: {messages[-1]['content']}")
                return response.text

            return "I'm ready to help with your health questions!"

        except GeminiAPIError:
            raise  # Re-raise our own errors
        except Exception as e:
            print(f"⚠️ Gemini chat error: {e}")
            raise GeminiAPIError(f"Gemini chat error: {str(e)}")
