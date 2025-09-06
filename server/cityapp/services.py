import google.generativeai as genai
import json
import random
from typing import List, Dict

class CrimePredictionService:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    def generate_crime_hotspots(self, city: str = "Chennai", count: int = 100) -> List[Dict]:
        """Generate crime prediction coordinates using Gemini API"""
        
        prompt = f"""
        Generate {count} realistic latitude and longitude coordinates for potential crime hotspots in {city}, India.
        Consider factors like:
        - High population density areas
        - Commercial districts
        - Transportation hubs
        - Areas with poor lighting
        - Historical crime data patterns
        
        Return ONLY a JSON array with this exact format:
        [
            {{"lat": 13.0827, "lng": 80.2707, "risk_level": "high"}},
            {{"lat": 13.0878, "lng": 80.2785, "risk_level": "medium"}}
        ]
        
        Risk levels should be: "high", "medium", "low"
        Coordinates should be within {city}'s actual boundaries.
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Parse the JSON response
            coordinates = json.loads(response.text.strip())
            return coordinates[:count]  # Ensure we don't exceed requested count
        
        except Exception as e:
            # Fallback: Generate random coordinates around Chennai if API fails
            return self._generate_fallback_coordinates(city, count)
    
    def _generate_fallback_coordinates(self, city: str, count: int) -> List[Dict]:
        """Fallback method to generate coordinates if API fails"""
        # Chennai approximate bounds
        base_lat = 13.0827
        base_lng = 80.2707
        
        coordinates = []
        risk_levels = ["high", "medium", "low"]
        
        for _ in range(count):
            # Generate random coordinates within ~50km radius of city center
            lat_offset = random.uniform(-0.5, 0.5)
            lng_offset = random.uniform(-0.5, 0.5)
            
            coordinates.append({
                "lat": round(base_lat + lat_offset, 6),
                "lng": round(base_lng + lng_offset, 6),
                "risk_level": random.choice(risk_levels)
            })
        
        return coordinates