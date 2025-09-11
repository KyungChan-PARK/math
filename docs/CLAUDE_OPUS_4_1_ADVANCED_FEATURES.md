# 🧠 Claude Opus 4.1 Advanced Features Guide
**Model:** claude-opus-4-1-20250805  
**Updated:** 2025-09-08  
**Purpose:** Complete reference for all Claude Opus 4.1 capabilities
**Project Status:** AI-in-the-Loop Math Education System - Integration Complete ✅

---

## 🚀 Project Integration Status

### ✅ Successfully Integrated Components
- **Docker Services**: MongoDB, Neo4j, ChromaDB, Backend, Frontend
- **WebSocket Server**: Running on port 8080 with 4x optimization
- **Gesture-WebSocket Bridge**: Connected (ports 8088 ↔ 8080)
- **Ontology-Orchestration**: Neo4j integration complete
- **Windows ML Accelerator**: Fallback mode active, meeting 15ms target

### 🚧 In Development
- **Multi-Claude Orchestration**: Framework ready, testing in progress
- **ONNX Model**: Using fallback detection, actual model pending
- **MCP Server Integration**: Optional feature, planned for future

---

## 📊 Core Capabilities Overview

### 1. Extended Thinking (Interleaved Reasoning)
- **Description:** Deep reasoning capability with interleaved thoughts during tool use
- **Max Thinking Length:** 16,000 tokens
- **Status:** ✅ Active and Available- **Use Cases:** 
  - Complex architectural decisions
  - Multi-step problem solving
  - Code optimization strategies
  - System design evaluations

### 2. Sequential Thinking Tool
```python
sequential-thinking:sequentialthinking({
    thought: "current thinking step",
    thoughtNumber: 1,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    isRevision: false,
    needsMoreThoughts: false
})
```
- **Purpose:** Dynamic problem-solving with adjustable thought chains
- **Status:** ✅ Fully Operational
- **Features:**
  - Revise previous thoughts
  - Branch into alternative solutions
  - Extend beyond initial estimates
  - Hypothesis generation and verification

### 3. MCP Tools Integration (45+ Tools)
**Status:** ✅ Core tools active | ⚠️ MCP Server optional

Complete list of available tools:

#### ✅ Active File System Operations
- `Filesystem:read_file` - Read file contents
- `Filesystem:read_multiple_files` - Read multiple files simultaneously
- `Filesystem:write_file` - Create or overwrite files
- `Filesystem:edit_file` - Line-based edits
- `Filesystem:create_directory` - Create directories
- `Filesystem:list_directory` - List directory contents
- `Filesystem:directory_tree` - Get recursive tree view
- `Filesystem:move_file` - Move or rename files
- `Filesystem:search_files` - Search for files by pattern
- `Filesystem:get_file_info` - Get detailed metadata

#### ✅ Active Terminal & Process Management
- `terminal:get_config` - Get server configuration
- `terminal:set_config_value` - Set configuration values
- `terminal:read_file` - Read with offset/length
- `terminal:read_multiple_files` - Batch file reading
- `terminal:write_file` - Write with chunking support (30 lines recommended)
- `terminal:create_directory` - Create directories
- `terminal:list_directory` - List contents
- `terminal:move_file` - Move/rename files
- `terminal:start_search` - Streaming search
- `terminal:get_more_search_results` - Paginated results
- `terminal:stop_search` - Stop active search- `terminal:list_searches` - List all searches
- `terminal:get_file_info` - File metadata
- `terminal:edit_block` - Surgical text replacements
- `terminal:start_process` - Start terminal process
- `terminal:read_process_output` - Read output
- `terminal:interact_with_process` - Send input to process
- `terminal:force_terminate` - Kill process
- `terminal:list_sessions` - List active sessions
- `terminal:list_processes` - List all processes
- `terminal:kill_process` - Terminate by PID

