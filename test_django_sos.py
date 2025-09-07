#!/usr/bin/env python3
import requests
import json

BASE_URL = 'http://localhost:8000'

def test_sos_endpoint():
    """Test SOS alert endpoint"""
    url = f'{BASE_URL}/api/send-sos/'
    data = {
        'username': 'Test User',
        'phone': '+91-9876543210',
        'location': '13.0827, 80.2707',
        'duration_minutes': 5
    }
    
    try:
        response = requests.post(url, json=data, timeout=10)
        print(f"SOS Endpoint - Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"SOS Endpoint Error: {e}")
        return False

def test_hotspot_endpoint():
    """Test hotspot check endpoint"""
    url = f'{BASE_URL}/api/check-hotspot/'
    data = {
        'lat': 13.0827,
        'lng': 80.2707,
        'username': 'Test User',
        'phone': '+91-9876543210'
    }
    
    try:
        response = requests.post(url, json=data, timeout=30)
        print(f"Hotspot Endpoint - Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Hotspot Endpoint Error: {e}")
        return False

def test_server_running():
    """Test if Django server is running"""
    try:
        response = requests.get(f'{BASE_URL}/', timeout=5)
        print(f"Server Status: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"Server not running: {e}")
        return False

if __name__ == "__main__":
    print("Testing Django SOS System...")
    print("=" * 40)
    
    if test_server_running():
        print("✅ Django server is running")
        
        if test_sos_endpoint():
            print("✅ SOS endpoint working")
        else:
            print("❌ SOS endpoint failed")
            
        if test_hotspot_endpoint():
            print("✅ Hotspot endpoint working")
        else:
            print("❌ Hotspot endpoint failed")
    else:
        print("❌ Django server not running")
        print("Start server with: python manage.py runserver")