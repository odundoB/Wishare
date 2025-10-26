import requests
import json

# Test Configuration
BASE_URL = "http://127.0.0.1:8000/api"
REGISTER_URL = f"{BASE_URL}/users/register/"
LOGIN_URL = f"{BASE_URL}/users/login/"

def test_student_registration():
    """Test student registration with all required fields"""
    print("🧪 Testing Student Registration...")
    
    student_data = {
        "first_name": "John",
        "middle_name": "Michael",
        "surname": "Doe",
        "admission_number": "ST2025001",
        "email": "john.doe@student.com",
        "password": "SecurePass123!",
        "confirm_password": "SecurePass123!",
        "username": "ST2025001",
        "role": "student"
    }
    
    try:
        response = requests.post(REGISTER_URL, json=student_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("✅ Student registration successful!")
            return True
        else:
            print("❌ Student registration failed!")
            return False
    except Exception as e:
        print(f"❌ Error during student registration: {e}")
        return False

def test_teacher_registration():
    """Test teacher registration with all required fields"""
    print("\n🧪 Testing Teacher Registration...")
    
    teacher_data = {
        "first_name": "Jane",
        "surname": "Smith",
        "department": "Computer Science",
        "department_secondary": "Mathematics", 
        "email": "jane.smith@teacher.com",
        "password": "SecurePass123!",
        "confirm_password": "SecurePass123!",
        "username": "Jane",
        "role": "teacher"
    }
    
    try:
        response = requests.post(REGISTER_URL, json=teacher_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("✅ Teacher registration successful!")
            return True
        else:
            print("❌ Teacher registration failed!")
            return False
    except Exception as e:
        print(f"❌ Error during teacher registration: {e}")
        return False

def test_student_login():
    """Test student login using admission number"""
    print("\n🧪 Testing Student Login...")
    
    login_data = {
        "username": "ST2025001",
        "password": "SecurePass123!"
    }
    
    try:
        response = requests.post(LOGIN_URL, json=login_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Student login successful!")
            return True
        else:
            print("❌ Student login failed!")
            return False
    except Exception as e:
        print(f"❌ Error during student login: {e}")
        return False

def test_teacher_login():
    """Test teacher login using first name"""
    print("\n🧪 Testing Teacher Login...")
    
    login_data = {
        "username": "Jane", 
        "password": "SecurePass123!"
    }
    
    try:
        response = requests.post(LOGIN_URL, json=login_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Teacher login successful!")
            return True
        else:
            print("❌ Teacher login failed!")
            return False
    except Exception as e:
        print(f"❌ Error during teacher login: {e}")
        return False

def main():
    """Run all authentication tests"""
    print("🚀 Starting Authentication System Tests")
    print("=" * 50)
    
    # Run tests
    results = []
    results.append(test_student_registration())
    results.append(test_teacher_registration())
    results.append(test_student_login())
    results.append(test_teacher_login())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"✅ Passed: {sum(results)}/{len(results)}")
    print(f"❌ Failed: {len(results) - sum(results)}/{len(results)}")
    
    if all(results):
        print("\n🎉 All tests passed! Authentication system is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    main()