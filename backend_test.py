import requests
import sys
import json
from datetime import datetime

class ClubBucksAPITester:
    def __init__(self, base_url="https://afterschool-wallet.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.cookies = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Use cookies for authentication (httpOnly cookies)
        session = requests.Session()
        if self.cookies:
            session.cookies.update(self.cookies)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = session.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = session.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.status_code != 204:  # No content
                    try:
                        response_data = response.json()
                        print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    except:
                        print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}")
                self.failed_tests.append({
                    'test': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:300]
                })

            # Store cookies for subsequent requests
            if response.cookies:
                self.cookies = response.cookies

            return success, response.json() if success and response.status_code != 204 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'test': name,
                'error': str(e)
            })
            return False, {}

    def test_auth_login(self, email, password):
        """Test login and get authentication cookies"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": email, "password": password}
        )
        return success

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "api/auth/me",
            200
        )
        return success, response

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "api/dashboard/stats",
            200
        )
        return success, response

    def test_dashboard_leaderboard(self):
        """Test leaderboard endpoint"""
        success, response = self.run_test(
            "Dashboard Leaderboard",
            "GET",
            "api/dashboard/leaderboard",
            200,
            params={"limit": 10}
        )
        return success, response

    def test_dashboard_recent_transactions(self):
        """Test recent transactions endpoint"""
        success, response = self.run_test(
            "Recent Transactions",
            "GET",
            "api/dashboard/recent-transactions",
            200,
            params={"limit": 5}
        )
        return success, response

    def test_get_members(self):
        """Test getting all members"""
        success, response = self.run_test(
            "Get All Members",
            "GET",
            "api/members",
            200
        )
        return success, response

    def test_search_members(self):
        """Test member search functionality"""
        success, response = self.run_test(
            "Search Members",
            "GET",
            "api/members",
            200,
            params={"search": "test"}
        )
        return success, response

    def test_get_member_by_id(self, member_id):
        """Test getting a specific member"""
        success, response = self.run_test(
            f"Get Member {member_id}",
            "GET",
            f"api/members/{member_id}",
            200
        )
        return success, response

    def test_create_transaction(self, member_id):
        """Test creating a transaction"""
        success, response = self.run_test(
            "Create Transaction",
            "POST",
            "api/transactions",
            200,
            data={
                "member_id": member_id,
                "type": "earn",
                "category": "Job",
                "amount": 10,
                "notes": "Test transaction"
            }
        )
        return success, response

    def test_get_transactions(self):
        """Test getting all transactions"""
        success, response = self.run_test(
            "Get All Transactions",
            "GET",
            "api/transactions",
            200,
            params={"limit": 50}
        )
        return success, response

    def test_qr_code_generation(self, member_id):
        """Test QR code generation"""
        success, response = self.run_test(
            f"Generate QR Code for {member_id}",
            "GET",
            f"api/qr/{member_id}",
            200
        )
        return success, response

    def test_qr_scan(self, qr_payload):
        """Test QR code scanning"""
        success, response = self.run_test(
            "Scan QR Code",
            "POST",
            f"api/qr/scan?payload={qr_payload}",
            200
        )
        return success, response

    def test_quick_transaction(self, member_id):
        """Test quick transaction endpoint"""
        success, response = self.run_test(
            "Quick Transaction",
            "POST",
            f"api/transactions/quick?member_id={member_id}&amount=5&type=earn",
            200
        )
        return success, response

    def test_google_oauth_session(self):
        """Test Google OAuth session endpoint (will fail without valid session_id)"""
        success, response = self.run_test(
            "Google OAuth Session",
            "POST",
            "api/auth/google/session",
            401,  # Expected to fail without valid session_id
            data={"session_id": "invalid_session_id"}
        )
        return success, response

    def test_parent_link_child(self, member_id):
        """Test parent link child endpoint"""
        success, response = self.run_test(
            "Parent Link Child",
            "POST",
            "api/parent/link-child",
            403,  # Expected to fail as admin is not a parent role
            data={"member_id": member_id}
        )
        return success, response

    def test_csv_upload_endpoint(self):
        """Test CSV upload endpoint structure (without actual file)"""
        # This will test the endpoint exists but fail due to missing file
        success, response = self.run_test(
            "CSV Upload Endpoint",
            "POST",
            "api/members/upload-csv",
            422,  # Expected to fail without file
            data={}
        )
        return success, response

    def test_member_update(self, member_id):
        """Test member update endpoint"""
        success, response = self.run_test(
            "Update Member",
            "PUT",
            f"api/members/{member_id}",
            200,
            data={
                "first_name": "Updated",
                "last_name": "Name",
                "notes": "Updated via API test"
            }
        )
        return success, response

def main():
    print("🚀 Starting Club Bucks API Testing...")
    print("=" * 60)
    
    # Setup
    tester = ClubBucksAPITester()
    admin_email = "admin@clubbucks.com"
    admin_password = "ClubBucks2024!"

    # Test 1: Admin Login
    if not tester.test_auth_login(admin_email, admin_password):
        print("❌ Admin login failed, stopping tests")
        return 1

    # Test 2: Get current user
    success, user_data = tester.test_auth_me()
    if not success:
        print("❌ Failed to get current user info")
        return 1

    # Test 3: Dashboard Stats
    success, stats = tester.test_dashboard_stats()
    if success:
        print(f"📊 Active Members: {stats.get('active_members', 0)}")
        print(f"💰 Total Bucks: {stats.get('current_bucks', 0)}")

    # Test 4: Dashboard Leaderboard
    success, leaderboard = tester.test_dashboard_leaderboard()
    if success and leaderboard:
        print(f"🏆 Top member: {leaderboard[0].get('display_name', 'N/A')} with {leaderboard[0].get('current_balance', 0)} bucks")

    # Test 5: Recent Transactions
    tester.test_dashboard_recent_transactions()

    # Test 6: Get All Members
    success, members = tester.test_get_members()
    test_member_id = None
    if success and members:
        test_member_id = members[0].get('member_id')
        print(f"👥 Found {len(members)} members, using {test_member_id} for testing")

    # Test 7: Search Members
    tester.test_search_members()

    # Test 8: Get Specific Member (if we have one)
    if test_member_id:
        success, member_data = tester.test_get_member_by_id(test_member_id)
        
        # Test 9: Create Transaction
        if success:
            tester.test_create_transaction(test_member_id)

        # Test 10: QR Code Generation
        success, qr_data = tester.test_qr_code_generation(test_member_id)
        
        # Test 11: QR Code Scanning
        if success and qr_data.get('qr_payload'):
            tester.test_qr_scan(qr_data['qr_payload'])

        # Test 12: Quick Transaction
        tester.test_quick_transaction(test_member_id)

        # Test 14: Member Update
        tester.test_member_update(test_member_id)

    # Test 13: Get All Transactions
    tester.test_get_transactions()

    # Test 15: Google OAuth Session (expected to fail)
    tester.test_google_oauth_session()

    # Test 16: Parent Link Child (expected to fail - admin not parent)
    if test_member_id:
        tester.test_parent_link_child(test_member_id)

    # Test 17: CSV Upload Endpoint
    tester.test_csv_upload_endpoint()

    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failed in tester.failed_tests:
            print(f"   - {failed.get('test', 'Unknown')}: {failed}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"✅ Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())