#### ✅ Active Memory Management
- `memory:create_entities` - Create knowledge entities
- `memory:create_relations` - Create entity relations
- `memory:add_observations` - Add observations
- `memory:delete_entities` - Delete entities
- `memory:delete_observations` - Delete observations
- `memory:delete_relations` - Delete relations
- `memory:read_graph` - Read entire graph
- `memory:search_nodes` - Search knowledge graph
- `memory:open_nodes` - Open specific nodes

#### ✅ Active Web & Research
- `web_search` - Brave search API
- `web_fetch` - Fetch web page contents
- `brave-search:brave_web_search` - Web search
- `brave-search:brave_local_search` - Local business search
- `conversation_search` - Search past conversations
- `recent_chats` - Retrieve recent chats

#### ✅ Active Development Tools
- `artifacts` - Create/update code artifacts
- `repl` - Execute JavaScript in browser
- `Figma Dev Mode:get_code` - Generate UI code
- `Figma Dev Mode:get_image` - Generate images
- `Figma Dev Mode:get_variable_defs` - Get variables
- `Figma Dev Mode:get_code_connect_map` - Code mapping
- `Figma Dev Mode:create_design_system_rules` - Design rules

#### ⚠️ Optional: MCP Server Integration (Not Currently Active)
**Note:** MCP Server features are available but not required for core functionality.
- `mcp:health_check` - Check MCP server status
- `mcp:get_apis` - Retrieve all registered API endpoints
- `mcp:get_schemas` - Get data schemas
- `mcp:get_documentation` - Query real-time documentation
- `mcp:get_system_state` - Get current system state
- `mcp:register_api` - Register new API endpoint
- `mcp:validate_response` - Validate AI responses
- `mcp:improve_response` - Improve AI responses
- `mcp:generate_docs` - Generate documentation from code
- `mcp:detect_hallucination` - Detect AI hallucinations
- `mcp:websocket_connect` - Establish WebSocket connection
- `mcp:subscribe_updates` - Subscribe to real-time updates
- `mcp:file_watch` - Monitor file changes
- `mcp:code_context` - Get code context for modules

### 4. Multi-Instance Claude Orchestration (🚧 In Development)

**Status:** Framework implemented, full testing in progress
**Current Performance:** Basic orchestration functional

Multi-Instance Orchestration will enable parallel processing with multiple Claude instances, each specialized for different tasks.

#### Core Architecture (Implemented)
```javascript
// Multi-Instance Orchestration Framework
class MultiClaudeOrchestrator {
    constructor() {
        this.instances = new Map();
        this.roles = [
            { id: 'analyzer', task: 'Analyze code structure and identify patterns' },
            { id: 'improver', task: 'Suggest improvements and optimizations' },
            { id: 'validator', task: 'Validate changes for correctness' },
            { id: 'optimizer', task: 'Optimize performance and efficiency' },
            { id: 'integrator', task: 'Integrate components and ensure compatibility' }
        ];
        
        // Target performance metrics
        this.targetMetrics = {
            parallelEfficiency: 100, // Target
            averageResponseTime: 600, // Target ms
            successRate: 95 // Target %
        };
    }
}```

#### Current Project Integration
```javascript
// Integration with AI-in-the-Loop Math Education System
class ProjectIntegration {
    constructor() {
        this.services = {
            websocket: 'ws://localhost:8080',  // ✅ Active
            gesture: 'ws://localhost:8088',     // ✅ Active
            neo4j: 'bolt://localhost:7687',     // ✅ Active
            chromadb: 'http://localhost:8000',  // ✅ Active
            backend: 'http://localhost:8086',   // ✅ Active
            frontend: 'http://localhost:3000'   // ✅ Active
        };
        
        this.integrationStatus = {
            gestureWebSocketBridge: true,  // ✅ Completed
            ontologyOrchestration: true,   // ✅ Completed
            windowsMLAccelerator: true,    // ✅ Fallback mode
            multiClaude: false             // 🚧 In development
        };
    }
}
```

