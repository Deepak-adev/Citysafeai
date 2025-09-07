from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .services import CrimePredictionService
import json
import time
from datetime import datetime, timedelta

# Mock Police ID Database
VALID_POLICE_IDS = {
    'TN001': {'name': 'Inspector Rajesh Kumar', 'rank': 'Inspector'},
    'TN002': {'name': 'Sub-Inspector Priya Sharma', 'rank': 'Sub-Inspector'},
    'TN003': {'name': 'Constable Murugan S', 'rank': 'Constable'},
    'TN004': {'name': 'Inspector Kavitha R', 'rank': 'Inspector'},
    'TN005': {'name': 'Head Constable Ravi Kumar', 'rank': 'Head Constable'},
    'TN006': {'name': 'Sub-Inspector Arun M', 'rank': 'Sub-Inspector'},
    'TN007': {'name': 'Constable Lakshmi P', 'rank': 'Constable'},
    'TN008': {'name': 'Inspector Senthil Kumar', 'rank': 'Inspector'},
    'TN009': {'name': 'Sub-Inspector Meera J', 'rank': 'Sub-Inspector'},
    'TN010': {'name': 'Constable Karthik V', 'rank': 'Constable'}
}

def home(request):
    return render(request, 'cityapp/home.html')

@csrf_exempt
def get_crime_predictions(request):
    """API endpoint to get crime prediction coordinates"""
    if request.method == 'GET':
        # Initialize the service with Gemini API key
        api_key = "AIzaSyB5JCLElwe1mT7THvsehV0UHTyUQPlfjrE"
        service = CrimePredictionService(api_key)
        
        # Get parameters from request
        city = request.GET.get('city', 'Chennai')
        count = int(request.GET.get('count', 100))
        
        try:
            # Generate crime hotspot coordinates
            coordinates = service.generate_crime_hotspots(city, count)
            
            # Extract separate lat and lng arrays
            latitudes = [coord['lat'] for coord in coordinates]
            longitudes = [coord['lng'] for coord in coordinates]
            
            return JsonResponse({
                'status': 'success',
                'city': city,
                'total_coordinates': len(coordinates),
                'latitudes': latitudes,
                'longitudes': longitudes,
                'coordinates': coordinates
            })
        
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Only GET method allowed'}, status=405)

