import os
import hashlib
import json
from pathlib import Path
from collections import defaultdict

def analyze_documents():
    """Analyze all dev-docs for redundancy and create efficient index"""
    
    docs_path = Path(r"C:\palantir\math\dev-docs")
    doc_analysis = {}
    content_hashes = defaultdict(list)
    
    # Read all markdown files
    for md_file in docs_path.glob("*.md"):
        if md_file.name.startswith("."): 
            continue
            
        try:
            content = md_file.read_text(encoding='utf-8')
            
            # Extract key sections
            doc_info = {
                'file': md_file.name,
                'size': len(content),
                'lines': content.count('\n'),
                'hash': hashlib.md5(content.encode()).hexdigest()[:8],
                'topics': extract_topics(content),
                'priority': determine_priority(md_file.name, content)
            }
            
            content_hashes[doc_info['hash']].append(md_file.name)            doc_analysis[md_file.name] = doc_info
            
        except Exception as e:
            print(f"Error reading {md_file.name}: {e}")
    
    # Find duplicates
    duplicates = {h: files for h, files in content_hashes.items() if len(files) > 1}
    
    return doc_analysis, duplicates

def extract_topics(content):
    """Extract main topics from document"""
    topics = []
    
    patterns = {
        'migration': ['migration', 'migrate', 'websocket', 'Windows ML', 'CEP', 'UXP'],
        'gesture': ['gesture', 'recognition', 'hand', 'tracking'],
        'optimization': ['optimization', 'performance', 'benchmark'],
        'architecture': ['architecture', 'design', 'structure'],
        'implementation': ['implementation', 'roadmap', 'plan']
    }
    
    content_lower = content.lower()
    for topic, keywords in patterns.items():
        if any(kw.lower() in content_lower for kw in keywords):
            topics.append(topic)
    
    return topics

def determine_priority(filename, content):
    """Determine document priority for AI agent"""
    
    high_priority = [
        '11-websocket-performance-optimization.md',
        '12-windows-ml-migration.md',
        '10-platform-migration-strategy.md',
        'index.md',
        '01-AGENT-GUIDELINES.md'
    ]
    
    if filename in high_priority:
        return 'HIGH'
    
    if 'gesture' in filename.lower() or 'COMPLETED' in content:
        return 'LOW'
    
    return 'MEDIUM'

def create_efficient_index():
    """Create optimized document index for AI agent"""
    
    analysis, duplicates = analyze_documents()
    
    index = {
        'high_priority': [],
        'medium_priority': [],
        'low_priority': [],
        'duplicates': duplicates,
        'topic_map': defaultdict(list)
    }
    
    for doc, info in analysis.items():
        priority_key = f"{info['priority'].lower()}_priority"
        index[priority_key].append({
            'file': doc,
            'topics': info['topics'],
            'size': info['size']
        })
        
        for topic in info['topics']:
            index['topic_map'][topic].append(doc)
    
    return index

def generate_ai_agent_config(index):
    """Generate optimized configuration for AI agent"""
    
    config = {
        'version': '3.4.0',
        'agent': 'AE Claude Max',
        'workflow': {
            'primary_docs': index['high_priority'][:5],
            'reference_docs': index['medium_priority'][:3],
            'skip_docs': index['low_priority']
        },
        'active_migrations': {
            'uwebsockets': {'progress': 15, 'doc': '11-websocket-performance-optimization.md'},
            'windows_ml': {'progress': 30, 'doc': '12-windows-ml-migration.md'},
            'cep_uxp': {'progress': 60, 'doc': '10-platform-migration-strategy.md'}
        },
        'memory_optimization': {
            'max_docs_in_memory': 5,
            'rotation_strategy': 'LRU',
            'cache_completed': False
        }
    }
    
    return config

if __name__ == "__main__":
    print("Analyzing dev-docs for efficiency...")
    
    index = create_efficient_index()
    config = generate_ai_agent_config(index)
    
    # Save results
    output_path = Path(r"C:\palantir\math\dev-docs\ai-agent-efficient-config.json")
    with open(output_path, 'w') as f:
        json.dump(config, f, indent=2, default=str)
    
    print(f"\nAnalysis complete!")
    print(f"Found {len(index['duplicates'])} duplicate groups")
    print(f"High Priority: {len(index['high_priority'])} docs")
    print(f"Medium Priority: {len(index['medium_priority'])} docs")
    print(f"Low Priority: {len(index['low_priority'])} docs")
    
    print("\nRecommended workflow:")
    for i, doc in enumerate(config['workflow']['primary_docs'][:3], 1):
        print(f"  {i}. {doc['file']}")
    
    print("\nActive Migrations:")
    for name, info in config['active_migrations'].items():
        print(f"  {name}: {info['progress']}% - {info['doc']}")
    
    print(f"\nConfig saved to: {output_path}")