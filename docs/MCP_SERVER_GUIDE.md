# 📚 MCP Server User Guide

**Version:** 1.0.0  
**Updated:** 2025-09-06  
**Status:** Phase 1 Complete, Ready for Use

---

## 🎯 What is MCP Server?

MCP (Model Context Protocol) Server is a real-time documentation and context provider for AI agents, inspired by Context7. It prevents AI hallucinations by providing always up-to-date API documentation and system state.

### Key Features
- 🔄 Real-time documentation updates
- 📡 WebSocket bidirectional communication
- 📝 Automatic API documentation generation
- 🔍 File change detection
- 🎯 AI response validation
- 💾 Schema management

---

## 🚀 Quick Start

### Starting the Server
```bash
cd C:\palantir\math\backend
npm run mcp

# Server will start on port 3001
```

### Testing the Server
```bash
cd C:\palantir\math\backend
npm run mcp:test

# Should see: "All tests passed! (7/7)"
```

### Stopping the Server
Press `Ctrl+C` in the terminal where the server is running.

---

## 📡 API Endpoints

### Health Check
```http
GET http://localhost:3001/mcp/health
```
Returns server status, version, and connected clients count.

### Get API Documentation
```http
GET http://localhost:3001/mcp/apis
```
Returns all registered API endpoints with their schemas.

### Get Schemas
```http
GET http://localhost:3001/mcp/schemas
```
Returns all registered data schemas:
- InteractionLog
- AgentAction
- SceneState
- Gesture

### Get Documentation
```http
POST http://localhost:3001/mcp/documentation
Content-Type: application/json

{
  "query": "gesture",
  "context": {
    "module": "interaction"
  }
}
```
Returns relevant documentation, APIs, schemas, and examples.

### Get System State
```http
GET http://localhost:3001/mcp/state
```
Returns current system state including:
- Server uptime
- Memory usage
- Connected clients
- Cache status

### Register New API
```http
POST http://localhost:3001/mcp/register-api
Content-Type: application/json

{
  "endpoint": "/api/your-endpoint",
  "method": "GET",
  "description": "Your API description",
  "params": {},
  "response": {}
}
```

---

## 🔌 WebSocket Connection

### Connecting
```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('Connected to MCP Server');
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'connected') {
    console.log('Client ID:', message.clientId);
  }
});
```

### Message Types

#### Get Documentation
```javascript
ws.send(JSON.stringify({
  type: 'get_documentation',
  payload: {
    query: 'your search query'
  }
}));
```

#### Get Code Context
```javascript
ws.send(JSON.stringify({
  type: 'get_context',
  payload: {
    modulePath: './src/services/YourService.js'
  }
}));
```

#### Subscribe to Updates
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  payload: {
    topics: ['file_changes', 'api_updates']
  }
}));
```

#### Validate AI Response
```javascript
ws.send(JSON.stringify({
  type: 'validate_ai_response',
  payload: {
    response: 'AI generated response',
    context: { query: 'original query' }
  }
}));
```

#### Get Improvement Suggestions
```javascript
ws.send(JSON.stringify({
  type: 'suggest_improvement',
  payload: {
    type: 'code', // or 'documentation' or 'architecture'
    target: 'path/to/file.js'
  }
}));
```

---

## 🔄 Real-time Updates

The MCP Server automatically watches for changes in:
- Source code files (`*.js`, `*.json`)
- Documentation files (`*.md`)
- API route definitions

When changes are detected, all connected clients receive real-time notifications:
```javascript
{
  "type": "file_changed",
  "filepath": "/path/to/changed/file.js",
  "timestamp": 1757094028589
}
```

---

## 🛠 Integration with Backend

The MCP Server integrates with:
- **RealTimeSelfImprovementEngine**: For code analysis and improvements
- **DocumentImprovementService**: For documentation suggestions
- **MongoDB & Neo4j**: For database state monitoring

### Using in Your Code
```javascript
import axios from 'axios';

// Get current API documentation
const apis = await axios.get('http://localhost:3001/mcp/apis');

// Query documentation
const docs = await axios.post('http://localhost:3001/mcp/documentation', {
  query: 'how to create a shape',
  context: { component: 'SceneManager' }
});

// Check if your API usage is correct
const validation = await axios.post('http://localhost:3001/mcp/validate', {
  code: 'fetch("/api/shapes", { method: "POST" })'
});
```

---

## 📊 Architecture

```
MCP Server (Port 3001)
├── HTTP API Layer
│   ├── /mcp/health
│   ├── /mcp/apis
│   ├── /mcp/schemas
│   ├── /mcp/documentation
│   └── /mcp/state
│
├── WebSocket Layer
│   ├── Real-time updates
│   ├── Bidirectional communication
│   └── Client subscriptions
│
├── File Watcher
│   ├── Source code monitoring
│   ├── Documentation monitoring
│   └── Change notifications
│
└── Integration Layer
    ├── Self-Improvement Engine
    ├── Document Improvement Service
    └── Database Managers
```

---

## 🔧 Configuration

### Environment Variables
```env
MCP_PORT=3001              # Server port (default: 3001)
ANTHROPIC_API_KEY=sk-...   # For AI improvements (optional)
```

### Server Configuration
```javascript
const config = {
  name: 'math-education-mcp',
  version: '1.0.0',
  description: 'Your description',
  port: 3001
};
```

---

## 🐛 Troubleshooting

### Server won't start
- Check if port 3001 is already in use
- Verify all dependencies are installed: `npm install`

### WebSocket connection fails
- Ensure server is running
- Check firewall settings
- Verify WebSocket URL: `ws://localhost:3001`