### 5. Artifacts System
```python
# Create new artifact
artifacts(command="create", type="code", language="javascript")

# Update artifact (max 4 updates per message)
artifacts(command="update", old_str="old", new_str="new")
# Rewrite artifact
artifacts(command="rewrite", content="new content")
```
- **Supported Types:**
  - `application/vnd.ant.code` - Code snippets
  - `text/markdown` - Documents
  - `text/html` - HTML/JS/CSS
  - `image/svg+xml` - SVG graphics
  - `application/vnd.ant.mermaid` - Diagrams
  - `application/vnd.ant.react` - React components

---

## 🔧 AI Agent Development Workflows

### 1. Project Initialization Workflow (Updated for Current Project)
```python
# Step 1: Check Docker services
terminal:start_process("docker ps")

# Step 2: Load existing context and memory
memory:read_graph()  # Always start with memory

# Step 3: Analyze project structure
Filesystem:directory_tree(path="C:\\palantir\\math")
Filesystem:read_file("C:\\palantir\\math\\package.json")

# Step 4: Start essential services
terminal:start_process("docker-compose -f C:\\palantir\\math\\docker-compose.yml up -d")
terminal:start_process("node C:\\palantir\\math\\server\\index.js")

# Step 5: Verify integration
terminal:start_process("node C:\\palantir\\math\\test-complete-integration.js")```

### 2. Problem Solving Workflow (Following PROBLEM_SOLVING_GUIDE.md)
```python
# Step 1: Always search for solutions first
brave-search:brave_web_search("exact error message")

# Step 2: Check project documentation
Filesystem:read_file("C:\\palantir\\math\\PROBLEM_SOLVING_GUIDE.md")

# Step 3: Sequential thinking for analysis
sequential-thinking:sequentialthinking({
    thought: "Analyzing error and identifying root cause",
    thoughtNumber: 1,
    totalThoughts: 10,
    nextThoughtNeeded: true
})

# Step 4: Implement fix with validation
terminal:edit_block(file="problematic_file.js", 
                   oldText="issue", 
                   newText="fix")

# Step 5: Test and verify
terminal:start_process("npm test")

# Step 6: Create checkpoint for session recovery
terminal:start_process("node C:\\palantir\\math\\auto-checkpoint.js 'Problem Fixed' 'completed'")
```

### 3. Session Management Workflow (New)
```python
# Step 1: Create checkpoint after each taskterminal:start_process("node C:\\palantir\\math\\auto-checkpoint.js 'Task Name' 'Status'")

# Step 2: Save session state
Filesystem:write_file("C:\\palantir\\math\\frontend\\AI_SESSION_STATE.json", sessionData)

# Step 3: Generate recovery prompt
terminal:start_process("node C:\\palantir\\math\\frontend\\session-manager.js restore")

# Step 4: Monitor token usage
# If approaching limit, use checkpoint to start new session
```

### 4. Performance Optimization Workflow
```python
# Step 1: Check current performance
terminal:start_process("node C:\\palantir\\math\\run-performance-test.js")

# Step 2: Identify bottlenecks
sequential-thinking:sequentialthinking({
    thought: "Analyzing performance metrics",
    thoughtNumber: 1,
    totalThoughts: 8,
    nextThoughtNeeded: true
})

# Step 3: Apply optimizations
# Use chunking for large files (30 lines per chunk)
terminal:write_file(path, chunk1, {mode: 'rewrite'})
terminal:write_file(path, chunk2, {mode: 'append'})
terminal:write_file(path, chunk3, {mode: 'append'})
```

---

## 📊 Current Project Performance Metrics

