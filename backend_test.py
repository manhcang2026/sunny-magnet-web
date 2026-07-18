#!/usr/bin/env python3
"""
Backend API Tests for Sunny Magnet Landing Page - Extended Version
Tests all backend endpoints with comprehensive validation including new email/delivery fields
and order response (orderId, totalPrice, vietQrUrl)
"""

import requests
import json
import sys
import re
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
        
        return print_test("GET /api/health", True, "Returns {ok:true, service:'sunny-magnet'}")
        
    except Exception as e:
        return print_test("GET /api/health", False, f"Exception: {str(e)}")

def test_options_leads():
    """Test OPTIONS /api/leads"""
    print("\n" + "="*60)
    print("TEST 2: OPTIONS /api/leads")
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
    print("TEST 3: POST /api/leads - Validation (missing fields)")
    print("="*60)
    
    try:
        # Test missing fullName
        response = requests.post(
            f"{BASE_URL}/leads",
            json={"phone": "0912345678"},
            timeout=10
        )
        print(f"Missing fullName - Status: {response.status_code}, Response: {response.text}")
        
        if response.status_code != 400:
            return print_test("POST validation (missing fullName)", False, f"Expected 400, got {response.status_code}")
        
        # Test missing phone
        response = requests.post(
            f"{BASE_URL}/leads",
            json={"fullName": "Nguyen Van A"},
            timeout=10
        )
        print(f"Missing phone - Status: {response.status_code}, Response: {response.text}")
        
        if response.status_code != 400:
            return print_test("POST validation (missing phone)", False, f"Expected 400, got {response.status_code}")
        
        return print_test("POST /api/leads validation", True, "Correctly returns 400 for missing fullName or phone")
        
    except Exception as e:
        return print_test("POST /api/leads validation", False, f"Exception: {str(e)}")

