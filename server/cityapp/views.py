from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from .services import CrimePredictionService
import json

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
        
        if not username or not password:
            return JsonResponse({
                'status': 'error',
                'message': 'Username and password are required'
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
