#!/usr/bin/env python3
"""
Backend API Tests for Sunny Magnet Landing Page
Tests all backend endpoints with comprehensive validation
"""

import requests
import json
import sys
from datetime import datetime

# Base URL from environment
BASE_URL = "https://sunny-photo-shop.preview.emergentagent.com/api"

def print_test(name, passed, details=""):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {name}")
    if details:
        print(f"  Details: {details}")
    return passed

def test_health_endpoint():
    """Test GET /api/health"""
    print("\n" + "="*60)
    print("TEST 1: GET /api/health")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 200:
            return print_test("Health endpoint status code", False, f"Expected 200, got {response.status_code}")
        
        data = response.json()
        
        # Check required fields
        if not data.get('ok'):
            return print_test("Health endpoint 'ok' field", False, "Expected ok:true")
        
        if data.get('service') != 'sunny-magnet':
            return print_test("Health endpoint 'service' field", False, f"Expected 'sunny-magnet', got '{data.get('service')}'")
        
        return print_test("GET /api/health", True, "Returns correct health status")
        
    except Exception as e:
        return print_test("GET /api/health", False, f"Exception: {str(e)}")

def test_root_endpoint():
    """Test GET /api (root)"""
    print("\n" + "="*60)
    print("TEST 2: GET /api (root)")
    print("="*60)
    
    try:
        response = requests.get(BASE_URL, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 200:
            return print_test("Root endpoint status code", False, f"Expected 200, got {response.status_code}")
        
        data = response.json()
        
        if not data.get('ok'):
            return print_test("Root endpoint 'ok' field", False, "Expected ok:true")
        
        return print_test("GET /api (root)", True, "Returns ok:true")
        
    except Exception as e:
        return print_test("GET /api (root)", False, f"Exception: {str(e)}")

def test_options_leads():
    """Test OPTIONS /api/leads"""
    print("\n" + "="*60)
    print("TEST 3: OPTIONS /api/leads")
    print("="*60)
    
    try:
        response = requests.options(f"{BASE_URL}/leads", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code != 204:
            return print_test("OPTIONS /api/leads status", False, f"Expected 204, got {response.status_code}")
        
        # Check CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        print(f"CORS Headers: {cors_headers}")
        
        if not cors_headers['Access-Control-Allow-Origin']:
            return print_test("OPTIONS CORS headers", False, "Missing Access-Control-Allow-Origin")
        
        return print_test("OPTIONS /api/leads", True, "Returns 204 with CORS headers")
        
    except Exception as e:
        return print_test("OPTIONS /api/leads", False, f"Exception: {str(e)}")

def test_post_lead_validation():
    """Test POST /api/leads validation (missing required fields)"""
    print("\n" + "="*60)
    print("TEST 4: POST /api/leads - Validation (missing fields)")
    print("="*60)
    
    try:
        # Test missing fullName
        response = requests.post(
            f"{BASE_URL}/leads",
            json={"phone": "0123456789"},
            timeout=10
        )
        print(f"Missing fullName - Status: {response.status_code}, Response: {response.text}")
        
        if response.status_code != 400:
            return print_test("POST validation (missing fullName)", False, f"Expected 400, got {response.status_code}")
        
        # Test missing phone
        response = requests.post(
            f"{BASE_URL}/leads",
            json={"fullName": "Test User"},
            timeout=10
        )
        print(f"Missing phone - Status: {response.status_code}, Response: {response.text}")
        
        if response.status_code != 400:
            return print_test("POST validation (missing phone)", False, f"Expected 400, got {response.status_code}")
        
        # Test missing both
        response = requests.post(
            f"{BASE_URL}/leads",
            json={},
            timeout=10
        )
        print(f"Missing both - Status: {response.status_code}, Response: {response.text}")
        
        if response.status_code != 400:
            return print_test("POST validation (missing both)", False, f"Expected 400, got {response.status_code}")
        
        return print_test("POST /api/leads validation", True, "Correctly returns 400 for missing required fields")
        
    except Exception as e:
        return print_test("POST /api/leads validation", False, f"Exception: {str(e)}")

def test_post_lead_success_english():
    """Test POST /api/leads with valid data (English)"""
    print("\n" + "="*60)
    print("TEST 5: POST /api/leads - Success (English)")
    print("="*60)
    
    try:
        lead_data = {
            "fullName": "Nguyen Van An",
            "phone": "+84901234567",
            "address": "123 Nguyen Hue, District 1, Ho Chi Minh City",
            "referralCode": "FRIEND2024",
            "quantity": 15,
            "notes": "Please deliver before Tet holiday",
            "language": "en"
        }
        
        response = requests.post(
            f"{BASE_URL}/leads",
            json=lead_data,
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            return print_test("POST lead (English) status", False, f"Expected 200, got {response.status_code}")
        
        data = response.json()
        
        # Check success field
        if not data.get('success'):
            return print_test("POST lead success field", False, "Expected success:true")
        
        # Check webhookStatus
        if data.get('webhookStatus') != 'not_configured':
            return print_test("POST lead webhookStatus", False, f"Expected 'not_configured', got '{data.get('webhookStatus')}'")
        
        # Check lead object
        lead = data.get('lead', {})
        
        # Validate UUID id
        if not lead.get('id') or not isinstance(lead.get('id'), str):
            return print_test("POST lead UUID id", False, f"Expected UUID string, got {lead.get('id')}")
        
        if len(lead.get('id', '')) != 36:  # UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
            return print_test("POST lead UUID format", False, f"Invalid UUID format: {lead.get('id')}")
        
        # Validate ISO createdAt
        created_at = lead.get('createdAt')
        if not created_at:
            return print_test("POST lead createdAt", False, "Missing createdAt field")
        
        try:
            datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        except:
            return print_test("POST lead ISO createdAt", False, f"Invalid ISO format: {created_at}")
        
        # Validate source
        if lead.get('source') != 'landing_page':
            return print_test("POST lead source", False, f"Expected 'landing_page', got '{lead.get('source')}'")
        
        # Validate all fields are present
        required_fields = ['id', 'fullName', 'phone', 'address', 'referralCode', 'quantity', 'notes', 'language', 'source', 'createdAt']
        for field in required_fields:
            if field not in lead:
                return print_test(f"POST lead field '{field}'", False, f"Missing field: {field}")
        
        # Validate field values
        if lead.get('fullName') != lead_data['fullName']:
            return print_test("POST lead fullName", False, f"Mismatch: {lead.get('fullName')}")
        
        if lead.get('phone') != lead_data['phone']:
            return print_test("POST lead phone", False, f"Mismatch: {lead.get('phone')}")
        
        if lead.get('language') != 'en':
            return print_test("POST lead language", False, f"Expected 'en', got '{lead.get('language')}'")
        
        # Store lead ID for later verification
        global test_lead_id_en
        test_lead_id_en = lead.get('id')
        
        return print_test("POST /api/leads (English)", True, f"Lead created successfully with ID: {test_lead_id_en}")
        
    except Exception as e:
        return print_test("POST /api/leads (English)", False, f"Exception: {str(e)}")

def test_post_lead_success_vietnamese():
    """Test POST /api/leads with valid data (Vietnamese)"""
    print("\n" + "="*60)
    print("TEST 6: POST /api/leads - Success (Vietnamese)")
    print("="*60)
    
    try:
        lead_data = {
            "fullName": "Trần Thị Bình",
            "phone": "+84907654321",
            "address": "456 Lê Lợi, Quận 3, TP. Hồ Chí Minh",
            "referralCode": "TETPROMO",
            "quantity": 20,
            "notes": "Giao hàng buổi sáng",
            "language": "vi"
        }
        
        response = requests.post(
            f"{BASE_URL}/leads",
            json=lead_data,
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            return print_test("POST lead (Vietnamese) status", False, f"Expected 200, got {response.status_code}")
        
        data = response.json()
        lead = data.get('lead', {})
        
        # Validate language is Vietnamese
        if lead.get('language') != 'vi':
            return print_test("POST lead language (vi)", False, f"Expected 'vi', got '{lead.get('language')}'")
        
        # Store lead ID for later verification
        global test_lead_id_vi
        test_lead_id_vi = lead.get('id')
        
        return print_test("POST /api/leads (Vietnamese)", True, f"Vietnamese lead created with ID: {test_lead_id_vi}")
        
    except Exception as e:
        return print_test("POST /api/leads (Vietnamese)", False, f"Exception: {str(e)}")

def test_post_lead_extra_fields():
    """Test POST /api/leads with extra unknown fields"""
    print("\n" + "="*60)
    print("TEST 7: POST /api/leads - Extra unknown fields")
    print("="*60)
    
    try:
        lead_data = {
            "fullName": "Lê Văn Cường",
            "phone": "+84909876543",
            "address": "789 Hai Bà Trưng, Hà Nội",
            "language": "en",
            # Extra unknown fields
            "extraField1": "should be ignored",
            "unknownData": {"nested": "object"},
            "randomArray": [1, 2, 3],
            "hackerField": "<script>alert('xss')</script>"
        }
        
        response = requests.post(
            f"{BASE_URL}/leads",
            json=lead_data,
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            return print_test("POST lead with extra fields status", False, f"Expected 200, got {response.status_code}")
        
        data = response.json()
        lead = data.get('lead', {})
        
        # Verify extra fields are NOT in the response
        extra_fields = ['extraField1', 'unknownData', 'randomArray', 'hackerField']
        for field in extra_fields:
            if field in lead:
                return print_test("POST lead extra fields ignored", False, f"Extra field '{field}' was not ignored")
        
        # Verify only expected fields are present
        expected_fields = ['id', 'fullName', 'phone', 'address', 'referralCode', 'quantity', 'notes', 'language', 'source', 'createdAt']
        for field in lead.keys():
            if field not in expected_fields:
                return print_test("POST lead only expected fields", False, f"Unexpected field '{field}' in response")
        
        return print_test("POST /api/leads extra fields", True, "Extra unknown fields are safely ignored")
        
    except Exception as e:
        return print_test("POST /api/leads extra fields", False, f"Exception: {str(e)}")

def test_get_leads_list():
    """Test GET /api/leads"""
    print("\n" + "="*60)
    print("TEST 8: GET /api/leads - List all leads")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/leads", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            return print_test("GET /api/leads status", False, f"Expected 200, got {response.status_code}")
        
        data = response.json()
        print(f"Response structure: {list(data.keys())}")
        
        # Check leads array exists
        if 'leads' not in data:
            return print_test("GET /api/leads structure", False, "Missing 'leads' array in response")
        
        leads = data.get('leads', [])
        print(f"Number of leads: {len(leads)}")
        
        if len(leads) == 0:
            return print_test("GET /api/leads", False, "No leads found (expected at least the test leads we created)")
        
        # Check first few leads
        for i, lead in enumerate(leads[:3]):
            print(f"\nLead {i+1}: {json.dumps(lead, indent=2)}")
            
            # Verify no _id field
            if '_id' in lead:
                return print_test("GET /api/leads no _id", False, f"Lead contains MongoDB _id field")
            
            # Verify required fields
            required_fields = ['id', 'fullName', 'phone', 'createdAt', 'source']
            for field in required_fields:
                if field not in lead:
                    return print_test(f"GET /api/leads field '{field}'", False, f"Missing field in lead")
        
        # Verify sorting (most recent first)
        if len(leads) >= 2:
            first_date = datetime.fromisoformat(leads[0]['createdAt'].replace('Z', '+00:00'))
            second_date = datetime.fromisoformat(leads[1]['createdAt'].replace('Z', '+00:00'))
            if first_date < second_date:
                return print_test("GET /api/leads sorting", False, "Leads not sorted by most recent first")
        
        return print_test("GET /api/leads", True, f"Returns {len(leads)} leads, sorted by most recent, no _id field")
        
    except Exception as e:
        return print_test("GET /api/leads", False, f"Exception: {str(e)}")

def test_verify_posted_leads():
    """Verify that posted leads appear in GET /api/leads"""
    print("\n" + "="*60)
    print("TEST 9: Verify posted leads appear in GET list")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/leads", timeout=10)
        
        if response.status_code != 200:
            return print_test("Verify posted leads", False, f"GET request failed with {response.status_code}")
        
        data = response.json()
        leads = data.get('leads', [])
        
        # Check if our test leads are in the list
        lead_ids = [lead.get('id') for lead in leads]
        
        found_en = test_lead_id_en in lead_ids if 'test_lead_id_en' in globals() else False
        found_vi = test_lead_id_vi in lead_ids if 'test_lead_id_vi' in globals() else False
        
        print(f"English lead ID: {test_lead_id_en if 'test_lead_id_en' in globals() else 'N/A'}")
        print(f"Vietnamese lead ID: {test_lead_id_vi if 'test_lead_id_vi' in globals() else 'N/A'}")
        print(f"Found English lead: {found_en}")
        print(f"Found Vietnamese lead: {found_vi}")
        
        if 'test_lead_id_en' in globals() and not found_en:
            return print_test("Verify English lead in list", False, f"English lead {test_lead_id_en} not found in GET list")
        
        if 'test_lead_id_vi' in globals() and not found_vi:
            return print_test("Verify Vietnamese lead in list", False, f"Vietnamese lead {test_lead_id_vi} not found in GET list")
        
        # Find and display the leads
        for lead in leads:
            if lead.get('id') == test_lead_id_en:
                print(f"\nFound English lead: {json.dumps(lead, indent=2)}")
            if lead.get('id') == test_lead_id_vi:
                print(f"\nFound Vietnamese lead: {json.dumps(lead, indent=2)}")
        
        return print_test("Verify posted leads in list", True, "Both English and Vietnamese leads found in GET list")
        
    except Exception as e:
        return print_test("Verify posted leads", False, f"Exception: {str(e)}")

def run_all_tests():
    """Run all backend tests"""
    print("\n" + "="*60)
    print("SUNNY MAGNET BACKEND API TESTS")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    
    results = []
    
    # Run tests in order
    results.append(test_health_endpoint())
    results.append(test_root_endpoint())
    results.append(test_options_leads())
    results.append(test_post_lead_validation())
    results.append(test_post_lead_success_english())
    results.append(test_post_lead_success_vietnamese())
    results.append(test_post_lead_extra_fields())
    results.append(test_get_leads_list())
    results.append(test_verify_posted_leads())
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    print(f"Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n✅ ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n❌ {total - passed} TEST(S) FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(run_all_tests())