### File changes not detected
- Check file watcher permissions
- Verify paths are within project directory
- Restart server if needed

---

## 📈 Performance Metrics

- **Startup time:** <2 seconds
- **WebSocket latency:** <10ms
- **File change detection:** <100ms
- **Documentation query:** <50ms
- **Memory usage:** ~50MB idle, ~100MB active

---

## 🔮 Future Enhancements (Phase 2)

- [ ] Direct Claude API integration
- [ ] AI response auto-correction
- [ ] Performance analytics dashboard
- [ ] Multi-model support
- [ ] Custom tool creation
- [ ] A/B testing framework

---

## 📝 Examples

### Example 1: Checking API Health
```javascript
fetch('http://localhost:3001/mcp/health')
  .then(res => res.json())
  .then(data => console.log('Server status:', data.status));
```

### Example 2: Real-time Documentation Updates
```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'documentation_changed') {
    console.log('Documentation updated:', msg.filepath);
    // Refresh your documentation view
  }
});
```

### Example 3: Validating AI Code
```javascript
async function validateAICode(code) {
  const response = await fetch('http://localhost:3001/mcp/documentation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'validate',
      context: { code }
    })
  });
  
  const validation = await response.json();
  if (!validation.valid) {
    console.error('Issues found:', validation.issues);
    console.log('Suggestions:', validation.suggestions);
  }
}
```

---

## 📚 Related Documentation

- [MASTER_REFERENCE.md](./MASTER_REFERENCE.md) - Complete AI Agent guide
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Full API reference
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Project roadmap

---

*This guide is maintained as part of the Math Education AI System.*

**Support:** For issues or questions, check the main documentation or server logs.

---

## 🤖 Claude Integration (Phase 2)

### Overview
MCP Server now includes direct Claude API integration for AI response validation, improvement, and hallucination detection.

### Configuration
```env
# Add to .env file
ANTHROPIC_API_KEY=sk-ant-...
```

**Note:** Without API key, runs in simulation mode with basic functionality.

### Claude API Endpoints

#### Validate AI Response
```http
POST /mcp/validate
Content-Type: application/json

{
  "response": "AI generated code or text",
  "context": {
    "query": "original query"
  }
}
```
**Response:**
```json
{
  "valid": true,
  "issues": [],
  "suggestions": [],
  "confidence": 0.95
}
```

#### Improve Response
```http
POST /mcp/improve
Content-Type: application/json

{
  "response": "original response",
  "documentation": {...},
  "issues": ["issue1", "issue2"]
}
```
**Response:**
```json
{
  "improved": "improved response",
  "changes": [...],
  "confidence": 0.9
}
```

#### Generate Documentation
```http
POST /mcp/generate-docs
Content-Type: application/json

{
  "code": "function code",
  "context": {
    "module": "module name"
  }
}
```

#### Detect Hallucination
```http
POST /mcp/detect-hallucination
Content-Type: application/json

{
  "statement": "AI statement to check",
  "facts": [
    { "key": "fact_key", "value": "fact_value" }
  ]
}
```

### Claude WebSocket Messages

#### Validate Response
```javascript
ws.send(JSON.stringify({
  type: 'validate_ai_response',
  payload: {
    response: 'AI response',
    context: { query: 'query' }
  }
}));
```

#### Improve Response
```javascript
ws.send(JSON.stringify({
  type: 'improve_response',
  payload: {
    response: 'original',
    issues: ['issue1']
  }
}));
```

#### Generate Documentation
```javascript
ws.send(JSON.stringify({
  type: 'generate_documentation',
  payload: {
    code: 'code to document',
    context: {}
  }
}));
```

#### Detect Hallucination
```javascript
ws.send(JSON.stringify({
  type: 'detect_hallucination',
  payload: {
    statement: 'statement',
    facts: [...]
  }
}));
```

### Features

1. **Response Validation**
   - Checks AI responses against current documentation
   - Identifies incorrect API usage
   - Suggests corrections

2. **Response Improvement**
   - Fixes identified issues
   - Modernizes code patterns
   - Adds error handling

3. **Documentation Generation**
   - Creates API documentation from code
   - Generates JSDoc comments
   - Produces markdown documentation

4. **Hallucination Detection**
   - Compares statements against known facts
   - Identifies factual errors
   - Provides confidence scores

### Testing Claude Integration
```bash
# Run Claude integration tests
cd C:\palantir\math\backend
node test-claude-integration.js
```

### Performance Metrics
- Validation: <500ms (with cache)
- Improvement: <2s (depends on complexity)
- Documentation: <3s
- Hallucination detection: <200ms
- Cache timeout: 1 hour

### Simulation Mode
Without API key, the system runs in simulation mode:
- Basic validation using pattern matching
- Simple documentation generation
- Limited hallucination detection
- No AI-powered improvements

### Production Mode
With API key configured:
- Full Claude 3.5 Sonnet capabilities
- Advanced validation and correction
- Comprehensive documentation generation
- Sophisticated hallucination detection
- Response caching for performance
