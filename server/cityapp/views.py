from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from .services import CrimePredictionService
import json

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
@require_http_methods(["GET"])
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
        police_id = data.get('police_id', '')
        
        if not username or not password:
            return JsonResponse({
                'status': 'error',
                'message': 'Username and password are required'
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
            
            if User.objects.filter(last_name=police_id).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'Police ID already registered'
                }, status=400)
        
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'Username already exists'
            }, status=400)
        
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email
        )
        user.first_name = role
        if role == 'police':
            user.last_name = police_id
        user.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'User registered successfully'
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
            return JsonResponse({
                'status': 'success',
                'message': 'Login successful',
                'user': {
                    'username': user.username,
                    'role': user.first_name or 'public',
                    'email': user.email
                }
            })
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
