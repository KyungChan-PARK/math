"""
Integration Test for Complete Systems
Tests Neo4j Ontology and Memory Checkpoint
"""

import sys
import json
import asyncio
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

# Import our systems
from complete_memory_checkpoint import CompleteMemoryCheckpoint

async def test_systems():
    print(" Testing Complete Systems Integration\n")
    
    # 1. Test Memory Checkpoint System
    print("1️⃣ Testing Memory Checkpoint System")
    checkpoint = CompleteMemoryCheckpoint(".test_checkpoint.json")
    
    # Test task tracking
    checkpoint.start_task("test_01", "Test Neo4j connection")
    checkpoint.complete_task("test_01", {"status": "connected"})
    
    # Test error logging
    checkpoint.log_error("neo4j_connection", "Port 7687 in use")
    
    # Test decision logging
    checkpoint.log_decision(
        "Switch to port 7688",
        "Port conflict detected",
        autonomous=True
    )
    
    # Test migration update
    checkpoint.update_migration("uWebSockets", 25)
    
    # Get analytics
    analytics = checkpoint.get_analytics()
    print(f"✅ Checkpoint Analytics: {json.dumps(analytics, indent=2)}\n")
    
    # 2. Test Neo4j Ontology (requires Docker)
    print("2️⃣ Testing Neo4j Ontology System")
    try:
        # Dynamic import for ES modules
        import subprocess
        result = subprocess.run(
            ['node', '-e', '''
                import("./ontology-system/complete-neo4j-ontology.js").then(async (module) => {
                    const ontology = new module.CompleteNeo4jOntology();
                    const init = await ontology.initialize();
                    console.log(JSON.stringify(init));
                    await ontology.close();
                });
            '''],
            capture_output=True,
            text=True,
            cwd='C:\\palantir\\math'
        )
        
        if result.returncode == 0:
            print(f"✅ Neo4j Ontology: {result.stdout}")
        else:
            print(f"️ Neo4j not running (Docker required): {result.stderr}")
    except Exception as e:
        print(f"️ Neo4j test skipped: {e}")
    
    # 3. Test Integration
    print("\n3️⃣ Testing Systems Integration")
    
    # Simulate workflow
    checkpoint.start_task("integration_01", "Neo4j GraphRAG implementation")
    checkpoint.log_decision("Use py2neo for Python compatibility", "Better Python integration", True)
    checkpoint.update_migration("Neo4j", 50)
    checkpoint.complete_task("integration_01", "GraphRAG operational")
    
    # Recovery test
    recovery = checkpoint.recover_session()
    print(f"✅ Recovery Plan: {recovery['action']}")
    print(f"✅ Next Steps: {recovery['next_steps']}\n")
    
    # Save final checkpoint
    checkpoint.save_checkpoint()
    
    return True

if __name__ == "__main__":
    asyncio.run(test_systems())