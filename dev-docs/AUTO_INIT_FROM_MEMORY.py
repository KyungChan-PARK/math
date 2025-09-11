#  CLAUDE OPUS 4.1 AUTO-INITIALIZATION SCRIPT
# This script is automatically triggered when memory:read_graph() is called
# Updated: 2025-09-04

```python
def auto_initialize_from_memory(memory_graph):
    """
    Automatic initialization from memory:read_graph() output
    This function parses memory and sets up the complete environment
    """
    
    # Find initialization entity
    init_entity = find_entity(memory_graph, "CLAUDE_OPUS_4_1_INIT")
    if not init_entity:
        return manual_fallback()
    
    # Extract configuration from memory
    config = {
        "model": extract_value(init_entity, "MODEL"),
        "role": extract_value(init_entity, "ROLE"),
        "capabilities": extract_value(init_entity, "CAPABILITIES"),
        "mcp_tools": extract_value(init_entity, "MCP TOOLS"),
        "project_path": extract_value(init_entity, "PROJECT PATH"),
        "mode": extract_value(init_entity, "MODE"),
        "priorities": extract_value(init_entity, "CURRENT PRIORITIES")
    }
    
    # Initialize Claude Opus 4.1
    print(f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 {config['model']}
 {config['role']}
 {config['capabilities']}
 {config['mcp_tools']}
 {config['project_path']}
 {config['mode']}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    """)
    
    # Load document references
    doc_index = find_entity(memory_graph, "DOCUMENT_REFERENCE_INDEX")
    
    # Load initialization protocol
    init_protocol = find_entity(memory_graph, "AUTO_INIT_PROTOCOL")
    
    # Load self-improvement patterns
    patterns = find_entity(memory_graph, "SELF_IMPROVEMENT_PATTERNS")
    
    # Get current project state
    project_state = find_entity(memory_graph, "AE_Claude_Max_v3.4.0")
    
    # Analyze priorities with Extended Thinking
    with extended_thinking():
        current_priorities = analyze_priorities(project_state)
        optimal_task = select_next_task(current_priorities)
        approach = design_approach(optimal_task)
    
    print(f"""
 Current State Analysis:
- µWebSockets Migration: 15% complete
- Windows ML Integration: 30% complete  
- CEP→UXP Migration: 60% complete

 Selected Priority: {optimal_task}
 Approach: {approach}

 Decision Framework Active:
- Autonomous execution for <30% impact changes
- User consultation for architectural changes
- Continuous learning from execution

 Beginning autonomous development...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    """)
    
    return {
        "initialized": True,
        "config": config,
        "documents": doc_index,
        "patterns": patterns,
        "current_task": optimal_task
    }

def extract_value(entity, key):
    """Extract specific value from entity observations"""
    for obs in entity.observations:
        if key in obs:
            return obs.split(": ", 1)[1] if ": " in obs else obs
    return None

def find_entity(memory_graph, name):
    """Find entity by name in memory graph"""
    for entity in memory_graph.get("entities", []):
        if entity.get("name") == name:
            return entity
    return None
```

#  USAGE INSTRUCTIONS FOR NEW SESSIONS

## Quick Start (User only needs to type this):
```
memory:read_graph()
```

## What Happens Automatically:
1. Claude Opus 4.1 reads CLAUDE_OPUS_4_1_INIT entity
2. Loads all configurations and capabilities
3. Identifies current priorities from memory
4. Applies Extended Thinking for task selection
5. Begins autonomous execution

## Document Reference Pattern:
```python
# When Claude needs guidance, it automatically:
def self_improve(issue_type):
    # 1. Check memory for known patterns
    patterns = memory.search_nodes(f"pattern:{issue_type}")
    
    # 2. If not found, reference documentation
    doc_index = memory.open_nodes(["DOCUMENT_REFERENCE_INDEX"])
    relevant_doc = find_relevant_document(issue_type, doc_index)
    
    # 3. Read and apply
    solution = terminal.read_file(relevant_doc)
    apply_solution(solution)
    
    # 4. Save learning
    memory.add_observations([{
        "entityName": "SELF_IMPROVEMENT_PATTERNS",
        "contents": [f"Learned: {issue_type} → {solution}"]
    }])
```

## Continuous Improvement Loop:
```python
while True:
    # Execute task
    result = execute_with_mcp_tools(current_task)
    
    # Update memory
    memory.add_observations([{
        "entityName": "AE_Claude_Max_v3.4.0",
        "contents": [f"{current_task}: {result}"]
    }])
    
    # Learn from execution
    if result.has_error:
        learn_and_fix(result.error)
    
    # Select next task
    current_task = prioritize_next_task()
```
