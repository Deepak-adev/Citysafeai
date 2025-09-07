import requests
import os
from django.conf import settings

class TelegramService:
    def __init__(self):
        self.bot_token = '8347422810:AAFQ7CT5BXT0fqk9_X9ehO9gUGwaWqfX7YA'
        self.chat_id = '5527167310'
        self.base_url = f'https://api.telegram.org/bot{self.bot_token}'
    
    def send_sos_alert(self, username, phone, location, duration_minutes):
        """Send SOS alert via Telegram"""
        message = f"""🚨 EMERGENCY SOS ALERT 🚨

User: {username}
Phone: {phone}
Location: {location}
Duration in hotspot: {duration_minutes} minutes

User has been in a high-crime area for an extended period.
Immediate assistance may be required.

Time: {self._get_current_time()}"""
        
        try:
            url = f'{self.base_url}/sendMessage'
            payload = {
                'chat_id': self.chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                return {'status': 'success', 'message': 'SOS alert sent successfully'}
            else:
                return {'status': 'error', 'message': f'Failed to send alert: {response.text}'}
                
        except Exception as e:
            return {'status': 'error', 'message': f'Telegram error: {str(e)}'}
    
    def _get_current_time(self):
        from datetime import datetime
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')