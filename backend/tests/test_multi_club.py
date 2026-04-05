"""
Multi-Club Feature Tests
Tests for the new multi-club support feature including:
- Club CRUD operations
- Member filtering by club
- Dashboard stats by club
- Leaderboard by club
- Transaction with club_id
- Auth /me endpoint with clubs array
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@clubbucks.com"
ADMIN_PASSWORD = "ClubBucks2024!"
DEFAULT_CLUB_ID = "jams-club"


class TestAuthWithClubs:
    """Test auth endpoints return club information"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
    
    def test_auth_me_returns_is_super_admin(self):
        """GET /api/auth/me returns is_super_admin=true for admin"""
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "is_super_admin" in data, "is_super_admin field missing"
        assert data["is_super_admin"] == True, f"Expected is_super_admin=True, got {data['is_super_admin']}"
        print(f"✓ Admin has is_super_admin=True")
    
    def test_auth_me_returns_clubs_array(self):
        """GET /api/auth/me returns clubs array for admin"""
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "clubs" in data, "clubs field missing"
        assert isinstance(data["clubs"], list), f"clubs should be a list, got {type(data['clubs'])}"
        print(f"✓ Admin has clubs array with {len(data['clubs'])} clubs")


class TestClubsCRUD:
    """Test Club CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.created_club_id = None
    
    def test_get_clubs_returns_jams_club(self):
        """GET /api/clubs returns at least one club (JAMS Club)"""
        response = self.session.get(f"{BASE_URL}/api/clubs")
        assert response.status_code == 200
        clubs = response.json()
        assert isinstance(clubs, list), "Response should be a list"
        assert len(clubs) >= 1, "Should have at least one club"
        
        # Find JAMS Club
        jams_club = next((c for c in clubs if c.get("id") == DEFAULT_CLUB_ID), None)
        assert jams_club is not None, f"JAMS Club (id={DEFAULT_CLUB_ID}) not found"
        assert jams_club["name"] == "JAMS Club", f"Expected name 'JAMS Club', got {jams_club['name']}"
        assert "member_count" in jams_club, "member_count field missing"
        print(f"✓ JAMS Club found with {jams_club['member_count']} members")
    
    def test_create_club_admin_only(self):
        """POST /api/clubs creates a new club (admin only)"""
        test_club_name = "TEST_STEM_Club"
        response = self.session.post(f"{BASE_URL}/api/clubs", json={
            "name": test_club_name,
            "description": "Test STEM club for testing"
        })
        assert response.status_code == 200, f"Create club failed: {response.text}"
        data = response.json()
        assert data["name"] == test_club_name
        assert "id" in data
        assert data["member_count"] == 0
        self.created_club_id = data["id"]
        print(f"✓ Created club: {test_club_name} with id {self.created_club_id}")
        
        # Cleanup - delete the test club
        delete_response = self.session.delete(f"{BASE_URL}/api/clubs/{self.created_club_id}")
        assert delete_response.status_code == 200, f"Cleanup failed: {delete_response.text}"
    
    def test_update_club(self):
        """PUT /api/clubs/{club_id} updates a club"""
        # First create a test club
        create_response = self.session.post(f"{BASE_URL}/api/clubs", json={
            "name": "TEST_Update_Club",
            "description": "Original description"
        })
        assert create_response.status_code == 200
        club_id = create_response.json()["id"]
        
        # Update the club
        update_response = self.session.put(f"{BASE_URL}/api/clubs/{club_id}", json={
            "name": "TEST_Updated_Club",
            "description": "Updated description"
        })
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"] == "TEST_Updated_Club"
        assert updated["description"] == "Updated description"
        print(f"✓ Updated club name and description")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/clubs/{club_id}")
    
    def test_delete_club_fails_with_members(self):
        """DELETE /api/clubs/{club_id} fails when club has members"""
        # Try to delete JAMS Club which has 258 members
        response = self.session.delete(f"{BASE_URL}/api/clubs/{DEFAULT_CLUB_ID}")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "members" in data.get("detail", "").lower(), f"Expected error about members, got: {data}"
        print(f"✓ Delete JAMS Club correctly rejected: {data['detail']}")


class TestMembersWithClub:
    """Test member endpoints with club filtering"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
    
    def test_get_members_with_club_filter(self):
        """GET /api/members?club_id=jams-club returns 258 members"""
        response = self.session.get(f"{BASE_URL}/api/members", params={"club_id": DEFAULT_CLUB_ID})
        assert response.status_code == 200
        members = response.json()
        assert isinstance(members, list)
        # Should have 258 members in JAMS Club
        assert len(members) >= 250, f"Expected ~258 members, got {len(members)}"
        print(f"✓ GET /api/members?club_id={DEFAULT_CLUB_ID} returned {len(members)} members")
        
        # Verify members have club_id
        for member in members[:5]:  # Check first 5
            assert member.get("club_id") == DEFAULT_CLUB_ID, f"Member {member['member_id']} has wrong club_id"
    
    def test_members_have_club_fields(self):
        """Members have club_id and club_name fields"""
        response = self.session.get(f"{BASE_URL}/api/members", params={"club_id": DEFAULT_CLUB_ID})
        assert response.status_code == 200
        members = response.json()
        assert len(members) > 0
        
        member = members[0]
        assert "club_id" in member, "club_id field missing"
        assert "club_name" in member, "club_name field missing"
        assert member["club_id"] == DEFAULT_CLUB_ID
        assert member["club_name"] == "JAMS Club"
        print(f"✓ Members have club_id and club_name fields")


