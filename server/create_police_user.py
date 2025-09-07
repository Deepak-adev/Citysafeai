#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from cityapp.models import UserProfile

def create_police_user():
    """Create a demo police user for testing"""
    
    # Check if user already exists
    if User.objects.filter(username='officer_demo').exists():
        print("Police user 'officer_demo' already exists!")
        return
    
    # Create Django User
    user = User.objects.create_user(
        username='officer_demo',
        password='Police123',
        email='officer.demo@police.gov'
    )
    
    # Create UserProfile
    user_profile = UserProfile.objects.create(
        user=user,
        username='officer_demo',
        email='officer.demo@police.gov',
        phone='+1234567890',
        role='police',
        police_id='TN001',
        police_rank='Inspector'
    )
    
    print(f"Police user created successfully!")
    print(f"Username: officer_demo")
    print(f"Password: Police123")
    print(f"Police ID: TN001")
    print(f"Role: {user_profile.role}")
    print(f"User ID: {user_profile.id}")

if __name__ == "__main__":
    create_police_user()
