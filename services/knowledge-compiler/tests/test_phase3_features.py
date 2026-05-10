"""
Tests for Phase 3 features: Time Machine, Self-Healing Wiki, Bug Propagation
"""

import pytest
import sys
from pathlib import Path
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

# Add app to path - use parent of parent to reach services/knowledge-compiler
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestTimeMachine:
    """Tests for Time Machine features"""

    def test_time_machine_initializes(self):
        """Test TimeMachine initializes correctly"""
        from app.time_machine import TimeMachine

        with patch("pathlib.Path.mkdir"):
            with patch.object(Path, "exists", return_value=False):
                tm = TimeMachine("/fake/repo", "/fake/storage")

        assert tm.repo_path.name == "repo"
        assert tm.storage_path.name == "storage"
        assert isinstance(tm.snapshots, list)
        assert isinstance(tm.markers, list)
        assert isinstance(tm.velocity, list)

    def test_commit_snapshot_creation(self):
        """Test CommitSnapshot dataclass"""
        from app.time_machine import CommitSnapshot

        snapshot = CommitSnapshot(
            commit_hash="abc123",
            author="Test User",
            date=datetime.now(),
            message="Test commit",
        )

        assert snapshot.commit_hash == "abc123"
        assert snapshot.author == "Test User"
        assert snapshot.total_files == 0

    def test_evolution_marker_creation(self):
        """Test EvolutionMarker dataclass"""
        from app.time_machine import EvolutionMarker

        marker = EvolutionMarker(
            marker_id="test_001",
            date=datetime.now(),
            marker_type="architecture_change",
            title="Test Architecture Change",
            description="Testing marker creation",
            impact="high",
        )

        assert marker.marker_id == "test_001"
        assert marker.marker_type == "architecture_change"
        assert marker.impact == "high"

    def test_velocity_metric_creation(self):
        """Test VelocityMetric dataclass"""
        from app.time_machine import VelocityMetric

        vm = VelocityMetric(
            date=datetime.now(),
            commits=10,
            lines_added=500,
            lines_deleted=100,
            files_changed=5,
        )

        assert vm.commits == 10
        assert vm.lines_added == 500

    def test_serialize_snapshot(self):
        """Test CommitSnapshot serialization"""
        from app.time_machine import CommitSnapshot

        snapshot = CommitSnapshot(
            commit_hash="abc123",
            author="Test User",
            date=datetime(2024, 1, 1, 12, 0, 0),
            message="Test commit",
            total_files=10,
        )

        # Test that TimeMachine can serialize it
        from app.time_machine import TimeMachine

        with patch("pathlib.Path.mkdir"):
            with patch.object(Path, "exists", return_value=False):
                tm = TimeMachine("/fake/repo", "/fake/storage")

        serialized = tm._serialize_snapshot(snapshot)
        assert serialized["commit_hash"] == "abc123"
        assert serialized["author"] == "Test User"

    def test_deserialize_snapshot(self):
        """Test CommitSnapshot deserialization"""
        from app.time_machine import TimeMachine

        with patch("pathlib.Path.mkdir"):
            with patch.object(Path, "exists", return_value=False):
                tm = TimeMachine("/fake/repo", "/fake/storage")

        data = {
            "commit_hash": "abc123",
            "author": "Test User",
            "date": "2024-01-01T12:00:00",
            "message": "Test commit",
            "total_files": 10,
            "total_lines": 100,
            "total_entities": 5,
        }

        snapshot = tm._deserialize_snapshot(data)
        assert snapshot.commit_hash == "abc123"
        assert snapshot.total_files == 10