@csrf_exempt
@require_http_methods(["POST"])
def register_user(request):
    """API endpoint for user registration"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        email = data.get('email', '')
        role = data.get('role', 'public')
        phone = data.get('phone', '')
        police_id = data.get('police_id', '')
        
        if not username or not password:
            return JsonResponse({
                'status': 'error',
                'message': 'Username and password are required'
            }, status=400)
        
        # Check if username already exists in UserProfile
        if UserProfile.objects.filter(username=username).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'Username already exists'
            }, status=400)
        
        # Check if username already exists in Django User model
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'Username already exists'
            }, status=400)
        
        # Validate police ID for police role
        if role == 'police':
            if not police_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Police ID is required for police registration'
                }, status=400)
            
            if police_id not in VALID_POLICE_IDS:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid Police ID. Contact your department.'
                }, status=400)
            
            if UserProfile.objects.filter(police_id=police_id).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'Police ID already registered'
                }, status=400)
        
        # Create Django User
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email
        )
        
        # Create UserProfile
        user_profile = UserProfile.objects.create(
            user=user,
            username=username,
            email=email,
            phone=phone,
            role=role,
            police_id=police_id if role == 'police' else None,
            police_rank=VALID_POLICE_IDS.get(police_id, {}).get('rank') if role == 'police' else None
        )
        
        # Log user registration activity
        UserActivity.objects.create(
            user_profile=user_profile,
            activity_type='login',
            description=f'User registered successfully',
            metadata={'role': role, 'police_id': police_id if role == 'police' else None}
        )
        
        return JsonResponse({
            'status': 'success',
            'message': 'User registered successfully',
            'user_id': str(user_profile.id),
            'username': user_profile.username,
            'role': user_profile.role
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def login_user(request):
    """API endpoint for user login"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return JsonResponse({
                'status': 'error',
                'message': 'Username and password are required'
            }, status=400)
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            
            # Get user profile
            try:
                user_profile = UserProfile.objects.get(user=user)
                # Update last active timestamp
                user_profile.last_active = timezone.now()
                user_profile.save()
                
                # Log login activity
                UserActivity.objects.create(
                    user_profile=user_profile,
                    activity_type='login',
                    description=f'User logged in successfully',
                    metadata={'ip_address': request.META.get('REMOTE_ADDR', 'Unknown')}
                )
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Login successful',
                    'user': {
                        'id': str(user_profile.id),
                        'username': user_profile.username,
                        'email': user_profile.email,
                        'phone': user_profile.phone,
                        'role': user_profile.role,
                        'police_id': user_profile.police_id,
                        'police_rank': user_profile.police_rank,
                        'created_at': user_profile.created_at.isoformat(),
                        'last_active': user_profile.last_active.isoformat(),
                        'reports_submitted': user_profile.reports_submitted,
                        'alerts_received': user_profile.alerts_received,
                        'safety_score': user_profile.safety_score,
                        'preferences': {
                            'notifications_enabled': user_profile.notifications_enabled,
                            'location_tracking_enabled': user_profile.location_tracking_enabled,
                            'emergency_alerts_enabled': user_profile.emergency_alerts_enabled
                        }
                    }
                })
            except UserProfile.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'User profile not found. Please contact support.'
                }, status=500)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid credentials'
            }, status=401)
            
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def send_alert(request):
    """API endpoint to send SMS alerts"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        location = data.get('location')
        contacts = data.get('contacts', [])
        
        alert_message = f"SAFETY ALERT: {username} has been in a high-crime area for over 5 minutes. Location: {location}"
        
        print(f"SMS Alert sent to {len(contacts)} contacts: {alert_message}")
        
        return JsonResponse({
            'status': 'success',
            'message': f'Alert sent to {len(contacts)} contacts'
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def validate_police_id(request):
    """API endpoint to validate police ID"""
    try:
        data = json.loads(request.body)
        police_id = data.get('police_id', '')
        
        if police_id in VALID_POLICE_IDS:
            return JsonResponse({
                'status': 'success',
                'valid': True,
                'officer': VALID_POLICE_IDS[police_id]
            })
        else:
            return JsonResponse({
                'status': 'success',
                'valid': False
            })
            
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def send_sos_alert(request):
    """API endpoint to send SOS alert via Telegram"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        phone = data.get('phone')
        location = data.get('location')
        duration_minutes = data.get('duration_minutes', 0)
        
        if not all([username, phone, location]):
            return JsonResponse({
                'status': 'error',
                'message': 'Username, phone, and location are required'
            }, status=400)
        
        telegram_service = TelegramService()
        result = telegram_service.send_sos_alert(username, phone, location, duration_minutes)
        
        response = JsonResponse(result)
        response['Access-Control-Allow-Origin'] = '*'
        return response
        
    except Exception as e:
        error_response = JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)
        error_response['Access-Control-Allow-Origin'] = '*'
        return error_response

@csrf_exempt
@require_http_methods(["POST"])
def check_hotspot_status(request):
    """API endpoint to check if user is in hotspot and trigger SOS if needed"""
    try:
        data = json.loads(request.body)
        user_lat = float(data.get('lat'))
        user_lng = float(data.get('lng'))
        username = data.get('username')
        phone = data.get('phone')
        
        # Get crime hotspots
        api_key = "AIzaSyB5JCLElwe1mT7THvsehV0UHTyUQPlfjrE"
        service = CrimePredictionService(api_key)
        coordinates = service.generate_crime_hotspots('Chennai', 50)
        
        # Check if user is in any high-risk hotspot (within 500m)
        in_hotspot = False
        hotspot_info = None
        
        for coord in coordinates:
            if coord.get('risk_level') == 'high':
                distance = calculate_distance(user_lat, user_lng, coord['lat'], coord['lng'])
                if distance <= 0.5:  # Within 500 meters
                    in_hotspot = True
                    hotspot_info = coord
                    break
        
        response_data = {
            'in_hotspot': in_hotspot,
            'hotspot_info': hotspot_info,
            'user_location': f"{user_lat}, {user_lng}"
        }
        
        response = JsonResponse(response_data)
        response['Access-Control-Allow-Origin'] = '*'
        return response
        
    except Exception as e:
        error_response = JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)
        error_response['Access-Control-Allow-Origin'] = '*'
        return error_response

