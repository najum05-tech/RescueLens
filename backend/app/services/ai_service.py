"""Modular AI service for RescueLens.

Supports Hugging Face Inference API as the open-source AI provider.
Models can be swapped by changing environment variables — no code changes required.

Environment variables:
    AI_PROVIDER                 - "huggingface" (default)
    HUGGINGFACE_API_KEY         - HF Inference API token (required)
    HUGGINGFACE_BASE_URL        - HF Inference API base URL
    HF_TEXT_MODEL               - Text analysis/classification model
    HF_EMBEDDING_MODEL          - Multilingual text embedding model
    HF_IMAGE_MODEL              - Image understanding model
    HF_REQUEST_TIMEOUT          - HTTP request timeout in seconds

Selected open-source models (all Apache 2.0 / permissive):
    - Text:    mistralai/Mistral-7B-Instruct-v0.3
    - Embed:   ibm-granite/granite-embedding-97m-multilingual-r2
    - Image:   moondream/moondream-2b-2025-04-14-4bit
"""

from __future__ import annotations

import base64
import json
import logging
import re
from typing import Any, Optional

import httpx

from ..config import settings

logger = logging.getLogger("rescuelens.ai")


class AIServiceError(Exception):
    """Raised when the AI service cannot fulfill a request."""


class AIService:
    """Wrapper around the Hugging Face Inference API."""

    def __init__(self) -> None:
        self.provider = settings.ai_provider.lower()
        self.api_key = settings.huggingface_api_key
        self.base_url = settings.huggingface_base_url.rstrip("/")
        self.timeout = settings.hf_request_timeout
        self.text_model = settings.hf_text_model
        self.embedding_model = settings.hf_embedding_model
        self.image_model = settings.hf_image_model

        if self.provider != "huggingface":
            logger.warning(
                "AI_PROVIDER is '%s'; only 'huggingface' is supported. "
                "AI features will be unavailable.",
                self.provider,
            )

    def _headers(self) -> dict[str, str]:
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def _post(self, path: str, payload: dict[str, Any]) -> Any:
        if not self.api_key:
            raise AIServiceError("HUGGINGFACE_API_KEY is not configured")
        url = f"{self.base_url}{path}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, headers=self._headers(), json=payload)
            if response.status_code == 401:
                raise AIServiceError("Hugging Face API key is invalid or missing")
            if response.status_code == 404:
                raise AIServiceError(f"Hugging Face model not found: {path}")
            response.raise_for_status()
            return response.json()

    # ------------------------------------------------------------------ #
    # Text analysis / classification
    # ------------------------------------------------------------------ #
    async def analyze_text(self, text: str) -> dict[str, Any]:
        """Classify an emergency report text.

        Returns a dict with: category, severity, people, location,
        safetyRisk, department, language, summary, confidence.
        """
        prompt = (
            "You are an emergency-report classifier. Analyze the following "
            "report text (which may be in English, Urdu, or Roman Urdu) and "
            "respond ONLY with a JSON object containing these fields: "
            "category (one of: Flood, Fire, Road Accident, Medical, Earthquake, Other), "
            "severity (Low/Medium/High/Critical), people (number or null), "
            "location (city or 'Not stated'), safetyRisk, department, "
            "language (English/Urdu/Roman Urdu/Other), summary (one sentence), "
            "confidence (0-100).\n\n"
            f"Report: {text}"
        )
        try:
            data = await self._post(
                f"/models/{self.text_model}",
                {"inputs": prompt, "parameters": {"max_new_tokens": 300, "temperature": 0.3}},
            )
            generated = self._extract_generated_text(data)
            return self._parse_text_analysis(generated, text)
        except AIServiceError:
            raise
        except Exception as exc:  # pragma: no cover - network/parse failures
            logger.exception("Text analysis failed")
            raise AIServiceError(f"Text analysis failed: {exc}") from exc

    @staticmethod
    def _extract_generated_text(data: Any) -> str:
        """Extract generated text from various HF response shapes."""
        if isinstance(data, list) and data:
            first = data[0]
            if isinstance(first, dict):
                for key in ("generated_text", "text"):
                    if key in first and isinstance(first[key], str):
                        return first[key]
        if isinstance(data, dict):
            for key in ("generated_text", "text"):
                if key in data and isinstance(data[key], str):
                    return data[key]
        return str(data)

    @staticmethod
    def _parse_text_analysis(generated: str, original: str) -> dict[str, Any]:
        """Best-effort parse of the model's JSON output, with safe defaults."""
        result: dict[str, Any] = {
            "category": "Other",
            "severity": "Medium",
            "people": "Not stated",
            "location": "Not stated",
            "safetyRisk": "Moderate: needs verification",
            "department": "General Emergency Response",
            "language": "English",
            "summary": original[:120] + ("..." if len(original) > 120 else ""),
            "confidence": 60,
        }

        match = re.search(r"\{.*\}", generated, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group(0))
                if isinstance(parsed, dict):
                    for key in result:
                        if key in parsed:
                            result[key] = parsed[key]
            except json.JSONDecodeError:
                pass

        # Language detection fallback.
        urdu_script = bool(re.search(r"[\u0600-\u06FF]", original))
        roman_urdu = bool(
            re.search(
                r"\b(mein|hai|hua|hain|aur|ho|ki|ka|ko|se|nahi)\b",
                original,
                re.IGNORECASE,
            )
        )
        if urdu_script:
            result["language"] = "Urdu"
        elif roman_urdu:
            result["language"] = "Roman Urdu"

        return result

    # ------------------------------------------------------------------ #
    # Image understanding
    # ------------------------------------------------------------------ #
    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> dict[str, Any]:
        """Analyze an emergency photo."""
        b64 = base64.b64encode(image_bytes).decode("ascii")
        data_uri = f"data:{mime_type};base64,{b64}"
        prompt = (
            "Analyze this emergency photo and respond ONLY with a JSON object "
            "containing: label, category, severity, hazards, department, "
            "confidence, note."
        )
        try:
            data = await self._post(
                f"/models/{self.image_model}",
                {
                    "inputs": {"image": data_uri, "text": prompt},
                    "parameters": {"max_new_tokens": 200, "temperature": 0.3},
                },
            )
            generated = self._extract_generated_text(data)
            return self._parse_image_analysis(generated)
        except AIServiceError:
            raise
        except Exception as exc:
            logger.exception("Image analysis failed")
            raise AIServiceError(f"Image analysis failed: {exc}") from exc

    @staticmethod
    def _parse_image_analysis(generated: str) -> dict[str, Any]:
        result: dict[str, Any] = {
            "label": "Emergency scene",
            "category": "Other",
            "severity": "Medium",
            "hazards": ["Unable to determine"],
            "department": "General Emergency Response",
            "confidence": 60,
            "note": "Model output could not be fully parsed; manual review recommended.",
        }
        match = re.search(r"\{.*\}", generated, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group(0))
                if isinstance(parsed, dict):
                    for key in result:
                        if key in parsed:
                            result[key] = parsed[key]
            except json.JSONDecodeError:
                pass
        return result

    # ------------------------------------------------------------------ #
    # Priority suggestion
    # ------------------------------------------------------------------ #
    async def suggest_priority(
        self,
        category: str,
        description: str,
        people: int | None = None,
        verified: bool = False,
        evidence: str = "none",
    ) -> dict[str, Any]:
        """Suggest an incident priority (Critical/High/Medium/Low)."""
        prompt = (
            "You are an emergency triage assistant. Suggest a priority "
            "(Critical, High, Medium, Low). Respond ONLY with a JSON object "
            "containing: suggested, total (0-5 score), factors "
            "(array of { name, score, weight, note }).\n\n"
            f"Category: {category}\nDescription: {description}\n"
            f"People affected: {people or 'not stated'}\n"
            f"Verified: {verified}\nEvidence: {evidence}"
        )
        try:
            data = await self._post(
                f"/models/{self.text_model}",
                {"inputs": prompt, "parameters": {"max_new_tokens": 300, "temperature": 0.3}},
            )
            generated = self._extract_generated_text(data)
            return self._parse_priority(generated)
        except AIServiceError:
            raise
        except Exception as exc:
            logger.exception("Priority suggestion failed")
            raise AIServiceError(f"Priority suggestion failed: {exc}") from exc

    @staticmethod
    def _parse_priority(generated: str) -> dict[str, Any]:
        result: dict[str, Any] = {
            "suggested": "Medium",
            "total": 2.5,
            "factors": [
                {"name": "Severity", "score": 3, "weight": 0.35, "note": "Default assessment"},
                {"name": "Safety risk", "score": 2, "weight": 0.25, "note": "Default assessment"},
                {"name": "People affected", "score": 1, "weight": 0.2, "note": "Not stated"},
                {"name": "Verification", "score": 1, "weight": 0.1, "note": "Not verified"},
                {"name": "Evidence", "score": 1, "weight": 0.1, "note": "No attachments"},
            ],
        }
        match = re.search(r"\{.*\}", generated, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group(0))
                if isinstance(parsed, dict):
                    if "suggested" in parsed:
                        result["suggested"] = parsed["suggested"]
                    if "total" in parsed:
                        result["total"] = float(parsed["total"])
                    if "factors" in parsed and isinstance(parsed["factors"], list):
                        result["factors"] = parsed["factors"]
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
        return result

    # ------------------------------------------------------------------ #
    # Multilingual embeddings (duplicate detection)
    # ------------------------------------------------------------------ #
    async def embed_text(self, text: str) -> tuple[Optional[list[float]], Optional[str]]:
        """Return (embedding_vector, model_name) for a text."""
        try:
            data = await self._post(
                f"/models/{self.embedding_model}",
                {"inputs": text},
            )
            vector: Optional[list[float]] = None
            if isinstance(data, list) and data and isinstance(data[0], list):
                vector = [float(x) for x in data[0]]
            elif isinstance(data, dict):
                emb = data.get("embedding") or data.get("embeddings")
                if isinstance(emb, list) and emb:
                    if isinstance(emb[0], list):
                        vector = [float(x) for x in emb[0]]
                    else:
                        vector = [float(x) for x in emb]
            return vector, self.embedding_model
        except AIServiceError:
            logger.warning("Embedding skipped: Hugging Face not configured")
            return None, None
        except Exception as exc:
            logger.warning("Embedding failed: %s", exc)
            return None, None


# Module-level singleton so routes can import a single shared instance.
ai_service = AIService()

