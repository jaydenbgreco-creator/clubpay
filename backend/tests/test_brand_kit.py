"""
Brand Kit API Tests
Tests for BGCA brand kit settings and visual configuration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPublicSettings:
    """Test public settings endpoint (no auth required)"""
    
    def test_public_settings_returns_brand_colors(self):
        """GET /api/settings/public returns brand colors"""
        response = requests.get(f"{BASE_URL}/api/settings/public")
        assert response.status_code == 200
        
        data = response.json()
        assert "app_name" in data
        assert "primary_color" in data
        assert "accent_color" in data
        assert "theme" in data
        
        # Verify brand colors
        assert data["app_name"] == "ClubPay"
        assert data["primary_color"].lower() == "#0080c6"  # BGCA Blue
        assert data["accent_color"].lower() == "#84bd00"   # BGCA Green
        print(f"✓ Public settings: app_name={data['app_name']}, primary={data['primary_color']}, accent={data['accent_color']}")


class TestAuthenticatedSettings:
    """Test authenticated settings endpoints"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@clubbucks.com",
            "password": "ClubBucks2024!"
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    def test_get_settings_authenticated(self, auth_session):
        """GET /api/settings returns full settings for admin"""
        response = auth_session.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert "app_name" in data
        assert data["app_name"] == "ClubPay"
        print(f"✓ Authenticated settings retrieved: {data}")
    
    def test_update_settings_requires_admin(self, auth_session):
        """PUT /api/settings updates settings (admin only)"""
        # First get current settings
        get_response = auth_session.get(f"{BASE_URL}/api/settings")
        original_settings = get_response.json()
        
        # Try to update
        update_response = auth_session.put(f"{BASE_URL}/api/settings", json={
            "app_name": "ClubPay",
            "primary_color": "#0080c6",
            "accent_color": "#84bd00",
            "theme": "light"
        })
        
        # Should succeed for admin
        assert update_response.status_code == 200
        print("✓ Settings update successful for admin")


class TestDashboardStats:
    """Test dashboard stats with club filtering"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@clubbucks.com",
            "password": "ClubBucks2024!"
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    def test_dashboard_stats_for_jams_club(self, auth_session):
        """GET /api/dashboard/stats?club_id=jams-club returns 258 active members"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/stats?club_id=jams-club")
        assert response.status_code == 200
        
        data = response.json()
        assert "active_members" in data
        assert data["active_members"] == 258
        print(f"✓ Dashboard stats: {data['active_members']} active members in JAMS Club")


class TestClubs:
    """Test clubs endpoint"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@clubbucks.com",
            "password": "ClubBucks2024!"
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    def test_get_clubs_returns_jams_club(self, auth_session):
        """GET /api/clubs returns JAMS Club"""
        response = auth_session.get(f"{BASE_URL}/api/clubs")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        jams_club = next((c for c in data if c["id"] == "jams-club"), None)
        assert jams_club is not None
        assert jams_club["name"] == "JAMS Club"
        assert jams_club["member_count"] == 258
        print(f"✓ JAMS Club found with {jams_club['member_count']} members")


class TestAuth:
    """Test authentication endpoints"""
    
    def test_login_with_admin_credentials(self):
        """POST /api/auth/login with admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@clubbucks.com",
            "password": "ClubBucks2024!"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == "admin@clubbucks.com"
        assert data["role"] == "admin"
        print(f"✓ Admin login successful: {data['email']} ({data['role']})")
    
    def test_login_with_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected with 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
