#!/usr/bin/env python
"""
[KR] [KR] [KR] [KR]
- [KR] [KR] [KR] [KR] [KR] connection
- [KR] [KR] [KR]
- [KR] [KR] [KR]
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

# watchdog [KR] [KR]
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("Installing watchdog...")
    os.system(f"{sys.executable} -m pip install watchdog")
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler

class DocumentSyncHandler(FileSystemEventHandler):
    """[KR] [KR] [KR]"""
    
    def __init__(self, base_path: str = r"C:\palantir\math\dev-docs"):
        self.base_path = Path(base_path)
        self.sync_dir = self.base_path / ".doc-sync"
        self.sync_dir.mkdir(exist_ok=True)
        
        # [KR] [KR]
        self.index_file = self.sync_dir / "index.json"
        self.relations_file = self.sync_dir / "relations.json"
        self.versions_file = self.sync_dir / "versions.json"
        
        # [KR]
        self.doc_index = self.load_or_create_index()
        self.relations = self.load_or_create_relations()
        self.versions = self.load_or_create_versions()
        
        # [KR] [KR]
        self.core_pattern = re.compile(r'^\d{2}-[A-Z\-]+\.md$')
        self.reference_pattern = re.compile(r'\[[KR]:?\s*(\d{2}-[A-Z\-]+)\]|\[link:\s*(\d{2}[^\]]+)\]', re.IGNORECASE)
        self.code_block_pattern = re.compile(r'```(\w+)?\n([\s\S]*?)```', re.MULTILINE)
        
        print(f"✅ Document Sync Handler [KR] complete")
        print(f" Base Path: {self.base_path}")
        print(f" [KR] [KR]: {len(self.doc_index)}[KR]")
    
    def load_or_create_index(self) -> Dict:
        """[KR] [KR] [KR] [KR]"""
        if self.index_file.exists():
            with open(self.index_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            index = self.scan_documents()
            self.save_index(index)
            return index
    
    def scan_documents(self) -> Dict:
        """[KR] [KR] [KR] [KR]"""
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
        """[KR] [KR] [KR]"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()
                if first_line.startswith('#'):
                    return first_line.lstrip('#').strip()
                return file_path.stem
        except:
            return file_path.stem
    
    def categorize_document(self, doc_id: str) -> str:
        """[KR] [KR] [KR]"""
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
        """[KR] [KR] [KR] [KR]"""
        if self.relations_file.exists():
            with open(self.relations_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def load_or_create_versions(self) -> Dict:
        """[KR] [KR] [KR] [KR] [KR]"""
        if self.versions_file.exists():
            with open(self.versions_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def save_index(self, index: Dict):
        """[KR] [KR]"""
        with open(self.index_file, 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2, ensure_ascii=False)
    
    def save_relations(self):
        """[KR] [KR]"""
        with open(self.relations_file, 'w', encoding='utf-8') as f:
            json.dump(self.relations, f, indent=2, ensure_ascii=False)
    
    def save_versions(self):
        """[KR] [KR] [KR]"""
        with open(self.versions_file, 'w', encoding='utf-8') as f:
            json.dump(self.versions, f, indent=2, ensure_ascii=False)
    
    def on_modified(self, event):
        """[KR] [KR] [KR] [KR]"""
        if event.is_directory:
            return
            
        file_path = Path(event.src_path)
        
        # .md [KR] [KR]
        if file_path.suffix != '.md':
            return
            
        # [KR] [KR] [KR]
        if not self.core_pattern.match(file_path.name):
            return
            
        print(f"\n [KR] [KR] [KR]: {file_path.name}")
        self.sync_document(file_path)
    
    def sync_document(self, file_path: Path):
        """[KR] [KR] [KR]"""
        doc_id = file_path.stem
        
        try:
            # 1. [KR] [KR] [KR]
            content = file_path.read_text(encoding='utf-8')
            
            # 2. [KR] [KR]
            references = self.extract_references(content)
            
            # 3. [KR] [KR] [KR]
            code_blocks = self.extract_code_blocks(content)
            
            # 4. [KR] [KR] [KR]
            content_hash = hashlib.md5(content.encode()).hexdigest()
            
            # 5. [KR] [KR]
            self.relations[doc_id] = {
                "references": list(references),
                "referenced_by": self.find_referencing_docs(doc_id),
                "code_blocks": len(code_blocks),
                "last_sync": datetime.now().isoformat()
            }
            
            # 6. [KR] [KR]
            if doc_id not in self.versions:
                self.versions[doc_id] = []
                
            self.versions[doc_id].append({
                "hash": content_hash,
                "timestamp": datetime.now().isoformat(),
                "size": len(content),
                "references": len(references),
                "code_blocks": len(code_blocks)
            })
            
            # 7. [KR] [KR]
            self.doc_index[doc_id]["last_modified"] = time.time()
            self.doc_index[doc_id]["size"] = len(content)
            
            # 8. [KR]
            self.save_index(self.doc_index)
            self.save_relations()
            self.save_versions()
            
            # 9. [KR]
            print(f"  ✅ [KR] complete")
            print(f"   [KR]: {len(references)}[KR]")
            print(f"   [KR] [KR]: {len(code_blocks)}[KR]")
            print(f"   [KR] [KR]: {len(self.relations[doc_id]['referenced_by'])}[KR]")
            
            # 10. [KR] [KR] [KR]
            self.notify_related_documents(doc_id, references)
            
        except Exception as e:
            print(f"  ❌ [KR] failed: {e}")
    
    def extract_references(self, content: str) -> Set[str]:
        """[KR] [KR] [KR] [KR]"""
        references = set()
        
        # [KR] [KR]
        matches = self.reference_pattern.findall(content)
        for match in matches:
            ref = match[0] or match[1]
            if ref:
                references.add(ref.strip())
        
        # [KR] [KR] [KR] [KR] ([KR]: 03-NLP-REALTIME-SYSTEM.md)
        doc_refs = re.findall(r'\b(\d{2}-[A-Z\-]+)\.md\b', content)
        references.update(doc_refs)
        
        return references
    
    def extract_code_blocks(self, content: str) -> List[Dict]:
        """[KR] [KR] [KR]"""
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
        """[KR] [KR] [KR] [KR] [KR]"""
        referencing = []
        
        for doc_id, rel_data in self.relations.items():
            if target_doc in rel_data.get("references", []):
                referencing.append(doc_id)
        
        return referencing
    
    def notify_related_documents(self, doc_id: str, references: Set[str]):
        """[KR] [KR] [KR]"""
        if references:
            print(f"   [KR] [KR] [KR]:")
            for ref in references:
                if ref in self.doc_index:
                    print(f"     → {ref}: {self.doc_index[ref]['title']}")
    
    def generate_report(self):
        """[KR] [KR] [KR] [KR]"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_documents": len(self.doc_index),
            "total_relations": sum(len(r["references"]) for r in self.relations.values()),
            "categories": {},
            "orphaned_documents": [],
            "most_referenced": [],
            "recent_changes": []
        }
        
        # [KR] [KR]
        for doc_id, doc_info in self.doc_index.items():
            category = doc_info["category"]
            if category not in report["categories"]:
                report["categories"][category] = 0
            report["categories"][category] += 1
        
        # [KR] [KR] [KR]
        for doc_id in self.doc_index:
            if doc_id not in self.relations or not self.relations[doc_id]["references"]:
                if doc_id not in self.relations or not self.relations[doc_id]["referenced_by"]:
                    report["orphaned_documents"].append(doc_id)
        
        # [KR] [KR] [KR] [KR]
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
        
        # [KR] [KR]
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
    """[KR] [KR] [KR]"""
    print("=" * 60)
    print(" [KR] [KR] [KR] [KR] start")
    print("=" * 60)
    
    # [KR] [KR]
    handler = DocumentSyncHandler()
    
    # [KR] [KR] [KR] [KR]
    print("\n [KR] [KR] [KR]...")
    report = handler.generate_report()
    
    print(f"\n✅ [KR] [KR]: {report['total_documents']}[KR]")
    print(f" [KR]: {report['total_relations']}[KR]")
    
    if report['orphaned_documents']:
        print(f"\n️ [KR] [KR] ({len(report['orphaned_documents'])}[KR]):")
        for doc in report['orphaned_documents']:
            print(f"   - {doc}")
    
    if report['most_referenced']:
        print(f"\n [KR] [KR] [KR] [KR]:")
        for doc_id, count in report['most_referenced']:
            print(f"   - {doc_id}: {count}[KR]")
    
    # Observer [KR]
    observer = Observer()
    observer.schedule(
        handler, 
        str(handler.base_path),
        recursive=False
    )
    
    # [KR] start
    observer.start()
    print(f"\n [KR] [KR] start...")
    print(f" [KR] [KR]: {handler.base_path}")
    print(f"⏹️ end[KR] Ctrl+C[KR] [KR]\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\n\n [KR] [KR] [KR] end")
        
        # [KR] [KR]
        final_report = handler.generate_report()
        report_file = handler.base_path / f"sync-report-{datetime.now():%Y%m%d-%H%M%S}.json"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(final_report, f, indent=2, ensure_ascii=False)
        
        print(f" [KR] [KR]: {report_file}")
    
    observer.join()

if __name__ == "__main__":
    main()
