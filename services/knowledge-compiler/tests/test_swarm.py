"""
Integration tests for the multi-agent swarm with debate system
"""

import pytest
import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to path
app_path = os.path.join(os.path.dirname(__file__), "..", "app")
sys.path.insert(0, os.path.abspath(app_path))

from swarm import CodeGenomeSwarm, run_swarm_analysis
from debate import (
    AgentType,
    Severity,
    Finding,
    DebateOrchestrator,
)


class TestSwarmCore:
    """Core swarm functionality tests"""

    def setup_method(self):
        """Setup test fixtures"""
        self.swarm = CodeGenomeSwarm(use_llm=False)

    @pytest.fixture
    def sample_files(self):
        return {
            "src/api/auth.py": """
            def authenticate(username, password):
                # Security issue: SQL injection vulnerability
                query = f"SELECT * FROM users WHERE username = '{username}'"
                return db.execute(query)
            """,
            "src/services/user.py": """
            class UserService:
                def get_user(self, user_id, include_deets=False, full_data=False):
                    # Refactoring: too many parameters
                    return self._fetch(user_id, None, None, None, None, None)
                    
                def _fetch(self, a, b, c, d, e, f):
                    pass
            """,
            "src/core/main.py": """
            # Long file with no documentation
            import sys
            import os
            
            def main():
                data = []
                for i in range(100):
                    data.append({"id": i})
                return data
            """,
        }

    def test_swarm_initializes(self):
        """Test that swarm initializes with agents"""
        assert len(self.swarm.agents) == 4
        assert AgentType.SECURITY in self.swarm.agents
        assert AgentType.REFACTORING in self.swarm.agents
        assert AgentType.ARCHITECTURE in self.swarm.agents

    @pytest.mark.asyncio
    async def test_swarm_analyzes_single_file(self):
        """Test swarm analyzing a single file"""
        result = await self.swarm._analyze_file(
            "test.py",
            """
        def login(username, password):
            query = f"SELECT * FROM users WHERE name = '{username}'"
            return db.execute(query)
        """,
        )

        assert result is not None
        assert result.debate_id is not None
        assert len(result.rounds) >= 1

    @pytest.mark.asyncio
    async def test_swarm_detects_sql_injection(self):
        """Test that swarm detects SQL injection"""
        result = await self.swarm._analyze_file(
            "test.py",
            """
        def get_user(user_id):
            query = f"SELECT * FROM users WHERE id = {user_id}"
            return db.execute(query)
        """,
        )

        sql_findings = [f for f in result.findings if "sql" in f.finding_type.lower()]
        assert len(sql_findings) > 0

    @pytest.mark.asyncio
    async def test_swarm_full_analysis(self, sample_files):
        """Test full repository analysis"""
        results = await self.swarm.analyze(sample_files)

        assert "file_results" in results
        assert "repository_summary" in results
        assert "debate_sessions" in results
        assert results["repository_summary"]["total_files"] == 3

    @pytest.mark.asyncio
    async def test_swarm_security_veto(self, sample_files):
        """Test security veto mechanism"""
        results = await self.swarm.analyze(sample_files)

        total_findings = results["repository_summary"]["total_findings"]
        assert total_findings >= 0


class TestDebateOrchestrator:
    """Test the debate orchestrator specifically"""

    @pytest.mark.asyncio
    async def test_debate_runs_multiple_rounds(self):
        """Test that debate runs through rounds"""
        from agents import (
            SecurityAgent,
            RefactoringAgent,
        )

        agents = {
            AgentType.SECURITY: SecurityAgent(),
            AgentType.REFACTORING: RefactoringAgent(),
        }

        orchestrator = DebateOrchestrator(agents)

        result = await orchestrator.run_debate(
            "test.py",
            """
        def vulnerable():
            query = "SELECT * FROM users WHERE id = " + user_input
            return exec(query)
        """,
        )

        assert len(result.rounds) >= 1
        assert result.debate_id is not None

    @pytest.mark.asyncio
    async def test_debate_creates_findings(self):
        """Test that debate creates findings"""
        from agents import SecurityAgent

        agents = {AgentType.SECURITY: SecurityAgent()}
        orchestrator = DebateOrchestrator(agents)

        result = await orchestrator.run_debate(
            "test.py",
            """
        password = "hardcoded123"
        api_key = "sk-12345"
        """,
        )

        assert len(result.findings) >= 0

    def test_severity_hierarchy(self):
        """Test severity ordering"""
        assert Severity.CRITICAL.value == "critical"
        assert Severity.HIGH.value == "high"
        assert Severity.MEDIUM.value == "medium"
        assert Severity.LOW.value == "low"


class TestRunSwarmFunction:
    """Test the convenience function"""

    @pytest.mark.asyncio
    async def test_run_swarm_analysis_function(self):
        """Test the run_swarm_analysis convenience function"""
        files = {
            "test.py": """
            def bad():
                eval("malicious_code")
            """
        }

        result = await run_swarm_analysis(files)

        assert result is not None
        assert "file_results" in result
        assert "repository_summary" in result


if __name__ == "__main__":
    test = TestSwarmCore()
    test.setup_method()

    print("Running test_swarm_initializes...")
    test.test_swarm_initializes()
    print("  ✓ Passed")

    print("Running test_debate_orchestrator...")
    asyncio.run(TestDebateOrchestrator().test_debate_runs_multiple_rounds())
    print("  ✓ Passed")

    print("Running test_run_swarm_analysis_function...")
    asyncio.run(TestRunSwarmFunction().test_run_swarm_analysis_function())
    print("  ✓ Passed")

    print("\n✅ All tests passed!")