class TestDashboardWithClub:
    """Test dashboard endpoints with club filtering"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
    
    def test_dashboard_stats_with_club_filter(self):
        """GET /api/dashboard/stats?club_id=jams-club returns correct stats"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/stats", params={"club_id": DEFAULT_CLUB_ID})
        assert response.status_code == 200
        stats = response.json()
        
        assert "active_members" in stats
        assert "current_bucks" in stats
        assert "total_earned" in stats
        assert "total_spent" in stats
        
        # Should have ~258 active members
        assert stats["active_members"] >= 250, f"Expected ~258 active members, got {stats['active_members']}"
        print(f"✓ Dashboard stats: {stats['active_members']} active members, {stats['current_bucks']} total bucks")
    
    def test_leaderboard_with_club_filter(self):
        """GET /api/dashboard/leaderboard?club_id=jams-club returns leaderboard"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/leaderboard", params={
            "club_id": DEFAULT_CLUB_ID,
            "limit": 10
        })
        assert response.status_code == 200
        leaders = response.json()
        
        assert isinstance(leaders, list)
        print(f"✓ Leaderboard returned {len(leaders)} entries")
        
        if len(leaders) > 0:
            leader = leaders[0]
            assert "member_id" in leader
            assert "display_name" in leader
            assert "current_balance" in leader
            print(f"  Top leader: {leader['display_name']} with {leader['current_balance']} bucks")


class TestTransactionsWithClub:
    """Test transaction endpoints with club_id"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
    
    def test_create_transaction_with_club_id(self):
        """POST /api/transactions with club_id creates transaction with club_id"""
        # Get a member from JAMS Club
        members_response = self.session.get(f"{BASE_URL}/api/members", params={"club_id": DEFAULT_CLUB_ID})
        members = members_response.json()
        assert len(members) > 0
        test_member = members[0]
        
        # Create transaction with club_id
        txn_response = self.session.post(f"{BASE_URL}/api/transactions", json={
            "member_id": test_member["member_id"],
            "type": "earn",
            "category": "Test Category",
            "amount": 5,
            "club_id": DEFAULT_CLUB_ID,
            "notes": "TEST_transaction for multi-club testing"
        })
        assert txn_response.status_code == 200, f"Create transaction failed: {txn_response.text}"
        txn = txn_response.json()
        
        assert txn["club_id"] == DEFAULT_CLUB_ID, f"Transaction club_id mismatch: {txn['club_id']}"
        assert txn["member_id"] == test_member["member_id"]
        assert txn["amount"] == 5
        print(f"✓ Created transaction with club_id={DEFAULT_CLUB_ID} for member {test_member['member_id']}")
    
    def test_get_transactions_with_club_filter(self):
        """GET /api/transactions?club_id=jams-club returns filtered transactions"""
        response = self.session.get(f"{BASE_URL}/api/transactions", params={"club_id": DEFAULT_CLUB_ID})
        assert response.status_code == 200
        transactions = response.json()
        
        assert isinstance(transactions, list)
        print(f"✓ GET /api/transactions?club_id={DEFAULT_CLUB_ID} returned {len(transactions)} transactions")
        
        # Verify transactions have club_id
        for txn in transactions[:5]:  # Check first 5
            if txn.get("club_id"):  # Some old transactions might not have club_id
                assert txn["club_id"] == DEFAULT_CLUB_ID


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
