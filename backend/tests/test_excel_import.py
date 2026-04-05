"""
Test Excel Import Results - Verify 258 members imported from Excel file
Tests:
- GET /api/members returns all 258 members
- Search for specific members (Reese Hoban, ROMANO PARISI)
- Status filter returns correct count
- Member data structure validation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestExcelImportResults:
    """Test suite for verifying Excel import of 258 members"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get auth cookies"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@clubbucks.com", "password": "ClubBucks2024!"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        print(f"✓ Login successful: {login_response.json().get('email')}")
        yield
    
    def test_01_login_flow(self):
        """Test login with admin credentials"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@clubbucks.com", "password": "ClubBucks2024!"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@clubbucks.com"
        assert data["role"] == "admin"
        print(f"✓ Login test passed - User: {data['name']}, Role: {data['role']}")
    
    def test_02_get_all_members_count(self):
        """Test GET /api/members returns all 258 members"""
        response = self.session.get(f"{BASE_URL}/api/members")
        assert response.status_code == 200, f"Failed to get members: {response.text}"
        
        members = response.json()
        member_count = len(members)
        print(f"✓ Total members returned: {member_count}")
        
        # Verify we have 258 members
        assert member_count == 258, f"Expected 258 members, got {member_count}"
        print(f"✓ Member count verified: 258 members")
    
    def test_03_member_data_structure(self):
        """Test member data has correct fields"""
        response = self.session.get(f"{BASE_URL}/api/members")
        assert response.status_code == 200
        
        members = response.json()
        assert len(members) > 0, "No members found"
        
        # Check first member has required fields
        member = members[0]
        required_fields = ['member_id', 'first_name', 'last_name', 'display_name', 'status', 'current_balance']
        
        for field in required_fields:
            assert field in member, f"Missing field: {field}"
        
        print(f"✓ Member data structure verified with fields: {required_fields}")
    
    def test_04_search_reese_hoban(self):
        """Test search for Reese Hoban - member_id Mem-05152 with balance 45"""
        response = self.session.get(f"{BASE_URL}/api/members", params={"search": "Reese"})
        assert response.status_code == 200, f"Search failed: {response.text}"
        
        members = response.json()
        print(f"✓ Search 'Reese' returned {len(members)} result(s)")
        
        # Find Reese Hoban
        reese = None
        for m in members:
            if "Reese" in m.get("first_name", "") or "Reese" in m.get("last_name", ""):
                reese = m
                break
        
        assert reese is not None, "Reese Hoban not found in search results"
        print(f"✓ Found member: {reese.get('display_name')}")
        
        # Verify member_id
        assert reese.get("member_id") == "Mem-05152", f"Expected member_id Mem-05152, got {reese.get('member_id')}"
        print(f"✓ Member ID verified: {reese.get('member_id')}")
        
        # Verify balance is 45
        balance = reese.get("current_balance", 0)
        assert balance == 45, f"Expected balance 45, got {balance}"
        print(f"✓ Balance verified: {balance}")
    
    def test_05_search_romano_parisi(self):
        """Test search for ROMANO PARISI - member_id Mem-06275"""
        response = self.session.get(f"{BASE_URL}/api/members", params={"search": "ROMANO"})
        assert response.status_code == 200, f"Search failed: {response.text}"
        
        members = response.json()
        print(f"✓ Search 'ROMANO' returned {len(members)} result(s)")
        
        # Find ROMANO PARISI
        romano = None
        for m in members:
            if "ROMANO" in m.get("first_name", "").upper() or "ROMANO" in m.get("last_name", "").upper():
                romano = m
                break
        
        assert romano is not None, "ROMANO PARISI not found in search results"
        print(f"✓ Found member: {romano.get('display_name')}")
        
        # Verify member_id
        assert romano.get("member_id") == "Mem-06275", f"Expected member_id Mem-06275, got {romano.get('member_id')}"
        print(f"✓ Member ID verified: {romano.get('member_id')}")
    
    def test_06_filter_active_members(self):
        """Test GET /api/members?status=Active returns 258 members (all active)"""
        response = self.session.get(f"{BASE_URL}/api/members", params={"status": "Active"})
        assert response.status_code == 200, f"Filter failed: {response.text}"
        
        members = response.json()
        active_count = len(members)
        print(f"✓ Active members count: {active_count}")
        
        # All 258 should be active
        assert active_count == 258, f"Expected 258 active members, got {active_count}"
        
        # Verify all returned members have Active status
        for m in members:
            assert m.get("status") == "Active", f"Member {m.get('member_id')} has status {m.get('status')}"
        
        print(f"✓ All 258 members are Active")
    
    def test_07_dashboard_stats(self):
        """Test dashboard stats show correct member count"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200, f"Dashboard stats failed: {response.text}"
        
        stats = response.json()
        active_members = stats.get("active_members", 0)
        print(f"✓ Dashboard active_members: {active_members}")
        
        assert active_members == 258, f"Expected 258 active members in stats, got {active_members}"
        print(f"✓ Dashboard stats verified: 258 active members")
    
    def test_08_get_specific_member_by_id(self):
        """Test GET /api/members/Mem-05152 returns Reese Hoban"""
        response = self.session.get(f"{BASE_URL}/api/members/Mem-05152")
        assert response.status_code == 200, f"Get member failed: {response.text}"
        
        member = response.json()
        print(f"✓ Got member: {member.get('display_name')}")
        
        assert member.get("member_id") == "Mem-05152"
        assert member.get("current_balance") == 45
        print(f"✓ Member Mem-05152 verified with balance 45")
    
    def test_09_leaderboard_shows_reese_first(self):
        """Test leaderboard shows Reese Hoban at top (highest balance)"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/leaderboard", params={"limit": 10})
        assert response.status_code == 200, f"Leaderboard failed: {response.text}"
        
        leaders = response.json()
        print(f"✓ Leaderboard returned {len(leaders)} entries")
        
        if len(leaders) > 0:
            top_member = leaders[0]
            print(f"✓ Top member: {top_member.get('display_name')} with balance {top_member.get('current_balance')}")
            
            # Reese should be at top with balance 45 (only one with non-zero balance)
            assert top_member.get("member_id") == "Mem-05152", f"Expected Mem-05152 at top, got {top_member.get('member_id')}"
            assert top_member.get("current_balance") == 45
            print(f"✓ Reese Hoban (Mem-05152) is at top of leaderboard with 45 bucks")


class TestAuthFlow:
    """Test authentication flow"""
    
    def test_login_success(self):
        """Test successful login"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@clubbucks.com", "password": "ClubBucks2024!"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["email"] == "admin@clubbucks.com"
        assert data["role"] == "admin"
        print(f"✓ Auth login test passed")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@clubbucks.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print(f"✓ Invalid credentials correctly rejected")
    
    def test_auth_me_endpoint(self):
        """Test /api/auth/me returns current user"""
        session = requests.Session()
        # Login first
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@clubbucks.com", "password": "ClubBucks2024!"}
        )
        assert login_resp.status_code == 200
        
        # Get current user
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200
        data = me_resp.json()
        assert data["email"] == "admin@clubbucks.com"
        print(f"✓ Auth /me endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
