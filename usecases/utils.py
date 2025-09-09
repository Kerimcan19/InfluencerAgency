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
    # Düz metin (HTML desteklemeyen istemciler için geri dönüş)
    msg.set_content(
        (
            "Merhaba,\n\n"
            "Hesabınızı etkinleştirmek için aşağıdaki bağlantıya tıklayarak şifrenizi belirleyin:\n\n"
            f"{reset_url}\n\n"
            "Teşekkürler."
        )
    )

    # HTML alternatif (buton ile)
    html_body = f"""
    <!DOCTYPE html>
    <html lang=\"tr\">
    <head>
      <meta charset=\"UTF-8\" />
      <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
      <title>Şifre Sıfırlama</title>
      <style>
        /* E-posta istemcileri için inline/temel stiller tercih edilir */
        .container {{
          max-width: 520px; margin: 0 auto; padding: 24px;
          background: #ffffff; border-radius: 12px; border: 1px solid #eef2ff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
          color: #0f172a;
        }}
        .brand {{ display: flex; align-items: center; gap: 8px; color: #6d28d9; font-weight: 700; }}
        .title {{ font-size: 22px; font-weight: 700; margin: 16px 0 8px; }}
        .text {{ font-size: 14px; color: #334155; line-height: 1.6; }}
        .btn {{
          display: inline-block; margin: 16px 0; padding: 12px 18px; border-radius: 10px;
          background: linear-gradient(90deg, #7c3aed, #db2777); color: #ffffff; text-decoration: none;
          font-weight: 600;
        }}
        .link {{ font-size: 12px; color: #475569; word-break: break-all; }}
      </style>
    </head>
    <body style=\"background:#f8fafc; padding: 24px;\">
      <div class=\"container\">
        <div class=\"brand\">Qubeagency</div>
        <div class=\"title\">Şifrenizi Belirleyin</div>
        <p class=\"text\">Merhaba,</p>
        <p class=\"text\">Hesabınızı etkinleştirmek için aşağıdaki butona tıklayarak şifrenizi belirleyin.</p>
        <p>
          <a class=\"btn\" href=\"{reset_url}\" target=\"_blank\" rel=\"noopener noreferrer\">Şifreyi Belirle</a>
        </p>
        <p class=\"text\">Buton çalışmazsa aşağıdaki bağlantıyı tarayıcınızda açın:</p>
        <p class=\"link\">{reset_url}</p>
        <p class=\"text\">Teşekkürler.</p>
      </div>
    </body>
    </html>
    """
    msg.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP(host, port) as s:
            s.starttls()
            s.login(user, pwd)
            s.send_message(msg)
            print(f"[INFO] Şifre sıfırlama maili gönderildi: {to_email}")
    except Exception as e:
        print(f"[ERROR] Mail gönderilemedi: {e}")