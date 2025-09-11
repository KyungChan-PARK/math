"""
Memory-Document Auto Synchronization System
Created: 2025-01-26
Purpose: Keep documents synchronized with memory state
"""

import json
import hashlib
from datetime import datetime
from pathlib import Path
import asyncio
from typing import Dict, List, Any

class MemoryDocSync:
    def __init__(self):
        self.project_root = Path(r"C:\palantir\math")
        self.docs_path = self.project_root / "dev-docs"
        self.memory_hash = {}
        self.doc_hash = {}
        
    def calculate_memory_hash(self, entities: List[Dict]) -> str:
        """Calculate hash of memory entities for change detection"""
        content = json.dumps(entities, sort_keys=True)
        return hashlib.md5(content.encode()).hexdigest()
    
    def scan_documents(self) -> Dict[str, str]:
        """Scan all markdown documents and track their hashes"""
        doc_hashes = {}
        for doc_file in self.docs_path.glob("*.md"):
            with open(doc_file, 'r', encoding='utf-8') as f:
                content = f.read()
                doc_hashes[doc_file.name] = hashlib.md5(content.encode()).hexdigest()
        return doc_hashes
    
    def update_document_from_memory(self, doc_name: str, memory_content: Dict):
        """Update specific document based on memory changes"""
        doc_path = self.docs_path / doc_name
        
        # Read current document
        with open(doc_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Find and update relevant sections
        updated = False
        for i, line in enumerate(lines):
            if "**Status:**" in line or "**Progress:**" in line:
                # Update status lines based on memory
                if "WebSocket" in line and "µWebSockets_Migration" in memory_content:
                    progress = memory_content["µWebSockets_Migration"]["progress"]
                    lines[i] = f"**Status:** WebSocket optimization {progress}\n"
                    updated = True
                elif "Windows ML" in line and "Windows_ML_Migration" in memory_content:
                    progress = memory_content["Windows_ML_Migration"]["progress"]
                    lines[i] = f"**Status:** Windows ML integration {progress}\n"
                    updated = True
        
        # Add new observations as comments at the end
        if updated:
            lines.append(f"\n<!-- Auto-updated from memory: {datetime.now().isoformat()} -->\n")
            
        # Write back
        with open(doc_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        return updated
    
    def sync_memory_to_docs(self, memory_entities: List[Dict]):
        """Main sync function - updates documents based on memory changes"""
        updates = []
        
        # Process key entities that affect documentation
        doc_mappings = {
            "AE_Claude_Max_v3.4.0": "01-MASTER-INSTRUCTIONS.md",
            "µWebSockets_Migration": "06-WEBSOCKET-OPTIMIZATION.md", 
            "Windows_ML_Migration": "07-WINDOWS-ML-INTEGRATION.md",
            "CEP_UXP_Abstraction": "08-CEP-UXP-MIGRATION.md",
            "Palantir_Style_Implementation": "09-PALANTIR-INTEGRATION-PLAN.md"
        }
        
        memory_dict = {e["name"]: e for e in memory_entities if e.get("type") == "entity"}
        
        for entity_name, doc_name in doc_mappings.items():
            if entity_name in memory_dict:
                entity = memory_dict[entity_name]
                doc_path = self.docs_path / doc_name
                
                if doc_path.exists():
                    # Extract key information
                    observations = entity.get("observations", [])
                    
                    # Parse progress from observations
                    progress_info = {}
                    for obs in observations:
                        if "Progress:" in obs or "complete" in obs or "%" in obs:
                            progress_info["progress"] = obs
                            
                    if progress_info:
                        if self.update_document_from_memory(doc_name, {entity_name: progress_info}):
                            updates.append(f"Updated {doc_name} from {entity_name}")
        
        return updates
    
    async def continuous_sync(self, interval: int = 60):
        """Run continuous synchronization every interval seconds"""
        while True:
            try:
                # This would be replaced with actual memory read in production
                # For now, we'll create a placeholder
                print(f"[{datetime.now()}] Checking for memory-doc sync...")
                
                # In real implementation, call memory:read_graph() here
                # memory_state = await read_memory_graph()
                # updates = self.sync_memory_to_docs(memory_state['entities'])
                
                await asyncio.sleep(interval)
            except Exception as e:
                print(f"Sync error: {e}")
                await asyncio.sleep(interval)

# Standalone sync function for immediate use
def sync_now(memory_entities: List[Dict]) -> List[str]:
    """Immediate sync function that can be called directly"""
    syncer = MemoryDocSync()
    return syncer.sync_memory_to_docs(memory_entities)

if __name__ == "__main__":
    syncer = MemoryDocSync()
    print("Memory-Document Sync System Started")
    print(f"Monitoring: {syncer.docs_path}")
    print("Sync interval: 60 seconds")
    
    # For testing - normally would run continuous sync
    # asyncio.run(syncer.continuous_sync())
