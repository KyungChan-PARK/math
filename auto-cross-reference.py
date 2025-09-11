"""
Document Cross-Reference Automation
Created: 2025-01-26
Purpose: Auto-update documents with cross-references based on Neo4j relationships
"""

from neo4j import GraphDatabase
import re
from pathlib import Path
from datetime import datetime

class DocumentCrossReferencer:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            'neo4j://localhost:7687',
            auth=('neo4j', 'aeclaudemax')
        )
        self.docs_path = Path(r'C:\palantir\math\dev-docs')
        
    def get_document_relationships(self):
        """Get all document relationships from Neo4j"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (d1:Document)-[r]->(d2:Document)
                RETURN d1.id as from_id, d1.name as from_name,
                       type(r) as relationship,
                       d2.id as to_id, d2.name as to_name
                ORDER BY d1.id, d2.id
            """)
            
            relationships = {}
            for record in result:
                from_id = record['from_id']
                if from_id not in relationships:
                    relationships[from_id] = []
                relationships[from_id].append({
                    'to_id': record['to_id'],
                    'to_name': record['to_name'],
                    'type': record['relationship']
                })
            
            return relationships
    
    def update_document_references(self, doc_id, doc_name, related_docs):
        """Update a document with cross-references"""
        doc_path = self.docs_path / f"{doc_id}-{doc_name}.md"
        
        if not doc_path.exists():
            print(f"  WARNING: Document not found: {doc_path}")
            return
        
        with open(doc_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove old cross-reference section if exists
        pattern = r'##  Related Documents.*?(?=##|\Z)'
        content = re.sub(pattern, '', content, flags=re.DOTALL)
        
        # Create new cross-reference section
        ref_section = "\n##  Related Documents\n\n"
        ref_section += f"*Auto-generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}*\n\n"
        
        for rel in related_docs:
            ref_section += f"- **[{rel['to_id']}-{rel['to_name']}]**"
            ref_section += f" ({rel['type'].replace('_', ' ').title()})\n"
            ref_section += f"  - Path: `./{rel['to_id']}-{rel['to_name']}.md`\n"
        
        # Add cross-references at the end
        if not content.endswith('\n'):
            content += '\n'
        content += ref_section
        
        with open(doc_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  OK Updated {doc_id}-{doc_name} with {len(related_docs)} references")
    
    def process_all_documents(self):
        """Process all documents and add cross-references"""
        print("[INFO] Adding cross-references to all documents...")
        
        relationships = self.get_document_relationships()
        
        # Get all document info
        with self.driver.session() as session:
            result = session.run("MATCH (d:Document) RETURN d.id as id, d.name as name")
            documents = [(r['id'], r['name']) for r in result]
        
        # Update each document
        updated_count = 0
        for doc_id, doc_name in documents:
            if doc_id in relationships:
                self.update_document_references(doc_id, doc_name, relationships[doc_id])
                updated_count += 1
            else:
                print(f"  INFO: {doc_id}-{doc_name} has no outgoing relationships")
        
        print(f"\n[OK] Updated {updated_count} documents with cross-references")
        
        # Add VIDEO-MOTION-EXTRACTION relationship
        self.fix_isolated_documents()
    
    def fix_isolated_documents(self):
        """Fix documents with no connections"""
        with self.driver.session() as session:
            # Find isolated documents
            result = session.run("""
                MATCH (d:Document)
                WHERE NOT exists((d)-[]-())
                RETURN d.id as id, d.name as name
            """)
            
            isolated = result.data()
            if isolated:
                print(f"\n[FIX] Fixing {len(isolated)} isolated documents...")
                
                # Connect VIDEO-MOTION to GESTURE and NLP
                session.run("""
                    MATCH (v:Document {id: '05'}),
                          (g:Document {id: '04'}),
                          (n:Document {id: '03'})
                    CREATE (v)-[:PROVIDES_INPUT_TO]->(g)
                    CREATE (v)-[:ANALYZED_BY]->(n)
                """)
                
                print("  OK Connected VIDEO-MOTION-EXTRACTION to system")
        
        self.driver.close()

if __name__ == "__main__":
    referencer = DocumentCrossReferencer()
    referencer.process_all_documents()
    print("\n[DONE] Cross-reference automation complete!")
