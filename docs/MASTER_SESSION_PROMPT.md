# 🚀 AI-in-the-Loop Math Education System - Session Initialization Prompt

## 🎯 CRITICAL INSTRUCTIONS FOR CLAUDE

You are working on an advanced AI education system at `C:\palantir\math` with the following ACTIVE CAPABILITIES that you MUST USE:

### 1. 🧠 CLAUDE API ORCHESTRATION (Claudeception)
**ALWAYS USE** the native Claude API orchestration feature:
```javascript
// You can call other Claude instances directly in artifacts/analysis tool
const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        messages: [{role: "user", content: prompt}]
    })
});
```
- Create specialized Claude instances for: Gesture, Math, Visual, Education
- Use parallel processing with Promise.all()
- Implement consensus algorithms for combined responses

### 2. 🔧 MCP (Model Context Protocol) TOOLS
**YOU HAVE ACCESS TO:**
- `memory` - Store/retrieve project knowledge
- `sequential-thinking` - Break down complex problems (USE FOR EVERY COMPLEX TASK)
- `brave-search` - Search for latest tech updates
- `terminal` - Execute commands with Desktop Commander
- `Filesystem` - Read/write project files
- `artifacts` - Create interactive demos

**ADDITIONAL MCP TO INTEGRATE:**
- GitHub MCP (version control)
- Linear MCP (project management)
- Docker MCP (sandboxed execution)
- Slack MCP (team communication)

### 3. 📊 PROJECT STRUCTURE & STATUS
```
C:\palantir\math\
├── orchestration/
│   ├── claude-api-orchestrator.js (597 lines) - REAL Claude API calls
│   ├── advanced-mcp-orchestrator.js (506 lines) - MCP integration
│   └── multi-claude-orchestrator.js (544 lines) - OLD/FAKE - DO NOT USE
├── gesture-service/
│   ├── server.js (397 lines) - µWebSockets server
│   └── server-claude-integrated.js (482 lines) - WITH Claude API
├── models/
│   └── gesture-onnx-model.js (320 lines) - ONNX/TensorFlow
├── server/
│   └── error-handler.js (668 lines) - 85% recovery rate
└── [documentation files]
```

### 4. 🎯 PERFORMANCE TARGETS
- Gesture Recognition: <50ms latency
- Claude API calls: <500ms average
- Error Recovery: >85% automatic
- Parallel Processing: 4x speedup
- Cache Hit Rate: >60%

### 5. 💡 INNOVATION CHECKLIST
When working on ANY feature, ALWAYS:
- [ ] Check if Claude API orchestration can enhance it
- [ ] Use Sequential Thinking MCP for complex problems
- [ ] Search for latest MCP servers and tools
- [ ] Implement parallel processing where possible
- [ ] Add comprehensive error handling
- [ ] Create interactive artifacts for demos
- [ ] Store important data in memory MCP

### 6. 🚨 CRITICAL PATTERNS TO FOLLOW

#### Pattern 1: Always Use Real Claude API
```javascript
// ❌ NEVER use fake WebSocket connections
new WebSocket('wss://claude-gesture.example.com')

// ✅ ALWAYS use real Claude API
await fetch("https://api.anthropic.com/v1/messages", {...})
```

#### Pattern 2: Sequential Thinking for Complex Tasks
```javascript
// For ANY complex problem, use sequential-thinking tool
await sequential-thinking({
    thought: "Breaking down the problem...",
    totalThoughts: 10,
    nextThoughtNeeded: true
});
```

#### Pattern 3: Parallel Claude Specialists
```javascript
// Run multiple Claude instances in parallel
const [gesture, math, visual] = await Promise.all([
    callClaudeSpecialist('gesture', input),
    callClaudeSpecialist('math', input),
    callClaudeSpecialist('visual', input)
]);
```

### 7. 📁 KEY FILES TO REFERENCE
- **Main Orchestrator**: `/orchestration/claude-api-orchestrator.js`
- **Advanced MCP**: `/orchestration/advanced-mcp-orchestrator.js`
- **Error Handler**: `/server/error-handler.js`
- **Status Reports**: `/COMPLETE_INNOVATION_REPORT.md`

### 8. 🎓 PROJECT GOALS
1. **Real-time gesture recognition** for math input
2. **AI-powered problem solving** with step-by-step explanations
3. **Physics simulations** using LOLA (1000x compression)
4. **Knowledge graph** with Neo4j GraphRAG
5. **Multi-modal education** (visual + gesture + text)

### 9. 🔄 WORKFLOW FOR NEW FEATURES

1. **Research First**
   ```
   brave-search: "latest [technology] 2025 features"
   ```

2. **Plan with Sequential Thinking**
   ```
   sequential-thinking: Break down implementation
   ```

3. **Implement with Claude Orchestration**
   ```javascript
   // Use multiple Claude specialists
   ```

4. **Test with Error Handling**
   ```javascript
   // Use error-handler.js patterns
   ```

5. **Document and Save**
   ```
   memory: Store implementation details
   ```

### 10. 🏆 SUCCESS METRICS
- **Innovation Score**: Maintain >90/100
- **Code Quality**: Production-ready
- **Performance**: Meet all latency targets
- **Reliability**: >95% uptime
- **User Experience**: Real-time feedback

## 🚀 IMMEDIATE ACTIONS ON SESSION START

1. **Load Project Context**
   ```bash
   terminal: cd C:\palantir\math
   terminal: list_directory
   ```

2. **Check Recent Work**
   ```
   memory: search_nodes "latest session"
   Filesystem: read_file .checkpoint.json
   ```

3. **Verify Services**
   ```bash
   terminal: node --version
   terminal: docker ps
   ```

4. **Initialize Orchestrators**
   ```javascript
   // Ready to use claude-api-orchestrator.js
   // Ready to use advanced-mcp-orchestrator.js
   ```

## ⚡ REMEMBER
- **YOU CAN** call Claude API directly in artifacts/analysis
- **YOU HAVE** sequential-thinking, memory, search tools
- **YOU MUST** use real API calls, not fake WebSockets
- **YOU SHOULD** parallelize Claude specialists
- **ALWAYS** search for latest features before implementing

**Project Path**: `C:\palantir\math`
**Primary Goal**: AI-powered math education with gesture recognition
**Innovation Level**: Industry-leading (91.6/100)

---

START EVERY SESSION BY READING THIS PROMPT!
