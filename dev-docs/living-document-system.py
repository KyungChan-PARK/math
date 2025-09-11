#!/usr/bin/env python
"""
Living Document Interaction System v2.0
[KR] [KR] [KR] [KR] [KR] [KR] [KR]
- [KR] [KR] [KR] [KR] [KR] [KR]
- [KR] [KR] [KR] [KR]
- [KR](Cascade) [KR]
"""

import os
import sys
import json
import re
import hashlib
import asyncio
import difflib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Tuple, Optional
import time
import subprocess

# [KR] [KR] [KR]
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("Installing watchdog...")
    subprocess.run([sys.executable, "-m", "pip", "install", "watchdog"], check=True)
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler

class LivingDocumentSystem(FileSystemEventHandler):
    """[KR] [KR] [KR] [KR] [KR]"""
    
    def __init__(self, base_path: str = r"C:\palantir\math"):
        self.base_path = Path(base_path)
        self.docs_path = self.base_path / "dev-docs"
        self.sync_dir = self.docs_path / ".doc-sync"
        self.sync_dir.mkdir(exist_ok=True)
        
        # [KR] [KR] ([KR] [KR])
        self.core_pattern = re.compile(r'^\d{2}-[A-Z\-]+.*\.md
        
        # [KR] [KR]
        self.interaction_rules = self.define_interaction_rules()
        
        # [KR] [KR] server [KR]
        self.servers = {
            "mediapipe": {"port": 5000, "file": "gesture/mediapipe_server.py"},
            "nlp": {"port": 3000, "file": "nlp/math_nlp_server.js"},
            "orchestration": {"port": 8085, "file": "orchestration/simple-orchestration.js"}
        }
        
        print(f"[LIVING] Living Document System v2.0 [KR] complete")
        print(f"[PATH] Base Path: {self.base_path}")
        print(f"[DOCS] [KR] [KR]: {len(self.doc_index)}[KR]")
        print(f"[RULES] [KR] [KR]: {len(self.interaction_rules)}[KR]")
    
    def define_interaction_rules(self) -> Dict:
        """[KR] [KR] [KR] [KR] [KR]"""
        return {
            "01-MASTER-INSTRUCTIONS": {
                "affects": ["03-NLP", "04-GESTURE", "06-WEBSOCKET"],
                "triggers": ["config_update", "parameter_change"],
                "cascade": True
            },
            "03-NLP-REALTIME-SYSTEM": {
                "affects": ["nlp/math_nlp_server.js"],
                "code_sync": True,
                "test_required": True
            },
            "04-GESTURE-RECOGNITION": {
                "affects": ["gesture/mediapipe_server.py"],
                "code_sync": True,
                "restart_service": "mediapipe"
            },
            "06-WEBSOCKET-OPTIMIZATION": {
                "affects": ["orchestration/simple-orchestration.js"],
                "performance_target": 850,
                "benchmark_on_change": True
            },
            "09-PALANTIR-INTEGRATION": {
                "affects": ["15-ONTOLOGY-ORCHESTRATION"],
                "bidirectional": True
            },
            "16-IMPLEMENTATION-TRACKER": {
                "updates_from_all": True,
                "auto_progress_calculation": True
            }
        }
    
    def load_or_create_index(self) -> Dict:
        """[KR] [KR] [KR] [KR] [KR]"""
        if self.index_file.exists():
            with open(self.index_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return self.scan_documents()
    
    def load_or_create_relations(self) -> Dict:
        """[KR] [KR] [KR] [KR] [KR]"""
        if self.relations_file.exists():
            with open(self.relations_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return self.build_initial_relations()
    
    def load_or_create_interactions(self) -> List:
        """[KR] [KR] [KR]"""
        if self.interactions_file.exists():
            with open(self.interactions_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    
    def load_or_create_code_sync(self) -> Dict:
        """[KR] [KR] [KR] [KR]"""
        if self.code_sync_file.exists():
            with open(self.code_sync_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return self.build_code_sync_map()
    
    def scan_documents(self) -> Dict:
        """[KR] [KR] [KR] [KR] [KR]"""
        index = {}
        for md_file in self.docs_path.glob("*.md"):
            if self.core_pattern.match(md_file.name):
                doc_id = md_file.stem
                index[doc_id] = {
                    "path": str(md_file),
                    "title": self.extract_title(md_file),
                    "last_modified": md_file.stat().st_mtime,
                    "size": md_file.stat().st_size,
                    "code_blocks": self.count_code_blocks(md_file)
                }
        return index
    
    def build_initial_relations(self) -> Dict:
        """[KR] [KR] [KR] [KR]"""
        relations = {}
        
        # [KR] [KR] [KR]
        core_relations = {
            "01-MASTER-INSTRUCTIONS": ["03-NLP", "04-GESTURE", "06-WEBSOCKET", "16-IMPLEMENTATION"],
            "03-NLP-REALTIME-SYSTEM": ["01-MASTER", "16-IMPLEMENTATION"],
            "04-GESTURE-RECOGNITION": ["01-MASTER", "16-IMPLEMENTATION"],
            "06-WEBSOCKET-OPTIMIZATION": ["01-MASTER", "16-IMPLEMENTATION"],
            "09-PALANTIR-INTEGRATION": ["15-ONTOLOGY", "16-IMPLEMENTATION"],
            "15-ONTOLOGY-ORCHESTRATION": ["09-PALANTIR", "16-IMPLEMENTATION"],
            "16-IMPLEMENTATION-TRACKER": ["ALL"]
        }
        
        for doc, refs in core_relations.items():
            relations[doc] = {
                "references": refs,
                "referenced_by": [],
                "last_sync": datetime.now().isoformat()
            }
        
        # [KR] [KR]
        for doc, data in relations.items():
            for ref in data["references"]:
                if ref != "ALL" and ref in relations:
                    relations[ref]["referenced_by"].append(doc)
        
        return relations
    
    def build_code_sync_map(self) -> Dict:
        """[KR] [KR] [KR] [KR]"""
        return {
            "03-NLP-REALTIME-SYSTEM": {
                "files": ["nlp/math_nlp_server.js"],
                "patterns": ["class NLPServer", "processCommand", "generateExtendScript"]
            },
            "04-GESTURE-RECOGNITION": {
                "files": ["gesture/mediapipe_server.py"],
                "patterns": ["class GestureRecognizer", "detect_gesture", "PINCH", "SPREAD"]
            },
            "06-WEBSOCKET-OPTIMIZATION": {
                "files": ["orchestration/simple-orchestration.js", "server/websocket-bridge.js"],
                "patterns": ["WebSocketServer", "MessagePack", "850 msg/sec"]
            }
        }
    
    def extract_title(self, file_path: Path) -> str:
        """[KR] [KR] [KR]"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()
                if first_line.startswith('#'):
                    return first_line.lstrip('#').strip()
        except:
            pass
        return file_path.stem
    
    def count_code_blocks(self, file_path: Path) -> int:
        """[KR] [KR] [KR] [KR]"""
        try:
            content = file_path.read_text(encoding='utf-8')
            return len(self.code_block_pattern.findall(content))
        except:
            return 0
    
    def on_modified(self, event):
        """[KR] [KR] [KR] [KR] - [KR] [KR] [KR]"""
        if event.is_directory:
            return
            
        file_path = Path(event.src_path)
        
        # .md [KR] [KR]
        if file_path.suffix != '.md':
            # [KR] [KR] [KR] [KR] [KR]
            if file_path.suffix in ['.py', '.js']:
                self.sync_code_to_docs(file_path)
            return
        
        # [KR] [KR] [KR]
        if not self.core_pattern.match(file_path.name):
            return
        
        doc_id = file_path.stem
        print(f"\n[CHANGE] Living Document [KR] [KR]: {doc_id}")
        
        # [KR] [KR] start
        self.process_document_interaction(doc_id, file_path)
    
    def process_document_interaction(self, doc_id: str, file_path: Path):
        """[KR] [KR] [KR] - [KR] [KR] [KR] [KR]"""
        
        try:
            # 1. [KR] [KR] [KR]
            changes = self.analyze_changes(file_path)
            print(f"  [ANALYZE] [KR] [KR]: {changes['summary']}")
            
            # 2. [KR] [KR] [KR]
            impact = self.calculate_impact(doc_id, changes)
            print(f"  [IMPACT] [KR] [KR]: {len(impact['affected_docs'])}[KR] [KR], {len(impact['affected_code'])}[KR] [KR]")
            
            # 3. [KR] [KR] [KR]
            if impact['cascade']:
                self.execute_cascade_update(doc_id, changes, impact)
            
            # 4. [KR] [KR]
            if impact['code_sync']:
                self.sync_documentation_to_code(doc_id, changes)
            
            # 5. [KR] [KR] [KR] [KR]
            for affected_doc in impact['affected_docs']:
                self.update_related_document(affected_doc, doc_id, changes)
            
            # 6. [KR] [KR]start [KR]
            if impact['restart_required']:
                self.notify_service_restart(impact['services'])
            
            # 7. [KR] [KR] [KR] (16[KR] [KR])
            if doc_id == "16-IMPLEMENTATION-TRACKER" or "16-IMPLEMENTATION" in impact['affected_docs']:
                self.update_progress_tracker()
            
            # 8. [KR] [KR]
            self.record_interaction({
                "timestamp": datetime.now().isoformat(),
                "source": doc_id,
                "changes": changes,
                "impact": impact,
                "actions_taken": {
                    "docs_updated": impact['affected_docs'],
                    "code_synced": impact['affected_code'],
                    "services_notified": impact['services']
                }
            })
            
            print(f"  [DONE] [KR] complete: {len(impact['affected_docs'])}[KR] [KR] [KR]")
            
        except Exception as e:
            print(f"  [ERROR] [KR] failed: {e}")
    
    def analyze_changes(self, file_path: Path) -> Dict:
        """[KR] [KR] [KR] [KR] [KR]"""
        current_content = file_path.read_text(encoding='utf-8')
        
        # [KR] [KR] [KR] ([KR])
        doc_id = file_path.stem
        cache_file = self.sync_dir / f"cache_{doc_id}.txt"
        
        if cache_file.exists():
            previous_content = cache_file.read_text(encoding='utf-8')
            
            # Diff [KR]
            differ = difflib.unified_diff(
                previous_content.splitlines(),
                current_content.splitlines(),
                lineterm=''
            )
            diff_lines = list(differ)
            
            # [KR] [KR] [KR]
            added_lines = [l for l in diff_lines if l.startswith('+')]
            removed_lines = [l for l in diff_lines if l.startswith('-')]
            
            # [KR] [KR] [KR] [KR]
            old_blocks = self.extract_code_blocks(previous_content)
            new_blocks = self.extract_code_blocks(current_content)
            code_changes = self.compare_code_blocks(old_blocks, new_blocks)
            
            changes = {
                "summary": f"Added: {len(added_lines)}, Removed: {len(removed_lines)}",
                "added": added_lines[:10],  # [KR] 10[KR]
                "removed": removed_lines[:10],
                "code_changes": code_changes,
                "has_structural_change": len(added_lines) > 20 or len(removed_lines) > 20,
                "has_code_change": len(code_changes) > 0
            }
        else:
            # [KR] [KR]
            changes = {
                "summary": "Initial analysis",
                "added": [],
                "removed": [],
                "code_changes": [],
                "has_structural_change": False,
                "has_code_change": False
            }
        
        # [KR] [KR] [KR]
        cache_file.write_text(current_content, encoding='utf-8')
        
        return changes
    
    def extract_code_blocks(self, content: str) -> List[Dict]:
        """[KR] [KR] [KR] [KR] [KR]"""
        blocks = []
        matches = self.code_block_pattern.findall(content)
        
        for i, (lang, code) in enumerate(matches):
            # [KR] [KR]/[KR] [KR] [KR]
            identifiers = self.extract_identifiers(code, lang)
            
            blocks.append({
                "index": i,
                "language": lang or "text",
                "content": code,
                "lines": len(code.splitlines()),
                "hash": hashlib.md5(code.encode()).hexdigest()[:8],
                "identifiers": identifiers
            })
        
        return blocks
    
    def extract_identifiers(self, code: str, language: str) -> List[str]:
        """[KR] [KR] [KR] [KR]"""
        identifiers = []
        
        if language == "python":
            # Python [KR]/[KR]
            patterns = [
                r'class\s+(\w+)',
                r'def\s+(\w+)',
            ]
        elif language in ["javascript", "js"]:
            # JavaScript [KR]/[KR]
            patterns = [
                r'class\s+(\w+)',
                r'function\s+(\w+)',
                r'const\s+(\w+)\s*=',
            ]
        else:
            return []
        
        for pattern in patterns:
            matches = re.findall(pattern, code)
            identifiers.extend(matches)
        
        return identifiers
    
    def compare_code_blocks(self, old_blocks: List, new_blocks: List) -> List[Dict]:
        """[KR] [KR] [KR] [KR]"""
        changes = []
        
        # [KR] [KR] [KR]
        old_hashes = {b['hash']: b for b in old_blocks}
        new_hashes = {b['hash']: b for b in new_blocks}
        
        # [KR] [KR]
        for hash, block in new_hashes.items():
            if hash not in old_hashes:
                changes.append({
                    "type": "added",
                    "block": block
                })
        
        # [KR] [KR]
        for hash, block in old_hashes.items():
            if hash not in new_hashes:
                changes.append({
                    "type": "removed",
                    "block": block
                })
        
        # [KR] [KR] ([KR] [KR])
        for i in range(min(len(old_blocks), len(new_blocks))):
            if old_blocks[i]['hash'] != new_blocks[i]['hash']:
                changes.append({
                    "type": "modified",
                    "old": old_blocks[i],
                    "new": new_blocks[i]
                })
        
        return changes
    
    def calculate_impact(self, doc_id: str, changes: Dict) -> Dict:
        """[KR] [KR] [KR] [KR]"""
        impact = {
            "affected_docs": [],
            "affected_code": [],
            "services": [],
            "cascade": False,
            "code_sync": False,
            "restart_required": False
        }
        
        # [KR] [KR] [KR]
        if doc_id in self.interaction_rules:
            rule = self.interaction_rules[doc_id]
            
            # [KR] [KR]
            if "affects" in rule:
                impact["affected_docs"] = rule["affects"]
            
            # [KR] [KR] [KR]
            if rule.get("cascade", False):
                impact["cascade"] = True
            
            # [KR] [KR] [KR]
            if rule.get("code_sync", False):
                impact["code_sync"] = True
                if doc_id in self.code_sync_map:
                    impact["affected_code"] = self.code_sync_map[doc_id]["files"]
            
            # [KR] [KR]start [KR]
            if "restart_service" in rule:
                impact["restart_required"] = True
                impact["services"] = [rule["restart_service"]]
        
        # [KR] [KR] [KR] [KR]
        if doc_id in self.relations:
            rel = self.relations[doc_id]
            impact["affected_docs"].extend(rel.get("references", []))
            impact["affected_docs"] = list(set(impact["affected_docs"]))  # [KR] [KR]
        
        return impact
    
    def execute_cascade_update(self, source_doc: str, changes: Dict, impact: Dict):
        """[KR] [KR] [KR]"""
        print(f"  [CASCADE] [KR] [KR] start: {source_doc}")
        
        # [KR] [KR]
        update_chain = []
        visited = set()
        queue = [(source_doc, 0)]  # (doc, depth)
        
        while queue:
            doc, depth = queue.pop(0)
            if doc in visited or depth > 3:  # [KR] [KR] 3
                continue
            
            visited.add(doc)
            update_chain.append((doc, depth))
            
            # [KR] [KR] [KR] [KR]
            if doc in self.relations:
                for ref in self.relations[doc]["references"]:
                    if ref not in visited and ref != "ALL":
                        queue.append((ref, depth + 1))
        
        # [KR] [KR] [KR]
        for doc, depth in update_chain[1:]:  # [KR] [KR]
            print(f"    -> Level {depth}: Updating {doc}")
            self.cascade_update_document(doc, source_doc, changes)
    
    def cascade_update_document(self, target_doc: str, source_doc: str, changes: Dict):
        """[KR] [KR] [KR] [KR]"""
        target_path = self.docs_path / f"{target_doc}.md"
        
        if not target_path.exists():
            return
        
        content = target_path.read_text(encoding='utf-8')
        updated = content
        
        # [KR] [KR] [KR]
        update_marker = f"\n\n<!-- Auto-updated from {source_doc} at {datetime.now():%Y-%m-%d %H:%M} -->\n"
        
        # [KR] [KR] [KR]
        if changes["has_code_change"]:
            # [KR] [KR] [KR] [KR]
            for change in changes["code_changes"]:
                if change["type"] == "modified":
                    # [KR] [KR] [KR] [KR] [KR]
                    old_hash = change["old"]["hash"]
                    if old_hash in content:
                        # [KR] [KR] [KR] [KR]
                        updated = updated.replace(
                            f"<!-- hash:{old_hash} -->",
                            f"<!-- hash:{change['new']['hash']} -->"
                        )
        
        # [KR] [KR]
        updated = self.update_references(updated, source_doc, changes)
        
        # [KR] [KR] [KR]
        if updated != content:
            updated += update_marker
            target_path.write_text(updated, encoding='utf-8')
            print(f"      [OK] {target_doc} [KR] complete")
    
    def update_references(self, content: str, source_doc: str, changes: Dict) -> str:
        """[KR] [KR] [KR] [KR]"""
        # [KR] [KR] [KR]
        ref_pattern = re.compile(rf'\[.*?\]\(.*?{source_doc}.*?\)')
        
        # [KR] [KR] [KR]
        def update_ref(match):
            ref_text = match.group(0)
            # [KR] [KR] [KR]
            if "<!-- updated:" not in ref_text:
                return f"{ref_text} <!-- updated:{datetime.now():%Y-%m-%d} -->"
            return ref_text
        
        return ref_pattern.sub(update_ref, content)
    
    def sync_documentation_to_code(self, doc_id: str, changes: Dict):
        """[KR] [KR] [KR]"""
        if doc_id not in self.code_sync_map:
            return
        
        print(f"  [DOC->CODE] [KR] [KR] [KR]")
        
        sync_info = self.code_sync_map[doc_id]
        doc_path = self.docs_path / f"{doc_id}.md"
        doc_content = doc_path.read_text(encoding='utf-8')
        
        # [KR] [KR] [KR]
        code_blocks = self.extract_code_blocks(doc_content)
        
        for code_file in sync_info["files"]:
            code_path = self.base_path / code_file
            
            if not code_path.exists():
                print(f"    [WARN] [KR] [KR] [KR]: {code_file}")
                continue
            
            # [KR] [KR] [KR]
            code_content = code_path.read_text(encoding='utf-8')
            updated_code = code_content
            
            # [KR] [KR] [KR] [KR]
            for block in code_blocks:
                if block["language"] in ["python", "javascript", "js"]:
                    # [KR] [KR]
                    for identifier in block["identifiers"]:
                        if identifier in sync_info["patterns"]:
                            # [KR] [KR] [KR]
                            print(f"    -> Updating {identifier} in {code_file}")
                            # [KR] [KR] [KR] [KR] ([KR] [KR])
                            updated_code = self.smart_code_merge(
                                updated_code, 
                                block["content"],
                                identifier
                            )
            
            # [KR] [KR] [KR]
            if updated_code != code_content:
                # [KR] [KR]
                backup_path = code_path.with_suffix('.backup')
                backup_path.write_text(code_content, encoding='utf-8')
                
                # [KR] [KR] [KR]
                code_path.write_text(updated_code, encoding='utf-8')
                print(f"    [OK] {code_file} [KR] complete ([KR]: {backup_path.name})")
    
    def smart_code_merge(self, existing_code: str, new_snippet: str, identifier: str) -> str:
        """[KR] [KR] [KR]"""
        # [KR] [KR] - [KR] AST [KR] [KR] [KR]
        
        # [KR]/[KR] [KR] [KR]
        if "def " + identifier in new_snippet or "class " + identifier in new_snippet:
            # [KR] [KR] [KR]
            pattern = rf'(def|class)\s+{identifier}.*?(?=\n(def|class|\Z))'
            
            # [KR] [KR] [KR]
            if re.search(pattern, existing_code, re.DOTALL):
                existing_code = re.sub(pattern, new_snippet, existing_code, flags=re.DOTALL)
            else:
                # [KR] [KR]
                existing_code += f"\n\n{new_snippet}"
        
        return existing_code
    
    def sync_code_to_docs(self, code_path: Path):
        """[KR] [KR] [KR] [KR]"""
        print(f"  [CODE->DOC] [KR] [KR] [KR]: {code_path.name}")
        
        # [KR] [KR] [KR]
        for doc_id, sync_info in self.code_sync_map.items():
            if any(code_path.name in f for f in sync_info["files"]):
                doc_path = self.docs_path / f"{doc_id}.md"
                
                if not doc_path.exists():
                    continue
                
                # [KR] [KR]
                code_content = code_path.read_text(encoding='utf-8')
                
                # [KR] [KR]
                doc_content = doc_path.read_text(encoding='utf-8')
                
                # [KR] [KR] [KR]
                updated_doc = self.update_doc_code_blocks(
                    doc_content,
                    code_content,
                    code_path.suffix[1:]  # .py -> py
                )
                
                # [KR]
                if updated_doc != doc_content:
                    doc_path.write_text(updated_doc, encoding='utf-8')
                    print(f"    [OK] {doc_id}.md [KR] complete")
    
    def update_doc_code_blocks(self, doc_content: str, code_content: str, language: str) -> str:
        """[KR] [KR] [KR] [KR]"""
        # [KR] [KR]/[KR] [KR]
        if language == "py":
            pattern = r'(class|def)\s+(\w+).*?(?=\n(?:class|def|\Z))'
        else:
            pattern = r'(class|function|const)\s+(\w+).*?(?=\n(?:class|function|const|\Z))'
        
        matches = re.findall(pattern, code_content, re.DOTALL)
        
        for match in matches[:3]:  # [KR] 3[KR]
            # [KR] [KR] [KR] [KR] [KR] [KR]
            if match[1] in doc_content:
                # [KR]
                old_block_pattern = rf'```{language}\n.*?{match[1]}.*?```'
                new_block = f"```{language}\n{match[0]}\n```"
                
                doc_content = re.sub(
                    old_block_pattern,
                    new_block,
                    doc_content,
                    flags=re.DOTALL
                )
        
        return doc_content
    
    def update_related_document(self, target_doc: str, source_doc: str, changes: Dict):
        """[KR] [KR] [KR] [KR]"""
        target_path = self.docs_path / f"{target_doc}.md"
        
        # [KR] [KR]: 16[KR] [KR] (Implementation Tracker)
        if "16-IMPLEMENTATION" in target_doc:
            self.update_progress_tracker()
            return
        
        if not target_path.exists():
            # [KR] [KR] [KR]
            possible_files = list(self.docs_path.glob(f"*{target_doc}*.md"))
            if possible_files:
                target_path = possible_files[0]
            else:
                return
        
        content = target_path.read_text(encoding='utf-8')
        updated = content
        
        # [KR] [KR] [KR] [KR]
        update_section = f"\n## [AUTO-SYNC] Auto-sync from {source_doc}\n"
        update_section += f"**Updated**: {datetime.now():%Y-%m-%d %H:%M}\n\n"
        
        if changes["has_code_change"]:
            update_section += "### Code Changes\n"
            for change in changes["code_changes"][:3]:  # [KR] 3[KR]
                update_section += f"- {change['type']}: {change.get('block', change.get('new', {})).get('language', 'unknown')} block\n"
        
        # [KR] auto-sync [KR] [KR] [KR] [KR]
        if "##  Auto-sync from" in updated:
            # [KR] [KR] [KR]
            pattern = r'##  Auto-sync from.*?(?=\n##|\Z)'
            updated = re.sub(pattern, update_section, updated, flags=re.DOTALL)
        else:
            # [KR] [KR] [KR]
            updated += f"\n{update_section}"
        
        # [KR]
        if updated != content:
            target_path.write_text(updated, encoding='utf-8')
            print(f"    [OK] {target_doc} [KR] [KR] complete")
    
    def update_progress_tracker(self):
        """16[KR] [KR] ([KR] [KR]) [KR] [KR]"""
        tracker_path = self.docs_path / "16-IMPLEMENTATION-TRACKER.md"
        
        if not tracker_path.exists():
            return
        
        print(f"  [PROGRESS] [KR] [KR] [KR] [KR]...")
        
        # [KR] [KR] [KR] [KR]
        progress = {
            "documentation": self.calculate_doc_progress(),
            "servers": self.calculate_server_progress(),
            "integration": self.calculate_integration_progress(),
            "testing": self.calculate_test_progress()
        }
        
        # [KR] [KR]
        content = tracker_path.read_text(encoding='utf-8')
        
        # [KR] [KR] [KR]
        progress_section = f"""## [PROGRESS] [KR] [KR] (Auto-calculated)
```javascript
{{
  "documentation": "{progress['documentation']}%",
  "servers": "{progress['servers']}%",
  "integration": "{progress['integration']}%",
  "testing": "{progress['testing']}%",
  "last_updated": "{datetime.now():%Y-%m-%d %H:%M}"
}}
```"""
        
        # [KR]
        pattern = r'##  [KR] [KR].*?```javascript.*?```'
        updated = re.sub(pattern, progress_section, content, flags=re.DOTALL)
        
        # [KR]
        if updated != content:
            tracker_path.write_text(updated, encoding='utf-8')
            print(f"    [OK] Progress updated: Doc={progress['documentation']}%, Server={progress['servers']}%")
    
    def calculate_doc_progress(self) -> int:
        """[KR] [KR] [KR]"""
        total_docs = len(self.doc_index)
        completed = sum(1 for doc in self.doc_index.values() if doc["size"] > 1000)
        return int((completed / total_docs) * 100) if total_docs > 0 else 0
    
    def calculate_server_progress(self) -> int:
        """server [KR] [KR] [KR]"""
        # [KR] server [KR] [KR]
        running = 0
        for server, info in self.servers.items():
            # [KR] [KR]
            result = subprocess.run(
                f"netstat -ano | findstr :{info['port']}",
                shell=True,
                capture_output=True,
                text=True
            )
            if "LISTENING" in result.stdout:
                running += 1
        
        return int((running / len(self.servers)) * 100) if self.servers else 0
    
    def calculate_integration_progress(self) -> int:
        """integration [KR] [KR]"""
        # [KR] [KR] [KR]
        total_relations = sum(
            len(r["references"]) + len(r["referenced_by"])
            for r in self.relations.values()
        )
        expected_relations = len(self.doc_index) * 3  # [KR] 3[KR] [KR]
        return min(int((total_relations / expected_relations) * 100), 100)
    
    def calculate_test_progress(self) -> int:
        """test [KR] [KR]"""
        # test [KR] [KR] [KR]
        test_files = list(self.base_path.glob("**/test*.py")) + \
                     list(self.base_path.glob("**/test*.js"))
        return min(len(test_files) * 10, 100)  # [KR] test[KR] 10%
    
    def notify_service_restart(self, services: List[str]):
        """[KR] [KR]start [KR]"""
        for service in services:
            if service in self.servers:
                info = self.servers[service]
                print(f"  [RESTART] [KR] [KR]start [KR]: {service} (port {info['port']})")
                
                # [KR]start [KR] [KR] ([KR] [KR] [KR] [KR])
                if service == "mediapipe":
                    cmd = f"C:\\palantir\\math\\venv311\\Scripts\\python.exe {self.base_path}\\{info['file']}"
                else:
                    cmd = f"cd {self.base_path}\\{Path(info['file']).parent}; node {Path(info['file']).name}"
                
                print(f"    [KR]: {cmd}")
    
    def record_interaction(self, interaction: Dict):
        """[KR] [KR]"""
        self.interactions.append(interaction)
        
        # [KR] 100[KR] [KR]
        if len(self.interactions) > 100:
            self.interactions = self.interactions[-100:]
        
        # [KR]
        with open(self.interactions_file, 'w', encoding='utf-8') as f:
            json.dump(self.interactions, f, indent=2, ensure_ascii=False)
    
    def generate_interaction_report(self) -> Dict:
        """[KR] [KR] [KR]"""
        if not self.interactions:
            return {"message": "No interactions recorded yet"}
        
        report = {
            "total_interactions": len(self.interactions),
            "last_24h": 0,
            "most_active_docs": {},
            "cascade_updates": 0,
            "code_syncs": 0,
            "service_restarts": 0
        }
        
        now = datetime.now()
        
        for interaction in self.interactions:
            # 24[KR] [KR]
            timestamp = datetime.fromisoformat(interaction["timestamp"])
            if (now - timestamp).days < 1:
                report["last_24h"] += 1
            
            # [KR] [KR] [KR]
            source = interaction["source"]
            if source not in report["most_active_docs"]:
                report["most_active_docs"][source] = 0
            report["most_active_docs"][source] += 1
            
            # [KR]
            if interaction.get("impact", {}).get("cascade"):
                report["cascade_updates"] += 1
            if interaction.get("impact", {}).get("code_sync"):
                report["code_syncs"] += 1
            if interaction.get("impact", {}).get("restart_required"):
                report["service_restarts"] += 1
        
        # [KR]
        report["most_active_docs"] = dict(
            sorted(report["most_active_docs"].items(),
                   key=lambda x: x[1], reverse=True)[:5]
        )
        
        return report

def main():
    """[KR] [KR] [KR]"""
    print("=" * 60)
    print("[SYSTEM] Living Document Interaction System v2.0")
    print("=" * 60)
    print("\n[KR] [KR] [KR] [KR] [KR] [KR] [KR]")
    print("- [KR] [KR] [KR] [KR] [KR] [KR]")
    print("- [KR] [KR] [KR] [KR]")
    print("- [KR] [KR] [KR] [KR] [KR] [KR]\n")
    
    # [KR] [KR]
    system = LivingDocumentSystem()
    
    # [KR] [KR]
    print("\n[STATUS] [KR] [KR]:")
    print(f"  - [KR] [KR]: {len(system.doc_index)}[KR]")
    print(f"  - [KR] [KR]: {len(system.relations)}[KR]")
    print(f"  - [KR] [KR]: {len(system.interaction_rules)}[KR]")
    print(f"  - [KR] [KR] [KR]: {len(system.code_sync_map)}[KR]")
    
    # Observer [KR]
    observer = Observer()
    
    # [KR] [KR] [KR]
    observer.schedule(system, str(system.docs_path), recursive=False)
    
    # [KR] [KR] [KR] ([KR] [KR])
    for subdir in ["gesture", "nlp", "orchestration"]:
        code_dir = system.base_path / subdir
        if code_dir.exists():
            observer.schedule(system, str(code_dir), recursive=False)
            print(f"  - [KR] [KR]: {subdir}/")
    
    # [KR] start
    observer.start()
    print(f"\n[START] Living Document System [KR]")
    print(f"[PATH] [KR] [KR]: {system.docs_path}")
    print(f"[EXIT] end[KR] Ctrl+C[KR] [KR]\n")
    
    try:
        while True:
            time.sleep(60)  # 1[KR] [KR] [KR]
            
            # [KR] [KR] [KR]
            report = system.generate_interaction_report()
            if report.get("total_interactions", 0) > 0:
                print(f"\n[STATS] [KR] [KR] ([KR] 1[KR]):")
                print(f"  - [KR] [KR]: {report['total_interactions']}[KR]")
                print(f"  - 24[KR] [KR]: {report['last_24h']}[KR]")
                print(f"  - [KR] [KR]: {report['cascade_updates']}[KR]")
                print(f"  - [KR] [KR]: {report['code_syncs']}[KR]")
                
                if report["most_active_docs"]:
                    print(f"  - [KR] [KR] [KR]:")
                    for doc, count in list(report["most_active_docs"].items())[:3]:
                        print(f"    - {doc}: {count}[KR]")
            
    except KeyboardInterrupt:
        observer.stop()
        print("\n\n[STOP] Living Document System end")
        
        # [KR] [KR] [KR]
        final_report = system.generate_interaction_report()
        report_file = system.sync_dir / f"interaction-report-{datetime.now():%Y%m%d-%H%M%S}.json"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(final_report, f, indent=2, ensure_ascii=False)
        
        print(f"[REPORT] [KR] [KR] [KR]: {report_file}")
        print(f"  - [KR] [KR]: {final_report.get('total_interactions', 0)}[KR]")
        print(f"  - [KR] [KR]: {final_report.get('cascade_updates', 0)}[KR]")
        print(f"  - [KR] [KR]: {final_report.get('code_syncs', 0)}[KR]")
    
    observer.join()

if __name__ == "__main__":
    main()
)
        self.code_block_pattern = re.compile(r'```(\w+)?\n([\s\S]*?)```', re.MULTILINE)
        
        # [KR] [KR]
        self.index_file = self.sync_dir / "index.json"
        self.relations_file = self.sync_dir / "relations.json"
        self.interactions_file = self.sync_dir / "interactions.json"
        self.code_sync_file = self.sync_dir / "code_sync.json"
        
        # [KR]
        self.doc_index = self.load_or_create_index()
        self.relations = self.load_or_create_relations()
        self.interactions = self.load_or_create_interactions()
        self.code_sync_map = self.load_or_create_code_sync()
        
        # [KR] [KR]
        self.interaction_rules = self.define_interaction_rules()
        
        # [KR] [KR] server [KR]
        self.servers = {
            "mediapipe": {"port": 5000, "file": "gesture/mediapipe_server.py"},
            "nlp": {"port": 3000, "file": "nlp/math_nlp_server.js"},
            "orchestration": {"port": 8085, "file": "orchestration/simple-orchestration.js"}
        }
        
        print(f"[LIVING] Living Document System v2.0 [KR] complete")
        print(f"[PATH] Base Path: {self.base_path}")
        print(f"[DOCS] [KR] [KR]: {len(self.doc_index)}[KR]")
        print(f"[RULES] [KR] [KR]: {len(self.interaction_rules)}[KR]")
    
    def define_interaction_rules(self) -> Dict:
        """[KR] [KR] [KR] [KR] [KR]"""
        return {
            "01-MASTER-INSTRUCTIONS": {
                "affects": ["03-NLP", "04-GESTURE", "06-WEBSOCKET"],
                "triggers": ["config_update", "parameter_change"],
                "cascade": True
            },
            "03-NLP-REALTIME-SYSTEM": {
                "affects": ["nlp/math_nlp_server.js"],
                "code_sync": True,
                "test_required": True
            },
            "04-GESTURE-RECOGNITION": {
                "affects": ["gesture/mediapipe_server.py"],
                "code_sync": True,
                "restart_service": "mediapipe"
            },
            "06-WEBSOCKET-OPTIMIZATION": {
                "affects": ["orchestration/simple-orchestration.js"],
                "performance_target": 850,
                "benchmark_on_change": True
            },
            "09-PALANTIR-INTEGRATION": {
                "affects": ["15-ONTOLOGY-ORCHESTRATION"],
                "bidirectional": True
            },
            "16-IMPLEMENTATION-TRACKER": {
                "updates_from_all": True,
                "auto_progress_calculation": True
            }
        }
    
    def load_or_create_index(self) -> Dict:
        """[KR] [KR] [KR] [KR] [KR]"""
        if self.index_file.exists():
            with open(self.index_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return self.scan_documents()
    
    def load_or_create_relations(self) -> Dict:
        """[KR] [KR] [KR] [KR] [KR]"""
        if self.relations_file.exists():
            with open(self.relations_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return self.build_initial_relations()
    
    def load_or_create_interactions(self) -> List:
        """[KR] [KR] [KR]"""
        if self.interactions_file.exists():
            with open(self.interactions_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    
    def load_or_create_code_sync(self) -> Dict:
        """[KR] [KR] [KR] [KR]"""
        if self.code_sync_file.exists():
            with open(self.code_sync_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return self.build_code_sync_map()
    
    def scan_documents(self) -> Dict:
        """[KR] [KR] [KR] [KR] [KR]"""
        index = {}
        for md_file in self.docs_path.glob("*.md"):
            if self.core_pattern.match(md_file.name):
                doc_id = md_file.stem
                index[doc_id] = {
                    "path": str(md_file),
                    "title": self.extract_title(md_file),
                    "last_modified": md_file.stat().st_mtime,
                    "size": md_file.stat().st_size,
                    "code_blocks": self.count_code_blocks(md_file)
                }
        return index
    
    def build_initial_relations(self) -> Dict:
        """[KR] [KR] [KR] [KR]"""
        relations = {}
        
        # [KR] [KR] [KR]
        core_relations = {
            "01-MASTER-INSTRUCTIONS": ["03-NLP", "04-GESTURE", "06-WEBSOCKET", "16-IMPLEMENTATION"],
            "03-NLP-REALTIME-SYSTEM": ["01-MASTER", "16-IMPLEMENTATION"],
            "04-GESTURE-RECOGNITION": ["01-MASTER", "16-IMPLEMENTATION"],
            "06-WEBSOCKET-OPTIMIZATION": ["01-MASTER", "16-IMPLEMENTATION"],
            "09-PALANTIR-INTEGRATION": ["15-ONTOLOGY", "16-IMPLEMENTATION"],
            "15-ONTOLOGY-ORCHESTRATION": ["09-PALANTIR", "16-IMPLEMENTATION"],
            "16-IMPLEMENTATION-TRACKER": ["ALL"]
        }
        
        for doc, refs in core_relations.items():
            relations[doc] = {
                "references": refs,
                "referenced_by": [],
                "last_sync": datetime.now().isoformat()
            }
        
        # [KR] [KR]
        for doc, data in relations.items():
            for ref in data["references"]:
                if ref != "ALL" and ref in relations:
                    relations[ref]["referenced_by"].append(doc)
        
        return relations
    
    def build_code_sync_map(self) -> Dict:
        """[KR] [KR] [KR] [KR]"""
        return {
            "03-NLP-REALTIME-SYSTEM": {
                "files": ["nlp/math_nlp_server.js"],
                "patterns": ["class NLPServer", "processCommand", "generateExtendScript"]
            },
            "04-GESTURE-RECOGNITION": {
                "files": ["gesture/mediapipe_server.py"],
                "patterns": ["class GestureRecognizer", "detect_gesture", "PINCH", "SPREAD"]
            },
            "06-WEBSOCKET-OPTIMIZATION": {
                "files": ["orchestration/simple-orchestration.js", "server/websocket-bridge.js"],
                "patterns": ["WebSocketServer", "MessagePack", "850 msg/sec"]
            }
        }
    
    def extract_title(self, file_path: Path) -> str:
        """[KR] [KR] [KR]"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()
                if first_line.startswith('#'):
                    return first_line.lstrip('#').strip()
        except:
            pass
        return file_path.stem
    
    def count_code_blocks(self, file_path: Path) -> int:
        """[KR] [KR] [KR] [KR]"""
        try:
            content = file_path.read_text(encoding='utf-8')
            return len(self.code_block_pattern.findall(content))
        except:
            return 0
    
    def on_modified(self, event):
        """[KR] [KR] [KR] [KR] - [KR] [KR] [KR]"""
        if event.is_directory:
            return
            
        file_path = Path(event.src_path)
        
        # .md [KR] [KR]
        if file_path.suffix != '.md':
            # [KR] [KR] [KR] [KR] [KR]
            if file_path.suffix in ['.py', '.js']:
                self.sync_code_to_docs(file_path)
            return
        
        # [KR] [KR] [KR]
        if not self.core_pattern.match(file_path.name):
            return
        
        doc_id = file_path.stem
        print(f"\n[CHANGE] Living Document [KR] [KR]: {doc_id}")
        
        # [KR] [KR] start
        self.process_document_interaction(doc_id, file_path)
    
    def process_document_interaction(self, doc_id: str, file_path: Path):
        """[KR] [KR] [KR] - [KR] [KR] [KR] [KR]"""
        
        try:
            # 1. [KR] [KR] [KR]
            changes = self.analyze_changes(file_path)
            print(f"  [ANALYZE] [KR] [KR]: {changes['summary']}")
            
            # 2. [KR] [KR] [KR]
            impact = self.calculate_impact(doc_id, changes)
            print(f"  [IMPACT] [KR] [KR]: {len(impact['affected_docs'])}[KR] [KR], {len(impact['affected_code'])}[KR] [KR]")
            
            # 3. [KR] [KR] [KR]
            if impact['cascade']:
                self.execute_cascade_update(doc_id, changes, impact)
            
            # 4. [KR] [KR]
            if impact['code_sync']:
                self.sync_documentation_to_code(doc_id, changes)
            
            # 5. [KR] [KR] [KR] [KR]
            for affected_doc in impact['affected_docs']:
                self.update_related_document(affected_doc, doc_id, changes)
            
            # 6. [KR] [KR]start [KR]
            if impact['restart_required']:
                self.notify_service_restart(impact['services'])
            
            # 7. [KR] [KR] [KR] (16[KR] [KR])
            if doc_id == "16-IMPLEMENTATION-TRACKER" or "16-IMPLEMENTATION" in impact['affected_docs']:
                self.update_progress_tracker()
            
            # 8. [KR] [KR]
            self.record_interaction({
                "timestamp": datetime.now().isoformat(),
                "source": doc_id,
                "changes": changes,
                "impact": impact,
                "actions_taken": {
                    "docs_updated": impact['affected_docs'],
                    "code_synced": impact['affected_code'],
                    "services_notified": impact['services']
                }
            })
            
            print(f"  [DONE] [KR] complete: {len(impact['affected_docs'])}[KR] [KR] [KR]")
            
        except Exception as e:
            print(f"  [ERROR] [KR] failed: {e}")
    
    def analyze_changes(self, file_path: Path) -> Dict:
        """[KR] [KR] [KR] [KR] [KR]"""
        current_content = file_path.read_text(encoding='utf-8')
        
        # [KR] [KR] [KR] ([KR])
        doc_id = file_path.stem
        cache_file = self.sync_dir / f"cache_{doc_id}.txt"
        
        if cache_file.exists():
            previous_content = cache_file.read_text(encoding='utf-8')
            
            # Diff [KR]
            differ = difflib.unified_diff(
                previous_content.splitlines(),
                current_content.splitlines(),
                lineterm=''
            )
            diff_lines = list(differ)
            
            # [KR] [KR] [KR]
            added_lines = [l for l in diff_lines if l.startswith('+')]
            removed_lines = [l for l in diff_lines if l.startswith('-')]
            
            # [KR] [KR] [KR] [KR]
            old_blocks = self.extract_code_blocks(previous_content)
            new_blocks = self.extract_code_blocks(current_content)
            code_changes = self.compare_code_blocks(old_blocks, new_blocks)
            
            changes = {
                "summary": f"Added: {len(added_lines)}, Removed: {len(removed_lines)}",
                "added": added_lines[:10],  # [KR] 10[KR]
                "removed": removed_lines[:10],
                "code_changes": code_changes,
                "has_structural_change": len(added_lines) > 20 or len(removed_lines) > 20,
                "has_code_change": len(code_changes) > 0
            }
        else:
            # [KR] [KR]
            changes = {
                "summary": "Initial analysis",
                "added": [],
                "removed": [],
                "code_changes": [],
                "has_structural_change": False,
                "has_code_change": False
            }
        
        # [KR] [KR] [KR]
        cache_file.write_text(current_content, encoding='utf-8')
        
        return changes
    
    def extract_code_blocks(self, content: str) -> List[Dict]:
        """[KR] [KR] [KR] [KR] [KR]"""
        blocks = []
        matches = self.code_block_pattern.findall(content)
        
        for i, (lang, code) in enumerate(matches):
            # [KR] [KR]/[KR] [KR] [KR]
            identifiers = self.extract_identifiers(code, lang)
            
            blocks.append({
                "index": i,
                "language": lang or "text",
                "content": code,
                "lines": len(code.splitlines()),
                "hash": hashlib.md5(code.encode()).hexdigest()[:8],
                "identifiers": identifiers
            })
        
        return blocks
    
    def extract_identifiers(self, code: str, language: str) -> List[str]:
        """[KR] [KR] [KR] [KR]"""
        identifiers = []
        
        if language == "python":
            # Python [KR]/[KR]
            patterns = [
                r'class\s+(\w+)',
                r'def\s+(\w+)',
            ]
        elif language in ["javascript", "js"]:
            # JavaScript [KR]/[KR]
            patterns = [
                r'class\s+(\w+)',
                r'function\s+(\w+)',
                r'const\s+(\w+)\s*=',
            ]
        else:
            return []
        
        for pattern in patterns:
            matches = re.findall(pattern, code)
            identifiers.extend(matches)
        
        return identifiers
    
    def compare_code_blocks(self, old_blocks: List, new_blocks: List) -> List[Dict]:
        """[KR] [KR] [KR] [KR]"""
        changes = []
        
        # [KR] [KR] [KR]
        old_hashes = {b['hash']: b for b in old_blocks}
        new_hashes = {b['hash']: b for b in new_blocks}
        
        # [KR] [KR]
        for hash, block in new_hashes.items():
            if hash not in old_hashes:
                changes.append({
                    "type": "added",
                    "block": block
                })
        
        # [KR] [KR]
        for hash, block in old_hashes.items():
            if hash not in new_hashes:
                changes.append({
                    "type": "removed",
                    "block": block
                })
        
        # [KR] [KR] ([KR] [KR])
        for i in range(min(len(old_blocks), len(new_blocks))):
            if old_blocks[i]['hash'] != new_blocks[i]['hash']:
                changes.append({
                    "type": "modified",
                    "old": old_blocks[i],
                    "new": new_blocks[i]
                })
        
        return changes
    
    def calculate_impact(self, doc_id: str, changes: Dict) -> Dict:
        """[KR] [KR] [KR] [KR]"""
        impact = {
            "affected_docs": [],
            "affected_code": [],
            "services": [],
            "cascade": False,
            "code_sync": False,
            "restart_required": False
        }
        
        # [KR] [KR] [KR]
        if doc_id in self.interaction_rules:
            rule = self.interaction_rules[doc_id]
            
            # [KR] [KR]
            if "affects" in rule:
                impact["affected_docs"] = rule["affects"]
            
            # [KR] [KR] [KR]
            if rule.get("cascade", False):
                impact["cascade"] = True
            
            # [KR] [KR] [KR]
            if rule.get("code_sync", False):
                impact["code_sync"] = True
                if doc_id in self.code_sync_map:
                    impact["affected_code"] = self.code_sync_map[doc_id]["files"]
            
            # [KR] [KR]start [KR]
            if "restart_service" in rule:
                impact["restart_required"] = True
                impact["services"] = [rule["restart_service"]]
        
        # [KR] [KR] [KR] [KR]
        if doc_id in self.relations:
            rel = self.relations[doc_id]
            impact["affected_docs"].extend(rel.get("references", []))
            impact["affected_docs"] = list(set(impact["affected_docs"]))  # [KR] [KR]
        
        return impact
    
    def execute_cascade_update(self, source_doc: str, changes: Dict, impact: Dict):
        """[KR] [KR] [KR]"""
        print(f"  [CASCADE] [KR] [KR] start: {source_doc}")
        
        # [KR] [KR]
        update_chain = []
        visited = set()
        queue = [(source_doc, 0)]  # (doc, depth)
        
        while queue:
            doc, depth = queue.pop(0)
            if doc in visited or depth > 3:  # [KR] [KR] 3
                continue
            
            visited.add(doc)
            update_chain.append((doc, depth))
            
            # [KR] [KR] [KR] [KR]
            if doc in self.relations:
                for ref in self.relations[doc]["references"]:
                    if ref not in visited and ref != "ALL":
                        queue.append((ref, depth + 1))
        
        # [KR] [KR] [KR]
        for doc, depth in update_chain[1:]:  # [KR] [KR]
            print(f"    -> Level {depth}: Updating {doc}")
            self.cascade_update_document(doc, source_doc, changes)
    
    def cascade_update_document(self, target_doc: str, source_doc: str, changes: Dict):
        """[KR] [KR] [KR] [KR]"""
        target_path = self.docs_path / f"{target_doc}.md"
        
        if not target_path.exists():
            return
        
        content = target_path.read_text(encoding='utf-8')
        updated = content
        
        # [KR] [KR] [KR]
        update_marker = f"\n\n<!-- Auto-updated from {source_doc} at {datetime.now():%Y-%m-%d %H:%M} -->\n"
        
        # [KR] [KR] [KR]
        if changes["has_code_change"]:
            # [KR] [KR] [KR] [KR]
            for change in changes["code_changes"]:
                if change["type"] == "modified":
                    # [KR] [KR] [KR] [KR] [KR]
                    old_hash = change["old"]["hash"]
                    if old_hash in content:
                        # [KR] [KR] [KR] [KR]
                        updated = updated.replace(
                            f"<!-- hash:{old_hash} -->",
                            f"<!-- hash:{change['new']['hash']} -->"
                        )
        
        # [KR] [KR]
        updated = self.update_references(updated, source_doc, changes)
        
        # [KR] [KR] [KR]
        if updated != content:
            updated += update_marker
            target_path.write_text(updated, encoding='utf-8')
            print(f"      [OK] {target_doc} [KR] complete")
    
    def update_references(self, content: str, source_doc: str, changes: Dict) -> str:
        """[KR] [KR] [KR] [KR]"""
        # [KR] [KR] [KR]
        ref_pattern = re.compile(rf'\[.*?\]\(.*?{source_doc}.*?\)')
        
        # [KR] [KR] [KR]
        def update_ref(match):
            ref_text = match.group(0)
            # [KR] [KR] [KR]
            if "<!-- updated:" not in ref_text:
                return f"{ref_text} <!-- updated:{datetime.now():%Y-%m-%d} -->"
            return ref_text
        
        return ref_pattern.sub(update_ref, content)
    
    def sync_documentation_to_code(self, doc_id: str, changes: Dict):
        """[KR] [KR] [KR]"""
        if doc_id not in self.code_sync_map:
            return
        
        print(f"  [DOC->CODE] [KR] [KR] [KR]")
        
        sync_info = self.code_sync_map[doc_id]
        doc_path = self.docs_path / f"{doc_id}.md"
        doc_content = doc_path.read_text(encoding='utf-8')
        
        # [KR] [KR] [KR]
        code_blocks = self.extract_code_blocks(doc_content)
        
        for code_file in sync_info["files"]:
            code_path = self.base_path / code_file
            
            if not code_path.exists():
                print(f"    [WARN] [KR] [KR] [KR]: {code_file}")
                continue
            
            # [KR] [KR] [KR]
            code_content = code_path.read_text(encoding='utf-8')
            updated_code = code_content
            
            # [KR] [KR] [KR] [KR]
            for block in code_blocks:
                if block["language"] in ["python", "javascript", "js"]:
                    # [KR] [KR]
                    for identifier in block["identifiers"]:
                        if identifier in sync_info["patterns"]:
                            # [KR] [KR] [KR]
                            print(f"    -> Updating {identifier} in {code_file}")
                            # [KR] [KR] [KR] [KR] ([KR] [KR])
                            updated_code = self.smart_code_merge(
                                updated_code, 
                                block["content"],
                                identifier
                            )
            
            # [KR] [KR] [KR]
            if updated_code != code_content:
                # [KR] [KR]
                backup_path = code_path.with_suffix('.backup')
                backup_path.write_text(code_content, encoding='utf-8')
                
                # [KR] [KR] [KR]
                code_path.write_text(updated_code, encoding='utf-8')
                print(f"    [OK] {code_file} [KR] complete ([KR]: {backup_path.name})")
    
    def smart_code_merge(self, existing_code: str, new_snippet: str, identifier: str) -> str:
        """[KR] [KR] [KR]"""
        # [KR] [KR] - [KR] AST [KR] [KR] [KR]
        
        # [KR]/[KR] [KR] [KR]
        if "def " + identifier in new_snippet or "class " + identifier in new_snippet:
            # [KR] [KR] [KR]
            pattern = rf'(def|class)\s+{identifier}.*?(?=\n(def|class|\Z))'
            
            # [KR] [KR] [KR]
            if re.search(pattern, existing_code, re.DOTALL):
                existing_code = re.sub(pattern, new_snippet, existing_code, flags=re.DOTALL)
            else:
                # [KR] [KR]
                existing_code += f"\n\n{new_snippet}"
        
        return existing_code
    
    def sync_code_to_docs(self, code_path: Path):
        """[KR] [KR] [KR] [KR]"""
        print(f"  [CODE->DOC] [KR] [KR] [KR]: {code_path.name}")
        
        # [KR] [KR] [KR]
        for doc_id, sync_info in self.code_sync_map.items():
            if any(code_path.name in f for f in sync_info["files"]):
                doc_path = self.docs_path / f"{doc_id}.md"
                
                if not doc_path.exists():
                    continue
                
                # [KR] [KR]
                code_content = code_path.read_text(encoding='utf-8')
                
                # [KR] [KR]
                doc_content = doc_path.read_text(encoding='utf-8')
                
                # [KR] [KR] [KR]
                updated_doc = self.update_doc_code_blocks(
                    doc_content,
                    code_content,
                    code_path.suffix[1:]  # .py -> py
                )
                
                # [KR]
                if updated_doc != doc_content:
                    doc_path.write_text(updated_doc, encoding='utf-8')
                    print(f"    [OK] {doc_id}.md [KR] complete")
    
    def update_doc_code_blocks(self, doc_content: str, code_content: str, language: str) -> str:
        """[KR] [KR] [KR] [KR]"""
        # [KR] [KR]/[KR] [KR]
        if language == "py":
            pattern = r'(class|def)\s+(\w+).*?(?=\n(?:class|def|\Z))'
        else:
            pattern = r'(class|function|const)\s+(\w+).*?(?=\n(?:class|function|const|\Z))'
        
        matches = re.findall(pattern, code_content, re.DOTALL)
        
        for match in matches[:3]:  # [KR] 3[KR]
            # [KR] [KR] [KR] [KR] [KR] [KR]
            if match[1] in doc_content:
                # [KR]
                old_block_pattern = rf'```{language}\n.*?{match[1]}.*?```'
                new_block = f"```{language}\n{match[0]}\n```"
                
                doc_content = re.sub(
                    old_block_pattern,
                    new_block,
                    doc_content,
                    flags=re.DOTALL
                )
        
        return doc_content
    
    def update_related_document(self, target_doc: str, source_doc: str, changes: Dict):
        """[KR] [KR] [KR] [KR]"""
        target_path = self.docs_path / f"{target_doc}.md"
        
        # [KR] [KR]: 16[KR] [KR] (Implementation Tracker)
        if "16-IMPLEMENTATION" in target_doc:
            self.update_progress_tracker()
            return
        
        if not target_path.exists():
            # [KR] [KR] [KR]
            possible_files = list(self.docs_path.glob(f"*{target_doc}*.md"))
            if possible_files:
                target_path = possible_files[0]
            else:
                return
        
        content = target_path.read_text(encoding='utf-8')
        updated = content
        
        # [KR] [KR] [KR] [KR]
        update_section = f"\n## [AUTO-SYNC] Auto-sync from {source_doc}\n"
        update_section += f"**Updated**: {datetime.now():%Y-%m-%d %H:%M}\n\n"
        
        if changes["has_code_change"]:
            update_section += "### Code Changes\n"
            for change in changes["code_changes"][:3]:  # [KR] 3[KR]
                update_section += f"- {change['type']}: {change.get('block', change.get('new', {})).get('language', 'unknown')} block\n"
        
        # [KR] auto-sync [KR] [KR] [KR] [KR]
        if "##  Auto-sync from" in updated:
            # [KR] [KR] [KR]
            pattern = r'##  Auto-sync from.*?(?=\n##|\Z)'
            updated = re.sub(pattern, update_section, updated, flags=re.DOTALL)
        else:
            # [KR] [KR] [KR]
            updated += f"\n{update_section}"
        
        # [KR]
        if updated != content:
            target_path.write_text(updated, encoding='utf-8')
            print(f"    [OK] {target_doc} [KR] [KR] complete")
    
    def update_progress_tracker(self):
        """16[KR] [KR] ([KR] [KR]) [KR] [KR]"""
        tracker_path = self.docs_path / "16-IMPLEMENTATION-TRACKER.md"
        
        if not tracker_path.exists():
            return
        
        print(f"  [PROGRESS] [KR] [KR] [KR] [KR]...")
        
        # [KR] [KR] [KR] [KR]
        progress = {
            "documentation": self.calculate_doc_progress(),
            "servers": self.calculate_server_progress(),
            "integration": self.calculate_integration_progress(),
            "testing": self.calculate_test_progress()
        }
        
        # [KR] [KR]
        content = tracker_path.read_text(encoding='utf-8')
        
        # [KR] [KR] [KR]
        progress_section = f"""## [PROGRESS] [KR] [KR] (Auto-calculated)
```javascript
{{
  "documentation": "{progress['documentation']}%",
  "servers": "{progress['servers']}%",
  "integration": "{progress['integration']}%",
  "testing": "{progress['testing']}%",
  "last_updated": "{datetime.now():%Y-%m-%d %H:%M}"
}}
```"""
        
        # [KR]
        pattern = r'##  [KR] [KR].*?```javascript.*?```'
        updated = re.sub(pattern, progress_section, content, flags=re.DOTALL)
        
        # [KR]
        if updated != content:
            tracker_path.write_text(updated, encoding='utf-8')
            print(f"    [OK] Progress updated: Doc={progress['documentation']}%, Server={progress['servers']}%")
    
    def calculate_doc_progress(self) -> int:
        """[KR] [KR] [KR]"""
        total_docs = len(self.doc_index)
        completed = sum(1 for doc in self.doc_index.values() if doc["size"] > 1000)
        return int((completed / total_docs) * 100) if total_docs > 0 else 0
    
    def calculate_server_progress(self) -> int:
        """server [KR] [KR] [KR]"""
        # [KR] server [KR] [KR]
        running = 0
        for server, info in self.servers.items():
            # [KR] [KR]
            result = subprocess.run(
                f"netstat -ano | findstr :{info['port']}",
                shell=True,
                capture_output=True,
                text=True
            )
            if "LISTENING" in result.stdout:
                running += 1
        
        return int((running / len(self.servers)) * 100) if self.servers else 0
    
    def calculate_integration_progress(self) -> int:
        """integration [KR] [KR]"""
        # [KR] [KR] [KR]
        total_relations = sum(
            len(r["references"]) + len(r["referenced_by"])
            for r in self.relations.values()
        )
        expected_relations = len(self.doc_index) * 3  # [KR] 3[KR] [KR]
        return min(int((total_relations / expected_relations) * 100), 100)
    
    def calculate_test_progress(self) -> int:
        """test [KR] [KR]"""
        # test [KR] [KR] [KR]
        test_files = list(self.base_path.glob("**/test*.py")) + \
                     list(self.base_path.glob("**/test*.js"))
        return min(len(test_files) * 10, 100)  # [KR] test[KR] 10%
    
    def notify_service_restart(self, services: List[str]):
        """[KR] [KR]start [KR]"""
        for service in services:
            if service in self.servers:
                info = self.servers[service]
                print(f"  [RESTART] [KR] [KR]start [KR]: {service} (port {info['port']})")
                
                # [KR]start [KR] [KR] ([KR] [KR] [KR] [KR])
                if service == "mediapipe":
                    cmd = f"C:\\palantir\\math\\venv311\\Scripts\\python.exe {self.base_path}\\{info['file']}"
                else:
                    cmd = f"cd {self.base_path}\\{Path(info['file']).parent}; node {Path(info['file']).name}"
                
                print(f"    [KR]: {cmd}")
    
    def record_interaction(self, interaction: Dict):
        """[KR] [KR]"""
        self.interactions.append(interaction)
        
        # [KR] 100[KR] [KR]
        if len(self.interactions) > 100:
            self.interactions = self.interactions[-100:]
        
        # [KR]
        with open(self.interactions_file, 'w', encoding='utf-8') as f:
            json.dump(self.interactions, f, indent=2, ensure_ascii=False)
    
    def generate_interaction_report(self) -> Dict:
        """[KR] [KR] [KR]"""
        if not self.interactions:
            return {"message": "No interactions recorded yet"}
        
        report = {
            "total_interactions": len(self.interactions),
            "last_24h": 0,
            "most_active_docs": {},
            "cascade_updates": 0,
            "code_syncs": 0,
            "service_restarts": 0
        }
        
        now = datetime.now()
        
        for interaction in self.interactions:
            # 24[KR] [KR]
            timestamp = datetime.fromisoformat(interaction["timestamp"])
            if (now - timestamp).days < 1:
                report["last_24h"] += 1
            
            # [KR] [KR] [KR]
            source = interaction["source"]
            if source not in report["most_active_docs"]:
                report["most_active_docs"][source] = 0
            report["most_active_docs"][source] += 1
            
            # [KR]
            if interaction.get("impact", {}).get("cascade"):
                report["cascade_updates"] += 1
            if interaction.get("impact", {}).get("code_sync"):
                report["code_syncs"] += 1
            if interaction.get("impact", {}).get("restart_required"):
                report["service_restarts"] += 1
        
        # [KR]
        report["most_active_docs"] = dict(
            sorted(report["most_active_docs"].items(),
                   key=lambda x: x[1], reverse=True)[:5]
        )
        
        return report

def main():
    """[KR] [KR] [KR]"""
    print("=" * 60)
    print("[SYSTEM] Living Document Interaction System v2.0")
    print("=" * 60)
    print("\n[KR] [KR] [KR] [KR] [KR] [KR] [KR]")
    print("- [KR] [KR] [KR] [KR] [KR] [KR]")
    print("- [KR] [KR] [KR] [KR]")
    print("- [KR] [KR] [KR] [KR] [KR] [KR]\n")
    
    # [KR] [KR]
    system = LivingDocumentSystem()
    
    # [KR] [KR]
    print("\n[STATUS] [KR] [KR]:")
    print(f"  - [KR] [KR]: {len(system.doc_index)}[KR]")
    print(f"  - [KR] [KR]: {len(system.relations)}[KR]")
    print(f"  - [KR] [KR]: {len(system.interaction_rules)}[KR]")
    print(f"  - [KR] [KR] [KR]: {len(system.code_sync_map)}[KR]")
    
    # Observer [KR]
    observer = Observer()
    
    # [KR] [KR] [KR]
    observer.schedule(system, str(system.docs_path), recursive=False)
    
    # [KR] [KR] [KR] ([KR] [KR])
    for subdir in ["gesture", "nlp", "orchestration"]:
        code_dir = system.base_path / subdir
        if code_dir.exists():
            observer.schedule(system, str(code_dir), recursive=False)
            print(f"  - [KR] [KR]: {subdir}/")
    
    # [KR] start
    observer.start()
    print(f"\n[START] Living Document System [KR]")
    print(f"[PATH] [KR] [KR]: {system.docs_path}")
    print(f"[EXIT] end[KR] Ctrl+C[KR] [KR]\n")
    
    try:
        while True:
            time.sleep(60)  # 1[KR] [KR] [KR]
            
            # [KR] [KR] [KR]
            report = system.generate_interaction_report()
            if report.get("total_interactions", 0) > 0:
                print(f"\n[STATS] [KR] [KR] ([KR] 1[KR]):")
                print(f"  - [KR] [KR]: {report['total_interactions']}[KR]")
                print(f"  - 24[KR] [KR]: {report['last_24h']}[KR]")
                print(f"  - [KR] [KR]: {report['cascade_updates']}[KR]")
                print(f"  - [KR] [KR]: {report['code_syncs']}[KR]")
                
                if report["most_active_docs"]:
                    print(f"  - [KR] [KR] [KR]:")
                    for doc, count in list(report["most_active_docs"].items())[:3]:
                        print(f"    - {doc}: {count}[KR]")
            
    except KeyboardInterrupt:
        observer.stop()
        print("\n\n[STOP] Living Document System end")
        
        # [KR] [KR] [KR]
        final_report = system.generate_interaction_report()
        report_file = system.sync_dir / f"interaction-report-{datetime.now():%Y%m%d-%H%M%S}.json"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(final_report, f, indent=2, ensure_ascii=False)
        
        print(f"[REPORT] [KR] [KR] [KR]: {report_file}")
        print(f"  - [KR] [KR]: {final_report.get('total_interactions', 0)}[KR]")
        print(f"  - [KR] [KR]: {final_report.get('cascade_updates', 0)}[KR]")
        print(f"  - [KR] [KR]: {final_report.get('code_syncs', 0)}[KR]")
    
    observer.join()

if __name__ == "__main__":
    main()
