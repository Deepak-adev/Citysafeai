### CitysafeAI

CitysafeAI is a safety-focused platform combining a Next.js client and a Django backend. It supports patrol scheduling/routing, SOS handling, and integrations like Telegram and Google Generative AI for selected features.

---

## Prerequisites
- *Node.js*: 18+ (or 20+ recommended)
- *npm*: 9+ (bundled with Node)
- *Python*: 3.11 or 3.12
- *Git* (optional)

---

## Quick Start

1) Clone and open the project
bash
git clone <your-repo-url>
cd Citysafeai


2) Start the Django API (port 8000)
bash
cd server
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
# Optional demo data/users
python manage.py create_demo_users
python manage.py runserver 0.0.0.0:8000


3) Start the Next.js client (port 3000)
Open a new terminal:
bash
cd client/citysafeai
npm install
npm run dev


- Client: http://localhost:3000
- API: http://localhost:8000

---

## Project Structure
text
Citysafeai/
  client/                 # Next.js app (frontend)
    citysafeai/
      package.json
      app/
      components/
  server/                 # Django project (backend)
    manage.py
    requirements.txt
    cityapp/              # Main app (views, services, templates)
      management/commands/create_demo_users.py
      templates/cityapp/
    server/               # Django settings/urls
  test_*.py               # Simple test scripts (manual run)


---

## Configuration
Most development setups work without extra configuration.

- If you use API keys (e.g., Google Generative AI), set them in your environment before running the server:
bash
set GOOGLE_API_KEY=your_api_key_here


- If you change ports or hosts, ensure CORS and client fetch URLs match your API base (http://localhost:8000).

---

## Common Commands

Backend (Django):
bash
# From ./server
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver


Frontend (Next.js):
bash
# From ./client/citysafeai
npm run dev
npm run build
npm start


---

## Running Tests
Simple Python test scripts are provided at the repo root. With the server running, you can execute them individually:
bash
python test_django_sos.py
python test_patrol_routing.py
python test_telegram.py


---

## Troubleshooting
- If the client cannot reach the API, confirm the Django server is running on http://localhost:8000 and any fetch URLs use the correct base URL.
- On Windows PowerShell, activate the virtual environment with ./.venv/Scripts/Activate.ps1 if the activate command is blocked.
- If port 3000 or 8000 is occupied, change the port (e.g., python manage.py runserver 0.0.0.0:8001, npm run dev -- -p 3001).

---

## Screenshot / Preview
Add a screenshot of the website to assets/screenshot.png and it will display here:
md
![CitysafeAI Preview](assets/screenshot.png)


---

## License
Add your chosen license here.