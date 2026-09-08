"""Email sending service (Resend provider).

Used for transactional email: email verification OTP, password reset, notifications.
All configuration comes from settings.email_* — never hardcoded.
"""

from __future__ import annotations

import httpx

from app.core.config import settings


class EmailError(Exception):
    pass


async def send_email(to: str, subject: str, html: str, text: str | None = None) -> None:
    """Send a transactional email via the configured provider."""
    provider = settings.email_provider.lower()

    if not settings.email_api_key:
        raise EmailError("email API key not configured")

    if provider == "resend":
        await _send_resend(to, subject, html, text)
    else:
        raise EmailError(f"unsupported email provider: {provider}")


async def _send_resend(to: str, subject: str, html: str, text: str | None) -> None:
    payload: dict = {
        "from": settings.email_from,
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if text:
        payload["text"] = text

    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            "https://api.resend.com/emails",
            json=payload,
            headers={
                "Authorization": f"Bearer {settings.email_api_key}",
                "Content-Type": "application/json",
            },
        )
        if r.status_code >= 400:
            raise EmailError(f"failed to send email: {r.status_code} {r.text[:200]}")


def build_verification_email(code: str) -> tuple[str, str]:
    """Return (subject, html) for an email verification OTP."""
    subject = "Verify your PagePilot email"
    html = f"""
    <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #4F46E5; font-size: 20px;">Verify your PagePilot email</h1>
      <p style="color: #0F172A; font-size: 15px; line-height: 1.6;">
        Use the code below to confirm your email address.
      </p>
      <div style="margin: 24px 0; padding: 16px; background: #EEF2FF; border-radius: 12px; text-align: center;">
        <span style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #4F46E5;">{code}</span>
      </div>
      <p style="color: #64748B; font-size: 13px;">
        If you didn&apos;t request this, you can safely ignore this email.
      </p>
    </div>
    """
    return subject, html