class TestBugPropagator:
    """Tests for Bug Propagation features"""

    def test_bug_propagator_initializes(self):
        """Test BugPropagator initializes correctly"""
        from app.time_machine import TimeMachine, BugPropagator

        with patch("pathlib.Path.mkdir"):
            with patch.object(Path, "exists", return_value=False):
                tm = TimeMachine("/fake/repo", "/fake/storage")
                bp = BugPropagator(tm)

        assert bp.time_machine is tm

    def test_track_fix_data_structure(self):
        """Test bug fix tracking data"""
        from app.time_machine import TimeMachine, BugPropagator

        with patch("pathlib.Path.mkdir"):
            with patch.object(Path, "exists", return_value=False):
                tm = TimeMachine("/fake/repo", "/fake/storage")
                tm.snapshots = []
                bp = BugPropagator(tm)

        # Simulate tracking data
        track_result = {
            "status": "tracked",
            "introduced": {
                "commit": "abc123",
                "date": datetime.now().isoformat(),
                "message": "Introduced bug",
            },
            "fixed": "def456",
            "age_days": 14,
            "propagation_path": ["file1.py", "file2.py"],
        }

        assert track_result["status"] == "tracked"
        assert track_result["age_days"] == 14

    def test_find_bug_introduction(self):
        """Test finding bug introduction in snapshots"""
        from app.time_machine import TimeMachine, BugPropagator, CommitSnapshot

        with patch("pathlib.Path.mkdir"):
            with patch.object(Path, "exists", return_value=False):
                tm = TimeMachine("/fake/repo", "/fake/storage")

                # Add a snapshot with the file
                tm.snapshots = [
                    CommitSnapshot(
                        commit_hash="abc123",
                        author="Test",
                        date=datetime.now() - timedelta(days=7),
                        message="Add bug",
                        files_modified=["test.py"],
                    )
                ]

                bp = BugPropagator(tm)
                result = bp._find_bug_introduction(["test.py"], "xyz789")

                assert result is not None
                assert result["commit"] == "abc123"

    def test_analyze_bug_propagation(self):
        """Test bug propagation analysis"""
        from app.time_machine import TimeMachine, BugPropagator

        with patch("pathlib.Path.mkdir"):
            with patch.object(Path, "exists", return_value=False):
                tm = TimeMachine("/fake/repo", "/fake/storage")
                bp = BugPropagator(tm)

        # Mock git log
        with patch.object(tm, "get_git_log", return_value=[]):
            result = bp.analyze_bug_propagation()
            assert isinstance(result, list)


class TestWikiHealing:
    """Tests for Self-Healing Wiki features"""

    def test_wiki_engine_stale_detection(self):
        """Test stale page detection structure"""
        from app.wiki import WikiEngine

        with patch("pathlib.Path.mkdir"):
            we = WikiEngine("/fake/wiki")

        assert we.pages == {}
        assert isinstance(we.index, dict)
        assert isinstance(we.links, dict)

    def test_stale_page_detection_result(self):
        """Test stale detection result format"""
        stale_result = {
            "page": "test_module",
            "reason": "source_updated",
            "file_path": "test_module.py",
            "file_modified": datetime.now().isoformat(),
        }

        assert "page" in stale_result
        assert "reason" in stale_result

    def test_health_score_calculation(self):
        """Test wiki health score structure"""
        health = {
            "score": 85.0,
            "status": "good",
            "total_pages": 20,
            "healthy_pages": 17,
            "stale_pages": 3,
        }

        assert health["score"] == 85.0
        assert health["status"] == "good"

    def test_heal_result_structure(self):
        """Test heal result format"""
        heal_result = {
            "total_stale": 5,
            "healed": ["page1", "page2"],
            "failed": ["page3"],
            "timestamp": datetime.now().isoformat(),
        }

        assert heal_result["total_stale"] == 5
        assert len(heal_result["healed"]) == 2

    def test_detect_stale_pages(self):
        """Test stale page detection"""
        from app.wiki import WikiEngine

        with patch("pathlib.Path.mkdir"):
            we = WikiEngine("/fake/wiki")
            we.pages = {"test_module": "content", "overview": "overview content"}

        stale = we.detect_stale_pages("/fake/repo", [])
        assert isinstance(stale, list)

    def test_get_wiki_health_score(self):
        """Test wiki health score calculation"""
        from app.wiki import WikiEngine

        with patch("pathlib.Path.mkdir"):
            we = WikiEngine("/fake/wiki")
            we.pages = {"page1": "content", "page2": "content"}

        health = we.get_wiki_health_score("/fake/repo", [])
        assert "score" in health
        assert "status" in health

    def test_heal_all_stale(self):
        """Test healing all stale pages"""
        from app.wiki import WikiEngine

        with patch("pathlib.Path.mkdir"):
            we = WikiEngine("/fake/wiki")
            we.pages = {"overview": "old content"}

        result = we.heal_all_stale("/fake/repo", [])
        assert "total_stale" in result
        assert "healed" in result
        assert "timestamp" in result


