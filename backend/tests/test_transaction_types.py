"""
Test Transaction Types, Categories, and Notes functionality
Tests the enhanced scan station with 4 transaction types:
- earn: adds to balance (categories: Job, Task, Attendance, Homework, Helping Out, Other)
- spend: deducts from balance (categories: Store Purchase, Event, Food, Activity, Other)
- bonus: adds to balance (categories: Award, Achievement, Staff Pick, Birthday, Contest, Other)
- adjustment: can be positive or negative (categories: Correction, Penalty, Transfer, Admin Fix, Other)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTransactionTypesAndCategories:
    """Test transaction types, categories, and notes functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookies"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@clubbucks.com", "password": "ClubBucks2024!"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        yield
    
    def test_quick_transaction_earn_with_category_and_notes(self):
        """Test POST /api/transactions/quick with type=earn, category=Job, notes"""
        # Get initial balance
        member_response = self.session.get(f"{BASE_URL}/api/members/Mem-05152")
        assert member_response.status_code == 200
        initial_balance = member_response.json()["current_balance"]
        
        # Create earn transaction with category and notes
        response = self.session.post(
            f"{BASE_URL}/api/transactions/quick",
            params={
                "member_id": "Mem-05152",
                "amount": 5,
                "type": "earn",
                "category": "Job",
                "notes": "Test earn transaction"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Transaction completed"
        assert data["new_balance"] == initial_balance + 5
        assert data["member_name"] == "Reese Hoban"
    
    def test_quick_transaction_spend_deducts_balance(self):
        """Test POST /api/transactions/quick with type=spend deducts from balance"""
        # Get initial balance
        member_response = self.session.get(f"{BASE_URL}/api/members/Mem-05152")
        assert member_response.status_code == 200
        initial_balance = member_response.json()["current_balance"]
        
        # Create spend transaction
        response = self.session.post(
            f"{BASE_URL}/api/transactions/quick",
            params={
                "member_id": "Mem-05152",
                "amount": 3,
                "type": "spend",
                "category": "Store Purchase",
                "notes": "Bought snacks"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["new_balance"] == initial_balance - 3, "Spend should deduct from balance"
    
    def test_quick_transaction_bonus_adds_balance(self):
        """Test POST /api/transactions/quick with type=bonus adds to balance"""
        # Get initial balance
        member_response = self.session.get(f"{BASE_URL}/api/members/Mem-05152")
        assert member_response.status_code == 200
        initial_balance = member_response.json()["current_balance"]
        
        # Create bonus transaction
        response = self.session.post(
            f"{BASE_URL}/api/transactions/quick",
            params={
                "member_id": "Mem-05152",
                "amount": 10,
                "type": "bonus",
                "category": "Award",
                "notes": "Great performance"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["new_balance"] == initial_balance + 10, "Bonus should add to balance"
    
    def test_quick_transaction_adjustment(self):
        """Test POST /api/transactions/quick with type=adjustment"""
        # Get initial balance
        member_response = self.session.get(f"{BASE_URL}/api/members/Mem-05152")
        assert member_response.status_code == 200
        initial_balance = member_response.json()["current_balance"]
        
        # Create negative adjustment
        response = self.session.post(
            f"{BASE_URL}/api/transactions/quick",
            params={
                "member_id": "Mem-05152",
                "amount": -2,
                "type": "adjustment",
                "category": "Correction",
                "notes": "Balance correction"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["new_balance"] == initial_balance - 2, "Negative adjustment should reduce balance"
    
    def test_get_transactions_returns_category_and_notes(self):
        """Test GET /api/transactions shows category and notes in results"""
        response = self.session.get(
            f"{BASE_URL}/api/transactions",
            params={"member_id": "Mem-05152", "limit": 10}
        )
        assert response.status_code == 200
        transactions = response.json()
        assert len(transactions) > 0, "Should have transactions"
        
        # Check that transactions have category and notes fields
        for txn in transactions:
            assert "category" in txn, "Transaction should have category field"
            assert "notes" in txn, "Transaction should have notes field"
            assert "type" in txn, "Transaction should have type field"
            assert txn["type"] in ["earn", "spend", "bonus", "adjustment"], f"Invalid type: {txn['type']}"
    
    def test_earn_categories(self):
        """Test earn transaction with various categories"""
        categories = ["Job", "Task", "Attendance", "Homework", "Helping Out", "Other"]
        
        for cat in categories:
            response = self.session.post(
                f"{BASE_URL}/api/transactions/quick",
                params={
                    "member_id": "Mem-05152",
                    "amount": 1,
                    "type": "earn",
                    "category": cat,
                    "notes": f"Testing {cat} category"
                }
            )
            assert response.status_code == 200, f"Failed for category: {cat}"
    
    def test_spend_categories(self):
        """Test spend transaction with various categories"""
        categories = ["Store Purchase", "Event", "Food", "Activity", "Other"]
        
        for cat in categories:
            response = self.session.post(
                f"{BASE_URL}/api/transactions/quick",
                params={
                    "member_id": "Mem-05152",
                    "amount": 1,
                    "type": "spend",
                    "category": cat,
                    "notes": f"Testing {cat} category"
                }
            )
            assert response.status_code == 200, f"Failed for category: {cat}"
    
    def test_bonus_categories(self):
        """Test bonus transaction with various categories"""
        categories = ["Award", "Achievement", "Staff Pick", "Birthday", "Contest", "Other"]
        
        for cat in categories:
            response = self.session.post(
                f"{BASE_URL}/api/transactions/quick",
                params={
                    "member_id": "Mem-05152",
                    "amount": 1,
                    "type": "bonus",
                    "category": cat,
                    "notes": f"Testing {cat} category"
                }
            )
            assert response.status_code == 200, f"Failed for category: {cat}"
    
    def test_adjustment_categories(self):
        """Test adjustment transaction with various categories"""
        categories = ["Correction", "Penalty", "Transfer", "Admin Fix", "Other"]
        
        for cat in categories:
            response = self.session.post(
                f"{BASE_URL}/api/transactions/quick",
                params={
                    "member_id": "Mem-05152",
                    "amount": 1,
                    "type": "adjustment",
                    "category": cat,
                    "notes": f"Testing {cat} category"
                }
            )
            assert response.status_code == 200, f"Failed for category: {cat}"
    
    def test_transaction_without_category_uses_default(self):
        """Test transaction without category uses 'Quick Transaction' as default"""
        response = self.session.post(
            f"{BASE_URL}/api/transactions/quick",
            params={
                "member_id": "Mem-05152",
                "amount": 1,
                "type": "earn"
            }
        )
        assert response.status_code == 200
        
        # Verify the transaction was created with default category
        txn_response = self.session.get(
            f"{BASE_URL}/api/transactions",
            params={"member_id": "Mem-05152", "limit": 1}
        )
        assert txn_response.status_code == 200
        transactions = txn_response.json()
        assert len(transactions) > 0
        # The most recent transaction should have default category
        assert transactions[0]["category"] == "Quick Transaction"
    
    def test_transaction_with_empty_notes(self):
        """Test transaction with empty notes"""
        response = self.session.post(
            f"{BASE_URL}/api/transactions/quick",
            params={
                "member_id": "Mem-05152",
                "amount": 1,
                "type": "earn",
                "category": "Task",
                "notes": ""
            }
        )
        assert response.status_code == 200
        
        # Verify the transaction was created
        txn_response = self.session.get(
            f"{BASE_URL}/api/transactions",
            params={"member_id": "Mem-05152", "limit": 1}
        )
        assert txn_response.status_code == 200
        transactions = txn_response.json()
        assert len(transactions) > 0
        assert transactions[0]["notes"] == ""


class TestMemberBalanceUpdates:
    """Test that member balance fields are updated correctly"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookies"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@clubbucks.com", "password": "ClubBucks2024!"}
        )
        assert login_response.status_code == 200
        yield
    
    def test_earn_updates_earned_field(self):
        """Test that earn transaction updates the 'earned' field"""
        # Get initial member data
        member_response = self.session.get(f"{BASE_URL}/api/members/Mem-05152")
        assert member_response.status_code == 200
        initial_earned = member_response.json()["earned"]
        
        # Create earn transaction
        self.session.post(
            f"{BASE_URL}/api/transactions/quick",
            params={"member_id": "Mem-05152", "amount": 5, "type": "earn", "category": "Job"}
        )
        
        # Verify earned field increased
        member_response = self.session.get(f"{BASE_URL}/api/members/Mem-05152")
        assert member_response.json()["earned"] == initial_earned + 5
    
    def test_spend_updates_spent_field(self):
        """Test that spend transaction updates the 'spent' field"""
        # Get initial member data
        member_response = self.session.get(f"{BASE_URL}/api/members/Mem-05152")
        assert member_response.status_code == 200
        initial_spent = member_response.json()["spent"]
        
        # Create spend transaction
        self.session.post(
            f"{BASE_URL}/api/transactions/quick",
            params={"member_id": "Mem-05152", "amount": 3, "type": "spend", "category": "Store Purchase"}
        )
        
        # Verify spent field increased
        member_response = self.session.get(f"{BASE_URL}/api/members/Mem-05152")
        assert member_response.json()["spent"] == initial_spent + 3
    
    def test_bonus_updates_bonus_field(self):
        """Test that bonus transaction updates the 'bonus' field"""
        # Get initial member data
        member_response = self.session.get(f"{BASE_URL}/api/members/Mem-05152")
        assert member_response.status_code == 200
        initial_bonus = member_response.json()["bonus"]
        
        # Create bonus transaction
        self.session.post(
            f"{BASE_URL}/api/transactions/quick",
            params={"member_id": "Mem-05152", "amount": 10, "type": "bonus", "category": "Award"}
        )
        
        # Verify bonus field increased
        member_response = self.session.get(f"{BASE_URL}/api/members/Mem-05152")
        assert member_response.json()["bonus"] == initial_bonus + 10
    
    def test_adjustment_updates_adjustments_field(self):
        """Test that adjustment transaction updates the 'adjustments' field"""
        # Get initial member data
        member_response = self.session.get(f"{BASE_URL}/api/members/Mem-05152")
        assert member_response.status_code == 200
        initial_adjustments = member_response.json()["adjustments"]
        
        # Create adjustment transaction
        self.session.post(
            f"{BASE_URL}/api/transactions/quick",
            params={"member_id": "Mem-05152", "amount": 5, "type": "adjustment", "category": "Correction"}
        )
        
        # Verify adjustments field increased
        member_response = self.session.get(f"{BASE_URL}/api/members/Mem-05152")
        assert member_response.json()["adjustments"] == initial_adjustments + 5
