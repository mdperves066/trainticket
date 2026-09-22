import os
import httpx
from typing import Optional
from datetime import datetime


class TelegramNotifier:
    """
    Optional Telegram notification module.
    Only dispatches messages when TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set.
    """

    def __init__(self, bot_token: Optional[str] = None, chat_id: Optional[str] = None):
        self.bot_token = bot_token or os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = chat_id or os.getenv("TELEGRAM_CHAT_ID")

    @property
    def is_configured(self) -> bool:
        return bool(self.bot_token and self.chat_id)

    async def send_availability_alert(
        self,
        train_name: str,
        from_station: str,
        to_station: str,
        journey_date: str,
        class_name: str,
        available_count: int,
        detected_time: Optional[str] = None,
    ) -> bool:
        if not self.is_configured:
            return False

        time_str = detected_time or datetime.now().strftime("%H:%M:%S")
        message = (
            "🚨 *BD RAILWAY TICKET AVAILABLE*\n\n"
            f"🚆 *Train:* {train_name}\n"
            f"📍 *Route:* {from_station} → {to_station}\n"
            f"📅 *Date:* {journey_date}\n"
            f"💺 *Class:* {class_name}\n"
            f"🎟 *Available:* *{available_count}*\n"
            f"⏰ *Detected:* {time_str}\n\n"
            "🔗 *Open official booking:*\n"
            "https://eticket.railway.gov.bd/"
        )

        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": message,
            "parse_mode": "Markdown",
            "disable_web_page_preview": False,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                return resp.status_code == 200
        except Exception:
            return False