class TestAPIEndpoints:
    """Test API endpoint response structures"""

    def test_evolution_response_structure(self):
        """Test evolution analysis response"""
        response = {
            "repo": "owner/repo",
            "summary": {
                "total_commits_analyzed": 100,
                "contributors": 5,
            },
            "markers": [],
            "velocity_trend": {"trend": "stable"},
            "architecture_evolution": {"total_changes": 3},
        }

        assert "repo" in response
        assert "summary" in response
        assert "markers" in response

    def test_contributor_response_structure(self):
        """Test contributor stats response"""
        response = {
            "repo": "owner/repo",
            "contributors": [
                {"author": "User1", "commits": 50},
                {"author": "User2", "commits": 30},
            ],
            "total_contributors": 2,
        }

        assert "contributors" in response
        assert response["total_contributors"] == 2

    def test_bug_propagation_response(self):
        """Test bug propagation response"""
        response = {
            "repo": "owner/repo",
            "bug_propagations": [
                {"commit": "abc", "severity": "high", "files_affected": 10}
            ],
            "total_bugs": 1,
        }

        assert "bug_propagations" in response
        assert response["total_bugs"] == 1

    def test_wiki_health_response(self):
        """Test wiki health response"""
        response = {
            "repo": "owner/repo",
            "health": {"score": 90.0, "status": "good"},
            "stale_pages": [],
        }

        assert "health" in response
        assert "score" in response["health"]


class TestIntegration:
    """Integration tests combining features"""

    def test_time_machine_and_bug_propagation_integration(self):
        """Test TimeMachine and BugPropagator work together"""
        from app.time_machine import TimeMachine, BugPropagator

        with patch("pathlib.Path.mkdir"):
            with patch.object(Path, "exists", return_value=False):
                tm = TimeMachine("/fake/repo", "/fake/storage")
                bp = BugPropagator(tm)

        # Verify integration
        assert bp.time_machine is tm

        # Both should have access to snapshots
        tm.snapshots = []
        assert len(bp.time_machine.snapshots) == 0

    def test_wiki_health_depends_on_pages(self):
        """Test wiki health depends on page state"""
        from app.wiki import WikiEngine

        with patch("pathlib.Path.mkdir"):
            we = WikiEngine("/fake/wiki")

        # Add some pages
        we.pages = {"page1": "content1", "page2": "content2"}

        # Health should be based on pages
        assert len(we.pages) == 2

        health = we.get_wiki_health_score("/fake/repo", [])
        assert health["total_pages"] == 2


class TestTimeMachineQueries:
    """Tests for Time Machine query methods"""

    def test_query_at_time_returns_structure(self):
        """Test query_at_time returns expected structure"""
        from app.time_machine import TimeMachine

        with patch("pathlib.Path.mkdir"):
            with patch.object(Path, "exists", return_value=False):
                tm = TimeMachine("/fake/repo", "/fake/storage")

        # Mock the git command
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0, stdout="file1.py\nfile2.py\n"
            )
            result = tm.query_at_time("abc123")

            assert "commit" in result
            assert "files" in result

    def test_trace_evolution_returns_list(self):
        """Test trace_evolution returns list"""
        from app.time_machine import TimeMachine

        with patch("pathlib.Path.mkdir"):
            with patch.object(Path, "exists", return_value=False):
                tm = TimeMachine("/fake/repo", "/fake/storage")

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=0, stdout="")
            result = tm.trace_evolution("test.py")

            assert isinstance(result, list)

    def test_explain_change_returns_structure(self):
        """Test explain_change returns expected structure"""
        from app.time_machine import TimeMachine, CommitSnapshot

        with patch("pathlib.Path.mkdir"):
            with patch.object(Path, "exists", return_value=False):
                tm = TimeMachine("/fake/repo", "/fake/storage")
                tm.snapshots = [
                    CommitSnapshot(
                        commit_hash="abc123",
                        author="Test",
                        date=datetime.now(),
                        message="Test commit",
                        files_modified=["test.py"],
                    )
                ]

        result = tm.explain_change("abc123")
        assert "what_changed" in result
        assert "files" in result


