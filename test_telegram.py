#!/usr/bin/env python3
import requests
import json

# Test Telegram bot directly
BOT_TOKEN = '8347422810:AAFQ7CT5BXT0fqk9_X9ehO9gUGwaWqfX7YA'
CHAT_ID = '5527167310'

def test_telegram_bot():
    url = f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage'
    
    message = """🚨 EMERGENCY SOS ALERT 🚨

User: Test User
Phone: +91-9876543210
Location: 13.0827, 80.2707
Duration in hotspot: 5 minutes

User has been in a high-crime area for an extended period.
Immediate assistance may be required.

Time: 2024-01-15 10:30:00"""
    
    payload = {
        'chat_id': CHAT_ID,
        'text': message,
        'parse_mode': 'HTML'
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Telegram SOS alert sent successfully!")
        else:
            print("❌ Failed to send Telegram alert")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_telegram_bot()