def test_post_lead_full_payload():
    """Test POST /api/leads with FULL new payload including email, delivery"""
    print("\n" + "="*60)
    print("TEST 4: POST /api/leads - Full payload with email, delivery")
    print("="*60)
    
    try:
        lead_data = {
            "fullName": "Nguyen Van A",
            "phone": "0912345678",
            "address": "123 Le Loi, District 1, HCMC",
            "email": "test@example.com",
            "delivery": "home",
            "referralCode": "SUNNY10",
            "quantity": 13,
            "notes": "leave at door",
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
            return print_test("POST lead full payload status", False, f"Expected 200, got {response.status_code}")
        
        data = response.json()
        
        # Check success field
        if not data.get('success'):
            return print_test("POST lead success field", False, "Expected success:true")
        
        # Check webhookStatus
        if data.get('webhookStatus') != 'not_configured':
            return print_test("POST lead webhookStatus", False, f"Expected 'not_configured', got '{data.get('webhookStatus')}'")
        
        # Check lead object contains all fields including email and delivery
        lead = data.get('lead', {})
        
        if lead.get('email') != 'test@example.com':
            return print_test("POST lead email field", False, f"Expected 'test@example.com', got '{lead.get('email')}'")
        
        if lead.get('delivery') != 'home':
            return print_test("POST lead delivery field", False, f"Expected 'home', got '{lead.get('delivery')}'")
        
        # Validate UUID id
        if not lead.get('id') or len(lead.get('id', '')) != 36:
            return print_test("POST lead UUID id", False, f"Invalid UUID: {lead.get('id')}")
        
        # Validate ISO createdAt
        created_at = lead.get('createdAt')
        try:
            datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        except:
            return print_test("POST lead ISO createdAt", False, f"Invalid ISO format: {created_at}")
        
        # Validate source
        if lead.get('source') != 'landing_page':
            return print_test("POST lead source", False, f"Expected 'landing_page', got '{lead.get('source')}'")
        
        # Check orderId format: SM-XXXXXXXX
        order_id = data.get('orderId')
        if not order_id:
            return print_test("POST lead orderId", False, "Missing orderId in response")
        
        if not re.match(r'^SM-[A-Z0-9]+$', order_id):
            return print_test("POST lead orderId format", False, f"orderId '{order_id}' doesn't match pattern /^SM-[A-Z0-9]+$/")
        
        # Check totalPrice format and value for quantity=13
        total_price = data.get('totalPrice')
        if not total_price:
            return print_test("POST lead totalPrice", False, "Missing totalPrice in response")
        
        if not total_price.endswith('đ'):
            return print_test("POST lead totalPrice format", False, f"totalPrice '{total_price}' doesn't end with 'đ'")
        
        # For quantity=13: 13 - 1 free = 12 charged × 20000 = 240000 -> "240.000đ"
        if total_price != '240.000đ':
            return print_test("POST lead totalPrice value", False, f"Expected '240.000đ' for quantity=13, got '{total_price}'")
        
        # Check vietQrUrl
        viet_qr_url = data.get('vietQrUrl')
        if not viet_qr_url:
            return print_test("POST lead vietQrUrl", False, "Missing vietQrUrl in response")
        
        if not viet_qr_url.startswith('http'):
            return print_test("POST lead vietQrUrl format", False, f"vietQrUrl '{viet_qr_url}' doesn't start with 'http'")
        
        # Check message
        message = data.get('message')
        if not message or len(message) == 0:
            return print_test("POST lead message", False, "Missing or empty message in response")
        
        # Store lead ID for later verification
        global test_lead_id_full
        test_lead_id_full = lead.get('id')
        
        return print_test("POST /api/leads full payload", True, f"All fields validated including email, delivery, orderId={order_id}, totalPrice={total_price}")
        
    except Exception as e:
        return print_test("POST /api/leads full payload", False, f"Exception: {str(e)}")

def test_total_price_calculations():
    """Test totalPrice calculations for various quantities"""
    print("\n" + "="*60)
    print("TEST 5: totalPrice calculations for various quantities")
    print("="*60)
    
    test_cases = [
        (1, "20.000đ"),    # 1 × 20000 = 20000
        (5, "100.000đ"),   # 5 × 20000 = 100000
        (12, "240.000đ"),  # 12 × 20000 = 240000
        (13, "240.000đ"),  # (13 - 1 free) × 20000 = 240000
        (26, "480.000đ"),  # (26 - 2 free) × 20000 = 480000
        (0, "0đ"),         # 0 × 20000 = 0
    ]
    
    try:
        for quantity, expected_price in test_cases:
            lead_data = {
                "fullName": f"Test User Q{quantity}",
                "phone": f"091234{quantity:04d}",
                "address": "Test Address",
                "email": "test@example.com",
                "delivery": "pickup",
                "quantity": quantity,
                "language": "vi"
            }
            
            response = requests.post(
                f"{BASE_URL}/leads",
                json=lead_data,
                timeout=10
            )
            
            if response.status_code != 200:
                return print_test(f"totalPrice for quantity={quantity}", False, f"Request failed with {response.status_code}")
            
            data = response.json()
            total_price = data.get('totalPrice')
            
            print(f"Quantity: {quantity} -> totalPrice: {total_price} (expected: {expected_price})")
            
            if total_price != expected_price:
                return print_test(f"totalPrice for quantity={quantity}", False, f"Expected '{expected_price}', got '{total_price}'")
        
        return print_test("totalPrice calculations", True, "All quantity calculations correct (1, 5, 12, 13, 26, 0)")
        
    except Exception as e:
        return print_test("totalPrice calculations", False, f"Exception: {str(e)}")

def test_post_lead_pickup_delivery():
    """Test POST /api/leads with delivery='pickup'"""
    print("\n" + "="*60)
    print("TEST 6: POST /api/leads - delivery='pickup'")
    print("="*60)
    
    try:
        lead_data = {
            "fullName": "Tran Van B",
            "phone": "0987654321",
            "address": "456 Nguyen Trai, District 5, HCMC",
            "email": "pickup@example.com",
            "delivery": "pickup",
            "referralCode": "PICKUP20",
            "quantity": 5,
            "notes": "I will pick up at store",
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
            return print_test("POST lead pickup delivery status", False, f"Expected 200, got {response.status_code}")
        
        data = response.json()
        lead = data.get('lead', {})
        
        if lead.get('delivery') != 'pickup':
            return print_test("POST lead delivery='pickup'", False, f"Expected 'pickup', got '{lead.get('delivery')}'")
        
        # Store lead ID for later verification
        global test_lead_id_pickup
        test_lead_id_pickup = lead.get('id')
        
        return print_test("POST /api/leads delivery='pickup'", True, f"Pickup delivery stored correctly")
        
    except Exception as e:
        return print_test("POST /api/leads delivery='pickup'", False, f"Exception: {str(e)}")

def test_post_lead_bilingual_vietnamese():
    """Test POST /api/leads with Vietnamese language"""
    print("\n" + "="*60)
    print("TEST 7: POST /api/leads - Vietnamese language support")
    print("="*60)
    
    try:
        lead_data = {
            "fullName": "Lê Thị Cẩm",
            "phone": "0901234567",
            "address": "789 Trần Hưng Đạo, Quận 1, TP.HCM",
            "email": "lecam@example.com",
            "delivery": "home",
            "referralCode": "TETPROMO",
            "quantity": 10,
            "notes": "Giao hàng buổi chiều",
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
            return print_test("POST lead Vietnamese status", False, f"Expected 200, got {response.status_code}")
        
        data = response.json()
        lead = data.get('lead', {})
        
        if lead.get('language') != 'vi':
            return print_test("POST lead language='vi'", False, f"Expected 'vi', got '{lead.get('language')}'")
        
        # Store lead ID for later verification
        global test_lead_id_vi
        test_lead_id_vi = lead.get('id')
        
        return print_test("POST /api/leads Vietnamese", True, "Vietnamese language support working")
        
    except Exception as e:
        return print_test("POST /api/leads Vietnamese", False, f"Exception: {str(e)}")

def test_post_lead_extra_fields():
    """Test POST /api/leads with extra unknown fields (should be ignored)"""
    print("\n" + "="*60)
    print("TEST 8: POST /api/leads - Extra unknown fields ignored")
    print("="*60)
    
    try:
        lead_data = {
            "fullName": "Pham Van D",
            "phone": "0909876543",
            "address": "321 Vo Van Tan, District 3, HCMC",
            "email": "phamd@example.com",
            "delivery": "home",
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
        expected_fields = ['id', 'fullName', 'phone', 'address', 'email', 'delivery', 'referralCode', 'quantity', 'notes', 'language', 'source', 'createdAt']
        for field in lead.keys():
            if field not in expected_fields:
                return print_test("POST lead only expected fields", False, f"Unexpected field '{field}' in response")
        
        return print_test("POST /api/leads extra fields", True, "Extra unknown fields are safely ignored")
        
    except Exception as e:
        return print_test("POST /api/leads extra fields", False, f"Exception: {str(e)}")

def test_get_leads_list():
    """Test GET /api/leads includes new email/delivery fields"""
    print("\n" + "="*60)
    print("TEST 9: GET /api/leads - List includes email/delivery fields")
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
            return print_test("GET /api/leads", False, "No leads found")
        
        # Check first few leads for new fields
        found_with_email = False
        found_with_delivery = False
        
        for i, lead in enumerate(leads[:5]):
            print(f"\nLead {i+1}: {json.dumps(lead, indent=2)}")
            
            # Verify no _id field
            if '_id' in lead:
                return print_test("GET /api/leads no _id", False, f"Lead contains MongoDB _id field")
            
            # Check if email and delivery fields are present (for recently posted leads)
            if 'email' in lead:
                found_with_email = True
            if 'delivery' in lead:
                found_with_delivery = True
        
        if not found_with_email:
            return print_test("GET /api/leads email field", False, "No leads found with 'email' field (expected from recent posts)")
        
        if not found_with_delivery:
            return print_test("GET /api/leads delivery field", False, "No leads found with 'delivery' field (expected from recent posts)")
        
        return print_test("GET /api/leads", True, f"Returns {len(leads)} leads with email/delivery fields, no _id")
        
    except Exception as e:
        return print_test("GET /api/leads", False, f"Exception: {str(e)}")

def test_verify_posted_leads():
    """Verify that posted leads appear in GET /api/leads"""
    print("\n" + "="*60)
    print("TEST 10: Verify posted leads appear in GET list")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/leads", timeout=10)
        
        if response.status_code != 200:
            return print_test("Verify posted leads", False, f"GET request failed with {response.status_code}")
        
        data = response.json()
        leads = data.get('leads', [])
        
        # Check if our test leads are in the list
        lead_ids = [lead.get('id') for lead in leads]
        
        found_full = test_lead_id_full in lead_ids if 'test_lead_id_full' in globals() else False
        found_pickup = test_lead_id_pickup in lead_ids if 'test_lead_id_pickup' in globals() else False
        found_vi = test_lead_id_vi in lead_ids if 'test_lead_id_vi' in globals() else False
        
        print(f"Full payload lead ID: {test_lead_id_full if 'test_lead_id_full' in globals() else 'N/A'}")
        print(f"Pickup lead ID: {test_lead_id_pickup if 'test_lead_id_pickup' in globals() else 'N/A'}")
        print(f"Vietnamese lead ID: {test_lead_id_vi if 'test_lead_id_vi' in globals() else 'N/A'}")
        print(f"Found full payload lead: {found_full}")
        print(f"Found pickup lead: {found_pickup}")
        print(f"Found Vietnamese lead: {found_vi}")
        
        if 'test_lead_id_full' in globals() and not found_full:
            return print_test("Verify full payload lead in list", False, f"Full payload lead not found in GET list")
        
        if 'test_lead_id_pickup' in globals() and not found_pickup:
            return print_test("Verify pickup lead in list", False, f"Pickup lead not found in GET list")
        
        if 'test_lead_id_vi' in globals() and not found_vi:
            return print_test("Verify Vietnamese lead in list", False, f"Vietnamese lead not found in GET list")
        
        # Find and display the leads with email/delivery fields
        for lead in leads:
            if lead.get('id') in [test_lead_id_full if 'test_lead_id_full' in globals() else None,
                                   test_lead_id_pickup if 'test_lead_id_pickup' in globals() else None,
                                   test_lead_id_vi if 'test_lead_id_vi' in globals() else None]:
                print(f"\nFound test lead: {json.dumps(lead, indent=2)}")
                
                # Verify email and delivery fields are present
                if 'email' not in lead:
                    return print_test("Verify lead has email field", False, f"Lead {lead.get('id')} missing 'email' field")
                if 'delivery' not in lead:
                    return print_test("Verify lead has delivery field", False, f"Lead {lead.get('id')} missing 'delivery' field")
        
        return print_test("Verify posted leads in list", True, "All test leads found with email/delivery fields")
        
    except Exception as e:
        return print_test("Verify posted leads", False, f"Exception: {str(e)}")

def run_all_tests():
    """Run all backend tests"""
    print("\n" + "="*60)
    print("SUNNY MAGNET BACKEND API TESTS - EXTENDED VERSION")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    
    results = []
    
    # Run tests in order
    results.append(test_health_endpoint())
    results.append(test_options_leads())
    results.append(test_post_lead_validation())
    results.append(test_post_lead_full_payload())
    results.append(test_total_price_calculations())
    results.append(test_post_lead_pickup_delivery())
    results.append(test_post_lead_bilingual_vietnamese())
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
