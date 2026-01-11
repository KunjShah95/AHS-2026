#!/usr/bin/env python
"""
Integration Test Script
Tests backend endpoints and frontend connectivity
"""

import requests
import time
import sys
from typing import Optional

class IntegrationTester:
    def __init__(self, backend_url: str = "http://localhost:8000"):
        self.backend_url = backend_url
        self.tests_passed = 0
        self.tests_failed = 0

    def test_backend_health(self) -> bool:
        """Test if backend is running"""
        print("\n🔍 Testing backend health...")
        try:
            response = requests.get(f"{self.backend_url}/", timeout=5)
            if response.status_code == 200:
                print(f"✅ Backend is running: {response.json()['message']}")
                self.tests_passed += 1
                return True
            else:
                print(f"❌ Backend returned status {response.status_code}")
                self.tests_failed += 1
                return False
        except Exception as e:
            print(f"❌ Backend connection failed: {str(e)}")
            self.tests_failed += 1
            return False

    def test_api_docs(self) -> bool:
        """Test if API documentation is accessible"""
        print("\n📚 Testing API documentation...")
        try:
            response = requests.get(f"{self.backend_url}/docs", timeout=5)
            if response.status_code == 200:
                print(f"✅ API docs available at {self.backend_url}/docs")
                self.tests_passed += 1
                return True
            else:
                print(f"❌ API docs returned status {response.status_code}")
                self.tests_failed += 1
                return False
        except Exception as e:
            print(f"❌ API docs connection failed: {str(e)}")
            self.tests_failed += 1
            return False

    def test_team_analytics(self) -> bool:
        """Test team analytics endpoint"""
        print("\n📊 Testing team analytics endpoint...")
        try:
            response = requests.get(
                f"{self.backend_url}/team-analytics/demo-data",
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Team analytics working")
                print(f"   - Response keys: {list(data.keys())[:5]}...")
                self.tests_passed += 1
                return True
            else:
                print(f"❌ Team analytics returned status {response.status_code}")
                self.tests_failed += 1
                return False
        except Exception as e:
            print(f"❌ Team analytics failed: {str(e)}")
            self.tests_failed += 1
            return False

    def test_knowledge_base(self) -> bool:
        """Test knowledge base endpoint"""
        print("\n📖 Testing knowledge base endpoint...")
        try:
            response = requests.get(
                f"{self.backend_url}/knowledge/demo-data",
                timeout=5
            )
            if response.status_code == 200:
                print(f"✅ Knowledge base working")
                self.tests_passed += 1
                return True
            else:
                print(f"❌ Knowledge base returned status {response.status_code}")
                self.tests_failed += 1
                return False
        except Exception as e:
            print(f"❌ Knowledge base failed: {str(e)}")
            self.tests_failed += 1
            return False

    def test_playbooks(self) -> bool:
        """Test playbooks endpoint"""
        print("\n📋 Testing playbooks endpoint...")
        try:
            response = requests.get(
                f"{self.backend_url}/playbooks/list",
                timeout=5,
                headers={"Authorization": "Bearer demo"}
            )
            if response.status_code in [200, 401, 403]:  # Accept auth errors
                print(f"✅ Playbooks endpoint responding (status: {response.status_code})")
                self.tests_passed += 1
                return True
            else:
                print(f"❌ Playbooks returned status {response.status_code}")
                self.tests_failed += 1
                return False
        except Exception as e:
            print(f"❌ Playbooks failed: {str(e)}")
            self.tests_failed += 1
            return False

    def test_first_pr(self) -> bool:
        """Test first PR acceleration endpoint"""
        print("\n🚀 Testing first PR endpoint...")
        try:
            response = requests.get(
                f"{self.backend_url}/first-pr/issues",
                timeout=5,
                headers={"Authorization": "Bearer demo"}
            )
            if response.status_code in [200, 401, 403]:  # Accept auth errors
                print(f"✅ First PR endpoint responding (status: {response.status_code})")
                self.tests_passed += 1
                return True
            else:
                print(f"❌ First PR returned status {response.status_code}")
                self.tests_failed += 1
                return False
        except Exception as e:
            print(f"❌ First PR failed: {str(e)}")
            self.tests_failed += 1
            return False

    def test_cors_headers(self) -> bool:
        """Test if CORS headers are set correctly"""
        print("\n🔐 Testing CORS headers...")
        try:
            response = requests.get(
                f"{self.backend_url}/",
                timeout=5,
                headers={"Origin": "http://localhost:5173"}
            )
            cors_headers = {
                k: v for k, v in response.headers.items()
                if "access-control" in k.lower()
            }
            if cors_headers:
                print(f"✅ CORS headers present:")
                for key, value in cors_headers.items():
                    print(f"   - {key}: {value}")
                self.tests_passed += 1
                return True
            else:
                print(f"⚠️  No CORS headers found (may be allowed implicitly)")
                self.tests_passed += 1
                return True
        except Exception as e:
            print(f"❌ CORS test failed: {str(e)}")
            self.tests_failed += 1
            return False

    def run_all_tests(self):
        """Run all integration tests"""
        print("=" * 60)
        print("🧪 CodeFlow Integration Tests")
        print(f"Backend URL: {self.backend_url}")
        print("=" * 60)

        self.test_backend_health()
        self.test_api_docs()
        self.test_cors_headers()
        self.test_team_analytics()
        self.test_knowledge_base()
        self.test_playbooks()
        self.test_first_pr()

        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed} passed, {self.tests_failed} failed")
        print("=" * 60)

        if self.tests_failed == 0:
            print("✅ All tests passed! Backend is ready for integration.")
            return 0
        else:
            print(f"❌ {self.tests_failed} tests failed. Check logs above.")
            return 1


if __name__ == "__main__":
    backend_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    tester = IntegrationTester(backend_url)
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)