def calculate_distance(lat1, lng1, lat2, lng2):
    """Calculate distance between two coordinates in kilometers"""
    import math
    
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    
    a = (math.sin(dlat/2) * math.sin(dlat/2) + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlng/2) * math.sin(dlng/2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

# New API endpoints for user management

@csrf_exempt
@require_http_methods(["GET", "POST", "PUT"])
def user_profile(request):
    """API endpoint for user profile management"""
    try:
        if request.method == 'GET':
            # Get user profile by username or user_id
            username = request.GET.get('username')
            user_id = request.GET.get('user_id')
            
            if not username and not user_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Username or user_id is required'
                }, status=400)
            
            try:
                if user_id:
                    user_profile = UserProfile.objects.get(id=user_id)
                else:
                    user_profile = UserProfile.objects.get(username=username)
                
                # Get emergency contacts
                emergency_contacts = []
                for contact in user_profile.emergency_contacts.filter(is_active=True):
                    emergency_contacts.append({
                        'id': str(contact.id),
                        'name': contact.name,
                        'phone': contact.phone,
                        'relationship': contact.relationship,
                        'added_date': contact.created_at.isoformat()
                    })
                
                # Get latest location
                latest_location = None
                try:
                    location = user_profile.locations.first()
                    if location:
                        latest_location = {
                            'latitude': float(location.latitude),
                            'longitude': float(location.longitude),
                            'address': location.address,
                            'accuracy': location.accuracy,
                            'timestamp': location.timestamp.isoformat()
                        }
                except:
                    pass
                
                return JsonResponse({
                    'status': 'success',
                    'user': {
                        'id': str(user_profile.id),
                        'username': user_profile.username,
                        'email': user_profile.email,
                        'phone': user_profile.phone,
                        'role': user_profile.role,
                        'police_id': user_profile.police_id,
                        'police_rank': user_profile.police_rank,
                        'avatar': user_profile.avatar,
                        'bio': user_profile.bio,
                        'created_at': user_profile.created_at.isoformat(),
                        'last_active': user_profile.last_active.isoformat(),
                        'reports_submitted': user_profile.reports_submitted,
                        'alerts_received': user_profile.alerts_received,
                        'safety_score': user_profile.safety_score,
                        'preferences': {
                            'notifications_enabled': user_profile.notifications_enabled,
                            'location_tracking_enabled': user_profile.location_tracking_enabled,
                            'emergency_alerts_enabled': user_profile.emergency_alerts_enabled
                        },
                        'emergency_contacts': emergency_contacts,
                        'latest_location': latest_location
                    }
                })
            except UserProfile.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'User not found'
                }, status=404)
        
        elif request.method == 'POST':
            # Update user profile
            data = json.loads(request.body)
            username = data.get('username')
            
            if not username:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Username is required'
                }, status=400)
            
            try:
                user_profile = UserProfile.objects.get(username=username)
                
                # Update fields
                if 'email' in data:
                    user_profile.email = data['email']
                if 'phone' in data:
                    user_profile.phone = data['phone']
                if 'avatar' in data:
                    user_profile.avatar = data['avatar']
                if 'bio' in data:
                    user_profile.bio = data['bio']
                if 'preferences' in data:
                    prefs = data['preferences']
                    if 'notifications_enabled' in prefs:
                        user_profile.notifications_enabled = prefs['notifications_enabled']
                    if 'location_tracking_enabled' in prefs:
                        user_profile.location_tracking_enabled = prefs['location_tracking_enabled']
                    if 'emergency_alerts_enabled' in prefs:
                        user_profile.emergency_alerts_enabled = prefs['emergency_alerts_enabled']
                
                user_profile.save()
                
                # Log profile update activity
                UserActivity.objects.create(
                    user_profile=user_profile,
                    activity_type='profile_updated',
                    description=f'Profile updated successfully',
                    metadata={'updated_fields': list(data.keys())}
                )
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Profile updated successfully'
                })
            except UserProfile.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'User not found'
                }, status=404)
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET", "POST", "DELETE"])
def emergency_contacts(request):
    """API endpoint for emergency contacts management"""
    try:
        if request.method == 'GET':
            username = request.GET.get('username')
            if not username:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Username is required'
                }, status=400)
            
            try:
                user_profile = UserProfile.objects.get(username=username)
                contacts = []
                for contact in user_profile.emergency_contacts.filter(is_active=True):
                    contacts.append({
                        'id': str(contact.id),
                        'name': contact.name,
                        'phone': contact.phone,
                        'relationship': contact.relationship,
                        'added_date': contact.created_at.isoformat()
                    })
                
                return JsonResponse({
                    'status': 'success',
                    'contacts': contacts
                })
            except UserProfile.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'User not found'
                }, status=404)
        
        elif request.method == 'POST':
            # Add emergency contact
            data = json.loads(request.body)
            username = data.get('username')
            name = data.get('name')
            phone = data.get('phone')
            relationship = data.get('relationship')
            
            if not all([username, name, phone, relationship]):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Username, name, phone, and relationship are required'
                }, status=400)
            
            try:
                user_profile = UserProfile.objects.get(username=username)
                
                contact = EmergencyContact.objects.create(
                    user_profile=user_profile,
                    name=name,
                    phone=phone,
                    relationship=relationship
                )
                
                # Log contact addition activity
                UserActivity.objects.create(
                    user_profile=user_profile,
                    activity_type='contact_added',
                    description=f'Emergency contact {name} added',
                    metadata={'contact_id': str(contact.id), 'phone': phone}
                )
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Emergency contact added successfully',
                    'contact': {
                        'id': str(contact.id),
                        'name': contact.name,
                        'phone': contact.phone,
                        'relationship': contact.relationship,
                        'added_date': contact.created_at.isoformat()
                    }
                })
            except UserProfile.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'User not found'
                }, status=404)
        
        elif request.method == 'DELETE':
            # Delete emergency contact
            data = json.loads(request.body)
            contact_id = data.get('contact_id')
            
            if not contact_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Contact ID is required'
                }, status=400)
            
            try:
                contact = EmergencyContact.objects.get(id=contact_id)
                contact.is_active = False
                contact.save()
                
                # Log contact removal activity
                UserActivity.objects.create(
                    user_profile=contact.user_profile,
                    activity_type='contact_added',
                    description=f'Emergency contact {contact.name} removed',
                    metadata={'contact_id': str(contact.id)}
                )
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Emergency contact removed successfully'
                })
            except EmergencyContact.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Contact not found'
                }, status=404)
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def update_location(request):
    """API endpoint to update user location"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        address = data.get('address', '')
        accuracy = data.get('accuracy')
        
        if not all([username, latitude, longitude]):
            return JsonResponse({
                'status': 'error',
                'message': 'Username, latitude, and longitude are required'
            }, status=400)
        
        try:
            user_profile = UserProfile.objects.get(username=username)
            
            location = UserLocation.objects.create(
                user_profile=user_profile,
                latitude=latitude,
                longitude=longitude,
                address=address,
                accuracy=accuracy
            )
            
            # Log location update activity
            UserActivity.objects.create(
                user_profile=user_profile,
                activity_type='location_updated',
                description=f'Location updated to {latitude}, {longitude}',
                metadata={'latitude': latitude, 'longitude': longitude, 'address': address}
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Location updated successfully',
                'location': {
                    'id': str(location.id),
                    'latitude': float(location.latitude),
                    'longitude': float(location.longitude),
                    'address': location.address,
                    'accuracy': location.accuracy,
                    'timestamp': location.timestamp.isoformat()
                }
            })
        except UserProfile.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'User not found'
            }, status=404)
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def user_activities(request):
    """API endpoint to get user activities"""
    try:
        username = request.GET.get('username')
        limit = int(request.GET.get('limit', 50))
        
        if not username:
            return JsonResponse({
                'status': 'error',
                'message': 'Username is required'
            }, status=400)
        
        try:
            user_profile = UserProfile.objects.get(username=username)
            activities = []
            
            for activity in user_profile.activities.all()[:limit]:
                activities.append({
                    'id': str(activity.id),
                    'activity_type': activity.activity_type,
                    'description': activity.description,
                    'metadata': activity.metadata,
                    'timestamp': activity.timestamp.isoformat()
                })
            
            return JsonResponse({
                'status': 'success',
                'activities': activities
            })
        except UserProfile.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'User not found'
            }, status=404)
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)
