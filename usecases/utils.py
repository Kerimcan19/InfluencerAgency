import secrets, os, smtplib
from email.message import EmailMessage




def send_password_reset_email(to_email: str, reset_url: str) -> None:
    """Minimal SMTP sender. Configure via env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM."""
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    pwd  = os.getenv("SMTP_PASS")
    from_addr = os.getenv("SMTP_FROM", user or "no-reply@example.com")

    if not host or not user or not pwd:
        # If SMTP isn’t configured yet, don’t blow up; log-like behavior.
        # You can replace this with your project’s logger.
        print(f"[WARN] SMTP not configured. Password reset URL (send manually): {reset_url}")
        return

    msg = EmailMessage()
    msg["Subject"] = "Set your password"
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.set_content(f"Merhaba,\n\nHesabınızı etkinleştirmek için aşağıdaki bağlantıdan şifrenizi belirleyin:\n{reset_url}\n\nTeşekkürler.")

    with smtplib.SMTP(host, port) as s:
        s.starttls()
        s.login(user, pwd)
        s.send_message(msg)