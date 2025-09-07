from django.db import models
from django.contrib.auth.models import User
import uuid

# Create your models here.

class UserProfile(models.Model):
    """Extended user profile model with additional information"""
    ROLE_CHOICES = [
        ('public', 'Public User'),
        ('police', 'Police Officer'),
        ('admin', 'Administrator'),
    ]
    
    # Primary key - auto-generated UUID
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Link to Django's built-in User model
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # User information
    username = models.CharField(max_length=150, unique=True, help_text="Unique username")
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='public')
    
    # Police-specific fields
    police_id = models.CharField(max_length=50, blank=True, null=True, help_text="Police ID for police officers")
    police_rank = models.CharField(max_length=100, blank=True, null=True, help_text="Police rank")
    
    # Profile information
    avatar = models.URLField(blank=True, null=True, help_text="Profile picture URL")
    bio = models.TextField(blank=True, null=True, help_text="User biography")
    
    # Preferences
    notifications_enabled = models.BooleanField(default=True)
    location_tracking_enabled = models.BooleanField(default=False)
    emergency_alerts_enabled = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_active = models.DateTimeField(auto_now=True)
    
    # User stats
    reports_submitted = models.PositiveIntegerField(default=0)
    alerts_received = models.PositiveIntegerField(default=0)
    safety_score = models.PositiveIntegerField(default=85, help_text="Safety score out of 100")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    def get_display_name(self):
        """Get display name for the user"""
        return self.user.get_full_name() or self.username
    
    def is_police(self):
        """Check if user is a police officer"""
        return self.role == 'police'
    
    def is_admin(self):
        """Check if user is an administrator"""
        return self.role == 'admin'

class EmergencyContact(models.Model):
    """Emergency contacts for users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='emergency_contacts')
    
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    relationship = models.CharField(max_length=50, help_text="e.g., Family, Friend, Doctor")
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Emergency Contact"
        verbose_name_plural = "Emergency Contacts"
    
    def __str__(self):
        return f"{self.name} ({self.relationship}) - {self.user_profile.username}"

class UserLocation(models.Model):
    """User location tracking"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='locations')
    
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    address = models.CharField(max_length=500, blank=True, null=True)
    accuracy = models.FloatField(blank=True, null=True, help_text="Location accuracy in meters")
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = "User Location"
        verbose_name_plural = "User Locations"
    
    def __str__(self):
        return f"{self.user_profile.username} - {self.latitude}, {self.longitude}"

class UserActivity(models.Model):
    """User activity tracking"""
    ACTIVITY_TYPES = [
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('sos_sent', 'SOS Alert Sent'),
        ('location_updated', 'Location Updated'),
        ('report_submitted', 'Report Submitted'),
        ('contact_added', 'Emergency Contact Added'),
        ('profile_updated', 'Profile Updated'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='activities')
    
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    description = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True, help_text="Additional activity data")
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = "User Activity"
        verbose_name_plural = "User Activities"
    
    def __str__(self):
        return f"{self.user_profile.username} - {self.get_activity_type_display()}"