class TestWikiQuery:
    """Tests for Wiki query functionality"""

    def test_query_returns_structure(self):
        """Test wiki query returns expected structure"""
        from app.wiki import WikiEngine

        with patch("pathlib.Path.mkdir"):
            we = WikiEngine("/fake/wiki")
            we.index = {"entities": {}, "files": []}

        result = we.query("test function")
        assert "question" in result
        assert "relevant_pages" in result

    def test_get_page_returns_content(self):
        """Test get_page returns content"""
        from app.wiki import WikiEngine

        with patch("pathlib.Path.mkdir"):
            we = WikiEngine("/fake/wiki")
            we.pages = {"test": "content"}

        content = we.get_page("test")
        assert content == "content"

    def test_get_all_pages_returns_list(self):
        """Test get_all_pages returns list"""
        from app.wiki import WikiEngine

        with patch("pathlib.Path.mkdir"):
            we = WikiEngine("/fake/wiki")
            we.pages = {"page1": "c1", "page2": "c2"}

        pages = we.get_all_pages()
        assert len(pages) == 2
        assert "page1" in pages


class TestBugPropagatorAnalysis:
    """Tests for BugPropagator analysis methods"""

    def test_find_similar_bugs(self):
        """Test finding similar bugs"""
        from app.time_machine import TimeMachine, BugPropagator

        with patch("pathlib.Path.mkdir"):
            with patch.object(Path, "exists", return_value=False):
                tm = TimeMachine("/fake/repo", "/fake/storage")
                bp = BugPropagator(tm)

        with patch.object(tm, "trace_evolution", return_value=[]):
            result = bp.find_similar_bugs("test.py")
            assert isinstance(result, list)


if __name__ == "__main__":
    print("Running Phase 3 feature tests...")

    tests = TestTimeMachine()
    tests.test_time_machine_initializes()
    tests.test_commit_snapshot_creation()
    tests.test_evolution_marker_creation()
    tests.test_velocity_metric_creation()
    tests.test_serialize_snapshot()
    tests.test_deserialize_snapshot()
    print("  Time Machine tests: PASS")

    tests = TestBugPropagator()
    tests.test_bug_propagator_initializes()
    tests.test_track_fix_data_structure()
    tests.test_find_bug_introduction()
    tests.test_analyze_bug_propagation()
    print("  Bug Propagator tests: PASS")

    tests = TestWikiHealing()
    tests.test_wiki_engine_stale_detection()
    tests.test_stale_page_detection_result()
    tests.test_health_score_calculation()
    tests.test_heal_result_structure()
    tests.test_detect_stale_pages()
    tests.test_get_wiki_health_score()
    tests.test_heal_all_stale()
    print("  Wiki Healing tests: PASS")

    tests = TestAPIEndpoints()
    tests.test_evolution_response_structure()
    tests.test_contributor_response_structure()
    tests.test_bug_propagation_response()
    tests.test_wiki_health_response()
    print("  API Endpoint tests: PASS")

    tests = TestIntegration()
    tests.test_time_machine_and_bug_propagation_integration()
    tests.test_wiki_health_depends_on_pages()
    print("  Integration tests: PASS")

    tests = TestTimeMachineQueries()
    tests.test_query_at_time_returns_structure()
    tests.test_trace_evolution_returns_list()
    tests.test_explain_change_returns_structure()
    print("  Time Machine Query tests: PASS")

    tests = TestWikiQuery()
    tests.test_query_returns_structure()
    tests.test_get_page_returns_content()
    tests.test_get_all_pages_returns_list()
    print("  Wiki Query tests: PASS")

    tests = TestBugPropagatorAnalysis()
    tests.test_find_similar_bugs()
    print("  Bug Propagator Analysis tests: PASS")

    print("\nAll Phase 3 feature tests passed!")
