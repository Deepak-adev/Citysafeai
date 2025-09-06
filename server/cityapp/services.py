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
        Generate {count} realistic latitude and longitude coordinates for potential crime hotspots across Tamil Nadu state, India.
        
        STRICT REQUIREMENTS:
        - Coordinates must be within Tamil Nadu state boundaries only
        - NO water zones (Bay of Bengal, Arabian Sea, rivers, lakes)
        - Focus on land areas with cities, towns, villages
        - Include major cities: Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem, Tirunelveli
        - Tamil Nadu latitude range: 8.0° to 13.5° N
        - Tamil Nadu longitude range: 76.2° to 80.3° E
        
        Return ONLY a JSON array:
        [
            {{"lat": 13.0827, "lng": 80.2707, "risk_level": "high"}},
            {{"lat": 11.0168, "lng": 76.9558, "risk_level": "medium"}}
        ]
        
        Risk levels: "high", "medium", "low"
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Parse the JSON response
            coordinates = json.loads(response.text.strip())
            # Filter out water zone coordinates
            filtered_coords = self._filter_water_zones(coordinates)
            return filtered_coords[:count]
        
        except Exception as e:
            # Fallback: Generate random coordinates around Chennai if API fails
            return self._generate_fallback_coordinates(city, count)
    
    def _generate_fallback_coordinates(self, city: str, count: int) -> List[Dict]:
        """Fallback method to generate coordinates if API fails"""
        # Tamil Nadu major cities coordinates
        tn_cities = [
            (13.0827, 80.2707),  # Chennai
            (11.0168, 76.9558),  # Coimbatore
            (9.9252, 78.1198),   # Madurai
            (10.7905, 78.7047),  # Tiruchirappalli
            (11.6643, 78.1460),  # Salem
            (8.7642, 78.1348),   # Tirunelveli
        ]
        
        coordinates = []
        risk_levels = ["high", "medium", "low"]
        
        for i in range(count):
            base_lat, base_lng = tn_cities[i % len(tn_cities)]
            lat_offset = random.uniform(-0.3, 0.3)
            lng_offset = random.uniform(-0.3, 0.3)
            
            # Ensure within Tamil Nadu bounds
            lat = max(8.0, min(13.5, base_lat + lat_offset))
            lng = max(76.2, min(80.3, base_lng + lng_offset))
            
            coordinates.append({
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "risk_level": random.choice(risk_levels)
            })
        
        return self._filter_water_zones(coordinates)
    
    def _filter_water_zones(self, coordinates: List[Dict]) -> List[Dict]:
        """Filter out coordinates that fall in water zones"""
        filtered = []
        for coord in coordinates:
            lat, lng = coord['lat'], coord['lng']
            # Remove Chennai coastal areas (east of 80.25)
            if lat > 12.9 and lat < 13.2 and lng > 80.25:
                continue
            # Remove other known water zones
            if self._is_land_area(lat, lng):
                filtered.append(coord)
        return filtered
    
    def _is_land_area(self, lat: float, lng: float) -> bool:
        """Check if coordinates are in land area"""
        # Chennai: avoid Marina Beach area
        if 12.9 < lat < 13.2 and lng > 80.25:
            return False
        # Other basic water zone checks
        if lng > 80.28:  # Too far east (sea)
            return False
        return True