# pip install flask geopy requests

from flask import Flask, request, jsonify
from geopy.geocoders import Nominatim
import requests

app = Flask(__name__)
geolocator = Nominatim(user_agent="route_app")

# Function to get route from OSRM
def get_route_coords(start_lat, start_lon, end_lat, end_lon):
    url = f"http://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson"
    response = requests.get(url).json()
    # Return the list of coordinates along the route
    return response['routes'][0]['geometry']['coordinates']

@app.route("/", methods=["GET"])
def home():
    return '''
        <h2>Enter Route Details</h2>
        <form action="/coords" method="get">
            Source: <input type="text" name="source"><br><br>
            Destination: <input type="text" name="destination"><br><br>
            <input type="submit" value="Get Coordinates">
        </form>
    '''

@app.route("/coords", methods=["GET"])
def get_coords():
    source = request.args.get("source")
    destination = request.args.get("destination")

    if not source or not destination:
        return jsonify({"error": "Please provide both source and destination."})

    # Get lat/lon of source and destination
    src_location = geolocator.geocode(source)
    dest_location = geolocator.geocode(destination)

    if not src_location or not dest_location:
        return jsonify({"error": "Could not find one of the cities."})

    src_coords = {"lat": src_location.latitude, "lon": src_location.longitude}
    dest_coords = {"lat": dest_location.latitude, "lon": dest_location.longitude}

    # Get full route coordinates
    route_coords = get_route_coords(src_coords["lat"], src_coords["lon"], dest_coords["lat"], dest_coords["lon"])

    return jsonify({
        "source": src_coords,
        "destination": dest_coords,
        "route_coordinates": route_coords
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
