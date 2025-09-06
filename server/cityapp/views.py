from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
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
