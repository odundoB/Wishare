import requests
import json

# Test if backend is accessible
backend_url = "http://127.0.0.1:8000"

try:
    # Test basic API connectivity
    response = requests.get(f"{backend_url}/api/notifications/")
    print(f"API Status Code: {response.status_code}")
    print(f"API Response: {response.text[:200]}...")
    
    # Test rooms endpoint
    response = requests.get(f"{backend_url}/api/notifications/rooms/")
    print(f"Rooms Status Code: {response.status_code}")
    print(f"Rooms Response: {response.text[:200]}...")
    
except Exception as e:
    print(f"Error connecting to backend: {e}")