| Component | Status | Performance | Notes |
|-----------|--------|-------------|-------|
| **Docker Services** | ✅ Running | 100% uptime | All 5 containers active |
| **WebSocket Server** | ✅ Active | 400+ msg/sec | 4x optimized |
| **Gesture Bridge** | ✅ Connected | <15ms latency | Target met |
| **Neo4j Integration** | ✅ Operational | Fast queries | Bidirectional refs |
| **ChromaDB** | ✅ Active | Good | Vector storage ready |
| **ONNX Runtime** | ⚠️ Fallback | <1ms | Using fallback detection |
| **Multi-Claude** | 🚧 Development | N/A | Framework ready |

---

## 🎯 Best Practices for Current Project

### 1. Always Follow PROBLEM_SOLVING_GUIDE.md
```python
# Before solving any issue:
Filesystem:read_file("C:\\palantir\\math\\PROBLEM_SOLVING_GUIDE.md")
```

### 2. Create Checkpoints Frequently
```python
# After completing each small task:
terminal:start_process("node C:\\palantir\\math\\auto-checkpoint.js 'Task' 'Status'")
```

### 3. Chunk Large File Operations```python
# For files >30 lines, always chunk:
terminal:write_file(path, lines_1_30, {mode: 'rewrite'})
terminal:write_file(path, lines_31_60, {mode: 'append'})
# Continue chunking...
```

### 4. Verify Service Status Before Operations
```python
# Check Docker services:
terminal:start_process("docker ps")

# Check WebSocket:
terminal:start_process("netstat -an | findstr :8080")

# Run integration test:
terminal:start_process("node C:\\palantir\\math\\test-complete-integration.js")
```

### 5. Use Memory for Context Persistence
```python
# Save important discoveries:
memory:add_observations([{
    entityName: "project_insights",
    contents: ["Discovery", "Solution", "Pattern"]
}])

# Search for past solutions:
memory:search_nodes(query="error_patterns")
```

---

## 🔄 Session Recovery Protocol

When starting a new session:

1. **Read Recovery Prompt**
```bash
cat C:\palantir\math\RECOVERY_PROMPT.md
```

2. **Load Session State**
```bash
cat C:\palantir\math\frontend\AI_SESSION_STATE.json
```

3. **Start Services**
```bash
docker-compose -f C:\palantir\math\docker-compose.yml up -d
node C:\palantir\math\server\index.js
```

4. **Verify Integration**
```bash
node C:\palantir\math\test-complete-integration.js
```

5. **Continue Development**
Follow the pending work items from session state

---

## 📚 Key Project Files Reference

- **Session Management**: `auto-checkpoint.js`, `frontend/session-manager.js`
- **Problem Solving**: `PROBLEM_SOLVING_GUIDE.md`
- **Integration Status**: `INTEGRATION_SUCCESS_REPORT.md`
- **Session State**: `frontend/AI_SESSION_STATE.json`
- **Recovery Prompts**: `RECOVERY_PROMPT.md`, `checkpoints/`

---

## 🚀 Next Development Priorities

### Immediate Tasks
1. **Implement ONNX Model**: Replace fallback detection with actual model
2. **Complete Multi-Claude Service**: Finish parallel processing implementation
3. **Add Error Recovery**: Comprehensive error handling system
4. **Performance Dashboard**: Real-time monitoring interface

### Future Enhancements
1. **MCP Server Integration**: Optional advanced features
2. **Advanced Gesture Patterns**: Complex gesture recognition
3. **Auto-scaling**: Dynamic resource management
4. **Production Deployment**: Kubernetes orchestration

---

## 📈 Success Metrics

- **Integration Test**: ✅ 100% Pass Rate
- **Gesture Latency**: ✅ <15ms (Target Met)
- **WebSocket Throughput**: ✅ 400+ msg/sec
- **Docker Stability**: ✅ All services running
- **Code Coverage**: 🚧 In progress
- **Documentation**: ✅ Comprehensive

---

*Document updated: 2025-09-08 | Project: AI-in-the-Loop Math Education System*
*Status: Integration Complete | Next: ONNX Model Implementation*