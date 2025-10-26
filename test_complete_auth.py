import requests
import json

def test_complete_auth_flow():
    """Test complete authentication flow with unique user"""
    print("🚀 Testing Complete Authentication Flow")
    print("=" * 50)
    
    base_url = "http://127.0.0.1:8000/api"
    
    # Generate unique user data
    import time
    timestamp = str(int(time.time()))
    
    student_data = {
        "first_name": "TestUser",
        "middle_name": "Middle",
        "surname": "LastName", 
        "admission_number": f"ADM{timestamp}",
        "email": f"testuser{timestamp}@student.com",
        "password": "SecurePass123!",
        "confirm_password": "SecurePass123!",
        "username": f"ADM{timestamp}",
        "role": "student"
    }
    
    teacher_data = {
        "first_name": f"Teacher{timestamp}",
        "surname": "TeacherLast",
        "department": "Computer Science",
        "department_secondary": "Mathematics",
        "email": f"teacher{timestamp}@teacher.com", 
        "password": "SecurePass123!",
        "confirm_password": "SecurePass123!",
        "username": f"Teacher{timestamp}",
        "role": "teacher"
    }
    
    results = []
    
    # Test 1: Student Registration
    print("1️⃣ Testing Student Registration...")
    try:
        response = requests.post(f"{base_url}/users/register/", json=student_data)
        if response.status_code == 201:
            print("   ✅ Student registration successful!")
            results.append(True)
        else:
            print(f"   ❌ Student registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            results.append(False)
    except Exception as e:
        print(f"   ❌ Student registration error: {e}")
        results.append(False)
    
    # Test 2: Student Login
    print("2️⃣ Testing Student Login...")
    try:
        login_data = {
            "username": student_data["admission_number"],
            "password": student_data["password"]
        }
        response = requests.post(f"{base_url}/users/login/", json=login_data)
        if response.status_code == 200:
            print("   ✅ Student login successful!")
            student_tokens = response.json()
            results.append(True)
        else:
            print(f"   ❌ Student login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            results.append(False)
    except Exception as e:
        print(f"   ❌ Student login error: {e}")
        results.append(False)
    
    # Test 3: Teacher Registration  
    print("3️⃣ Testing Teacher Registration...")
    try:
        response = requests.post(f"{base_url}/users/register/", json=teacher_data)
        if response.status_code == 201:
            print("   ✅ Teacher registration successful!")
            results.append(True)
        else:
            print(f"   ❌ Teacher registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            results.append(False)
    except Exception as e:
        print(f"   ❌ Teacher registration error: {e}")
        results.append(False)
    
    # Test 4: Teacher Login
    print("4️⃣ Testing Teacher Login...")
    try:
        login_data = {
            "username": teacher_data["first_name"],
            "password": teacher_data["password"]
        }
        response = requests.post(f"{base_url}/users/login/", json=login_data)
        if response.status_code == 200:
            print("   ✅ Teacher login successful!")
            teacher_tokens = response.json()
            results.append(True)
        else:
            print(f"   ❌ Teacher login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            results.append(False)
    except Exception as e:
        print(f"   ❌ Teacher login error: {e}")
        results.append(False)
    
    # Test 5: Token-based Profile Access
    print("5️⃣ Testing Profile Access with Tokens...")
    try:
        if len(results) >= 2 and results[1]:  # If student login succeeded
            headers = {"Authorization": f"Bearer {student_tokens['access']}"}
            response = requests.get(f"{base_url}/users/profile/", headers=headers)
            if response.status_code == 200:
                print("   ✅ Profile access successful!")
                results.append(True)
            else:
                print(f"   ❌ Profile access failed: {response.status_code}")
                results.append(False)
        else:
            print("   ❌ Skipping profile test (login failed)")
            results.append(False)
    except Exception as e:
        print(f"   ❌ Profile access error: {e}")
        results.append(False)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Complete Test Results:")
    print(f"   ✅ Passed: {sum(results)}/{len(results)}")
    print(f"   ❌ Failed: {len(results) - sum(results)}/{len(results)}")
    
    test_names = [
        "Student Registration",
        "Student Login", 
        "Teacher Registration",
        "Teacher Login",
        "Profile Access"
    ]
    
    print("\n📋 Detailed Results:")
    for i, (test_name, passed) in enumerate(zip(test_names, results)):
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {i+1}. {test_name}: {status}")
    
    if all(results):
        print("\n🎉 ALL TESTS PASSED! Authentication system is fully functional.")
        return True
    else:
        print("\n⚠️ Some tests failed. Check the details above.")
        return False

if __name__ == "__main__":
    test_complete_auth_flow()