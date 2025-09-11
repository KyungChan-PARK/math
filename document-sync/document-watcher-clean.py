#!/usr/bin/env python
"""
Document Real-time Synchronization System
- Document change detection and automatic linking
- Code block synchronization
- Memory auto-update
"""

import os
import sys
import json
import re
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Tuple
import time

# watchdog installation check
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("Installing watchdog...")
    os.system(f"{sys.executable} -m pip install watchdog")
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
class DocumentSyncHandler(FileSystemEventHandler):
    """Document synchronization handler"""
    
    def __init__(self, base_path: str = r"C:\palantir\math\dev-docs"):
        self.base_path = Path(base_path)
        self.sync_dir = self.base_path / ".doc-sync"
        self.sync_dir.mkdir(exist_ok=True)
        
        # Metadata files
        self.index_file = self.sync_dir / "index.json"
        self.relations_file = self.sync_dir / "relations.json"
        self.versions_file = self.sync_dir / "versions.json"
        
        # Document patterns (define before loading)
        self.core_pattern = re.compile(r'^\d{2}-[A-Z\-]+\.md$')
        self.reference_pattern = re.compile(r'\[ref:?\s*(\d{2}-[A-Z\-]+)\]|\[link:\s*(\d{2}[^\]]+)\]', re.IGNORECASE)
        self.code_block_pattern = re.compile(r'```(\w+)?\n([\s\S]*?)```', re.MULTILINE)
        
        # Initialize
        self.doc_index = self.load_or_create_index()
        self.relations = self.load_or_create_relations()
        self.versions = self.load_or_create_versions()
        
        print(f"[OK] Document Sync Handler initialized")
        print(f"[PATH] Base Path: {self.base_path}")
        print(f"[COUNT] Tracked documents: {len(self.doc_index)}")
    
    def load_or_create_index(self) -> Dict:
        """Load or create index"""
        if self.index_file.exists():
            with open(self.index_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            index = self.scan_documents()
            self.save_index(index)
            return index
    
    def scan_documents(self) -> Dict:
        """Scan and index documents"""
        index = {}
        md_files = list(self.base_path.glob("*.md"))
        
        for md_file in md_files:
            if self.core_pattern.match(md_file.name):
                doc_id = md_file.stem
                index[doc_id] = {
                    "path": str(md_file),
                    "title": self.extract_title(md_file),
                    "last_modified": md_file.stat().st_mtime,
                    "size": md_file.stat().st_size,
                    "category": self.categorize_document(doc_id)
                }
        
        return index
    
    def extract_title(self, file_path: Path) -> str:
        """Extract document title"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()
                if first_line.startswith('#'):
                    return first_line.lstrip('#').strip()
                return file_path.stem
        except:
            return file_path.stem
    
    def categorize_document(self, doc_id: str) -> str:
        """Categorize document"""
        num = int(doc_id[:2])
        if num < 16:
            return "core"
        elif num < 30:
            return "implementation"
        elif num < 40:
            return "research"
        elif num < 50:
            return "automation"
        else:
            return "config"
    
    def load_or_create_relations(self) -> Dict:
        """Load or create relations"""
        if self.relations_file.exists():
            with open(self.relations_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def load_or_create_versions(self) -> Dict:
        """Load or create version info"""
        if self.versions_file.exists():
            with open(self.versions_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def save_index(self, index: Dict):
        """Save index"""
        with open(self.index_file, 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2, ensure_ascii=False)
    
    def save_relations(self):
        """Save relations"""
        with open(self.relations_file, 'w', encoding='utf-8') as f:
            json.dump(self.relations, f, indent=2, ensure_ascii=False)
    
    def save_versions(self):
        """Save version info"""
        with open(self.versions_file, 'w', encoding='utf-8') as f:
            json.dump(self.versions, f, indent=2, ensure_ascii=False)
    
    def on_modified(self, event):
        """Handle file modification event"""
        if event.is_directory:            return
            
        file_path = Path(event.src_path)
        
        # Process only .md files
        if file_path.suffix != '.md':
            return
            
        # Process only core documents
        if not self.core_pattern.match(file_path.name):
            return
            
        print(f"\n[MODIFIED] Document change detected: {file_path.name}")
        self.sync_document(file_path)
    
    def sync_document(self, file_path: Path):
        """Process document synchronization"""
        doc_id = file_path.stem
        
        try:
            # 1. Read document content
            content = file_path.read_text(encoding='utf-8')
            
            # 2. Extract references
            references = self.extract_references(content)
            
            # 3. Extract code blocks
            code_blocks = self.extract_code_blocks(content)
            
            # 4. Calculate version hash
            content_hash = hashlib.md5(content.encode()).hexdigest()
            
            # 5. Update relations
            self.relations[doc_id] = {
                "references": list(references),
                "referenced_by": self.find_referencing_docs(doc_id),
                "code_blocks": len(code_blocks),
                "last_sync": datetime.now().isoformat()
            }
            
            # 6. Update versions
            if doc_id not in self.versions:
                self.versions[doc_id] = []
                
            self.versions[doc_id].append({
                "hash": content_hash,
                "timestamp": datetime.now().isoformat(),
                "size": len(content),
                "references": len(references),
                "code_blocks": len(code_blocks)
            })
            
            # 7. Update index
            self.doc_index[doc_id]["last_modified"] = time.time()
            self.doc_index[doc_id]["size"] = len(content)            
            # 8. Save
            self.save_index(self.doc_index)
            self.save_relations()
            self.save_versions()
            
            # 9. Report
            print(f"  [OK] Synchronization complete")
            print(f"  [REFS] References: {len(references)}")
            print(f"  [CODE] Code blocks: {len(code_blocks)}")
            print(f"  [LINKS] Referenced by: {len(self.relations[doc_id]['referenced_by'])} documents")
            
            # 10. Notify related documents
            self.notify_related_documents(doc_id, references)
            
        except Exception as e:
            print(f"  [ERROR] Sync failed: {e}")
    
    def extract_references(self, content: str) -> Set[str]:
        """Extract references from document"""
        references = set()
        
        # Pattern matching
        matches = self.reference_pattern.findall(content)
        for match in matches:
            ref = match[0] or match[1]
            if ref:
                references.add(ref.strip())        
        # Direct document number references
        doc_refs = re.findall(r'\b(\d{2}-[A-Z\-]+)\.md\b', content)
        references.update(doc_refs)
        
        return references
    
    def extract_code_blocks(self, content: str) -> List[Dict]:
        """Extract code blocks"""
        code_blocks = []
        matches = self.code_block_pattern.findall(content)
        
        for i, (lang, code) in enumerate(matches):
            code_blocks.append({
                "index": i,
                "language": lang or "text",
                "lines": len(code.splitlines()),
                "hash": hashlib.md5(code.encode()).hexdigest()[:8]
            })
        
        return code_blocks
    
    def find_referencing_docs(self, target_doc: str) -> List[str]:
        """Find documents referencing target document"""
        referencing = []
        
        for doc_id, rel_data in self.relations.items():
            if target_doc in rel_data.get("references", []):
                referencing.append(doc_id)        
        return referencing
    
    def notify_related_documents(self, doc_id: str, references: Set[str]):
        """Notify related documents"""
        if references:
            print(f"  [NOTIFY] Related documents:")
            for ref in references:
                if ref in self.doc_index:
                    print(f"     --> {ref}: {self.doc_index[ref]['title']}")
    
    def generate_report(self):
        """Generate sync status report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_documents": len(self.doc_index),
            "total_relations": sum(len(r["references"]) for r in self.relations.values()),
            "categories": {},
            "orphaned_documents": [],
            "most_referenced": [],
            "recent_changes": []
        }
        
        # Category aggregation
        for doc_id, doc_info in self.doc_index.items():
            category = doc_info["category"]
            if category not in report["categories"]:
                report["categories"][category] = 0
            report["categories"][category] += 1        
        # Find orphaned documents
        for doc_id in self.doc_index:
            if doc_id not in self.relations or not self.relations[doc_id]["references"]:
                if doc_id not in self.relations or not self.relations[doc_id]["referenced_by"]:
                    report["orphaned_documents"].append(doc_id)
        
        # Most referenced documents
        ref_counts = {}
        for doc_id in self.doc_index:
            if doc_id in self.relations:
                count = len(self.relations[doc_id].get("referenced_by", []))
                if count > 0:
                    ref_counts[doc_id] = count
        
        report["most_referenced"] = sorted(
            ref_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5]
        
        # Recent changes
        recent = sorted(
            self.doc_index.items(),
            key=lambda x: x[1]["last_modified"],
            reverse=True
        )[:5]        
        report["recent_changes"] = [
            {
                "doc_id": doc_id,
                "title": info["title"],
                "modified": datetime.fromtimestamp(info["last_modified"]).isoformat()
            }
            for doc_id, info in recent
        ]
        
        return report

