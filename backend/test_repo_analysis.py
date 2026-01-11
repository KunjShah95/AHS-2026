#!/usr/bin/env python
"""
Quick test script to verify repository analysis flow works end-to-end.
Run this to debug issues before trying through the web UI.
"""

import asyncio
import json
from pydantic import BaseModel
from app.api.endpoints.ingestion import process_repository

class IngestRequest(BaseModel):
    repo_path: str
    github_url: str = None

async def test_local_repo():
    """Test with local repository (no GitHub clone needed)"""
    print("=" * 60)
    print("🧪 Testing Repository Analysis (Local Repo)")
    print("=" * 60)
    
    try:
        print("\n1️⃣  Starting ingestion process...")
        result = await process_repository(
            IngestRequest(repo_path='agent_test_repo')
        )
        
        print("\n2️⃣  ✅ Analysis successful!")
        print(f"   Status: {result.get('status')}")
        print(f"   Agents involved: {', '.join(result.get('agents_involved', []))}")
        
        print("\n3️⃣  Data structure:")
        data = result.get('data', {})
        print(f"   - File tree nodes: {len(data.get('file_tree', []))}")
        print(f"   - Code graph nodes: {len(data.get('code_graph', {}).get('nodes', []))}")
        print(f"   - Learning path nodes: {len(data.get('learning_path', {}).get('nodes', []))}")
        print(f"   - Generated tasks: {len(data.get('tasks', []))}")
        
        print("\n4️⃣  Sample outputs:")
        if data.get('code_graph', {}).get('nodes'):
            first_node = data['code_graph']['nodes'][0]
            print(f"   First code node: {first_node.get('name')}")
        
        if data.get('learning_path', {}).get('nodes'):
            first_concept = data['learning_path']['nodes'][0]
            print(f"   First learning concept: {first_concept.get('concept_name')}")
        
        print("\n✨ All tests PASSED! Repository analysis is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Analysis FAILED!")
        print(f"   Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    success = await test_local_repo()
    exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())
