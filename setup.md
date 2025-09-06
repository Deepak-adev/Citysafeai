# CitySafe AI Setup Instructions

## Backend Setup (Django Server)

1. Navigate to the server directory:
```bash
cd server
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run Django migrations:
```bash
python manage.py migrate
```

4. Start the Django server:
```bash
python manage.py runserver
```

The Django server will run on `http://localhost:8000`

## Frontend Setup (Next.js Client)

1. Navigate to the client directory:
```bash
cd client/citysafeai
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The Next.js client will run on `http://localhost:3000`

## API Integration

The map component now fetches crime hotspot data from the Django server's Gemini API endpoint:
- **Endpoint**: `http://localhost:8000/api/crime-predictions/`
- **Parameters**: 
  - `city`: City name (default: Chennai)
  - `count`: Number of coordinates to generate (default: 100)

## Changes Made

1. **Map Component**: Modified to fetch data from server API instead of using hardcoded values
2. **Django Settings**: Added CORS support for frontend-backend communication
3. **Requirements**: Added `django-cors-headers` dependency
4. **Views**: Enhanced API endpoint with proper HTTP method restrictions

## Fallback Behavior

If the server API is unavailable, the map component will fall back to a minimal set of default coordinates to ensure the application continues to function.