def main():
    """Main execution function"""
    print("=" * 60)
    print("[START] Document Real-time Synchronization System")
    print("=" * 60)
    
    # Create handler
    handler = DocumentSyncHandler()
    
    # Initial scan and report
    print("\n[ANALYZE] Initial state analysis...")
    report = handler.generate_report()
    
    print(f"\n[TOTAL] Documents: {report['total_documents']}")
    print(f"[LINKS] Relations: {report['total_relations']}")    
    if report['orphaned_documents']:
        print(f"\n[WARNING] Orphaned documents ({len(report['orphaned_documents'])}):")
        for doc in report['orphaned_documents']:
            print(f"   - {doc}")
    
    if report['most_referenced']:
        print(f"\n[TOP] Most referenced documents:")
        for doc_id, count in report['most_referenced']:
            print(f"   - {doc_id}: {count} references")
    
    # Setup Observer
    observer = Observer()
    observer.schedule(
        handler, 
        str(handler.base_path),
        recursive=False
    )
    
    # Start watching
    observer.start()
    print(f"\n[WATCH] Document monitoring started...")
    print(f"[PATH] Monitoring: {handler.base_path}")
    print(f"[STOP] Press Ctrl+C to stop\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\n\n[STOP] Document sync system shutting down")
        
        # Final report
        final_report = handler.generate_report()
        report_file = handler.base_path / f"sync-report-{datetime.now():%Y%m%d-%H%M%S}.json"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(final_report, f, indent=2, ensure_ascii=False)
        
        print(f"[REPORT] Final report saved: {report_file}")
    
    observer.join()

if __name__ == "__main__":
    main()
