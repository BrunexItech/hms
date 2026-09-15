import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Sends via SMTP if configured, otherwise logs to stdout so local
    development never blocks on a missing mail provider."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[email:dev-mode] to={to_email} subject={subject}\n{html_body}")
        return True

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = to_email
    message.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], message.as_string())
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[email:error] failed to send to {to_email}: {exc}")
        return False


def send_tenant_access_link(to_email: str, full_name: str, magic_link: str) -> None:
    subject = "Your sign-in link"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Hi {full_name},</h2>
      <p>Use the button below to securely sign in to your resident portal.
      This link expires in {settings.ACCESS_LINK_EXPIRE_MINUTES} minutes and can only be used once.</p>
      <p style="text-align:center; margin: 32px 0;">
        <a href="{magic_link}" style="background:#7C3AED;color:#fff;padding:12px 24px;
           border-radius:8px;text-decoration:none;font-weight:bold;">Sign in</a>
      </p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
    """
    send_email(to_email, subject, html)
