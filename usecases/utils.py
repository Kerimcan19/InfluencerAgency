import secrets, os, smtplib
from email.message import EmailMessage




def send_password_reset_email(to_email: str, reset_url: str) -> None:
    """Gmail SMTP üzerinden şifre sıfırlama maili gönderir."""

    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    pwd  = os.getenv("SMTP_PASS")
    from_addr = os.getenv("SMTP_FROM", user or "no-reply@example.com")

    if not host or not user or not pwd:
        print(f"[WARN] SMTP yapılandırılmamış. Manuel gönder: {reset_url}")
        return

    msg = EmailMessage()
    msg["Subject"] = "Şifrenizi Belirleyin"
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.set_content(
        f"Merhaba,\n\n"
        f"Hesabınızı etkinleştirmek için aşağıdaki bağlantıya tıklayarak şifrenizi belirleyin:\n\n"
        f"{reset_url}\n\n"
        f"Teşekkürler."
    )

    try:
        with smtplib.SMTP(host, port) as s:
            s.starttls()
            s.login(user, pwd)
            s.send_message(msg)
            print(f"[INFO] Şifre sıfırlama maili gönderildi: {to_email}")
    except Exception as e:
        print(f"[ERROR] Mail gönderilemedi: {e}")