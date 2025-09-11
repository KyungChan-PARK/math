# 📚 API DOCUMENTATION
**Project:** AI-in-the-Loop Math Education System
**Updated:** 2025-09-06
**Version:** 1.0.0

---

## 🌐 Service Endpoints Overview

| Service | Base URL | Port | Status |
|---------|----------|------|--------|
| Backend API | http://localhost:8086 | 8086 | ✅ Active |
| Frontend | http://localhost:3000 | 3000 | ✅ Active |
| MCP Server | http://localhost:3001 | 3001 | ✅ Active (Claude API) |
| MediaPipe Gesture | http://localhost:5000 | 5000 | ✅ Active |
| NLP Server | http://localhost:3000 | 3000 | ✅ Active |
| WebSocket | ws://localhost:8086/ws | 8086 | ✅ Active |
| MCP WebSocket | ws://localhost:3001 | 3001 | ✅ Active (Claude) |
| Claude Orchestrator | http://localhost:8089 | 8089 | ✅ Active |

---

## 🏥 Health Check Endpoints

### Backend Health
```http
GET /api/health
```

### MCP Server Health
```http
GET /mcp/health
```
**Response:**
```json
{
  "status": "healthy",
  "name": "math-education-mcp",
  "version": "1.0.0",
  "connectedClients": 0,
  "cachedDocuments": 5,
  "registeredAPIs": 5
}
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-06T01:34:35.764Z",
  "services": {
    "mongodb": "connected",
    "neo4j": "connected",
    "selfImprovement": "active",
    "documentImprovement": "active",
    "websocket": "0 clients connected"
  },
  "metrics": {
    "nodes": 23,
    "issues": 11,
    "changes": 2,
    "processing": false
  }
}
```

---

## 🤖 Self-Improvement API

### Handle Issues
```http
POST /api/self-improvement/handle
Content-Type: application/json

{
  "issue": {
    "type": "BREAKING_CHANGE",
    "file": "path/to/file.js",
    "message": "Function signature changed"
  }
}
```

### Get Status
```http
GET /api/self-improvement/status
```

### Get Metrics
```http
GET /api/self-improvement/metrics
```
**Response:**
```json
{
  "issuesDetected": 11,
  "issuesFixed": 8,
  "documentsUpdated": 5,
  "performance": {
    "avgFixTime": "2.3s",
    "successRate": "85%"
  }
}
```

### Get History
```http
GET /api/self-improvement/history?limit=10
```

---

## 📄 Document Improvement API

### Analyze Document
```http
POST /api/docs/analyze
Content-Type: application/json

{
  "path": "README.md",
  "type": "markdown",
  "autoFix": true
}
```

### Get Improvement Status
```http
GET /api/docs/improvement/status
```

---

## 🎓 Training & Session API

### Get Training Data
```http
GET /api/training/data?sessionId=xxx&limit=100
```

### Start Session
```http
POST /api/session/start
Content-Type: application/json

{
  "userId": "teacher-001",
  "metadata": {
    "device": "Galaxy Book 4 Pro",
    "touchEnabled": true
  }
}
```
**Response:**
```json
{
  "success": true,
  "sessionId": "fb41dba1-d041-497b-8fe0-6e25a3672d22"
}
```

---

## 🔌 WebSocket API

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8086/ws');
```

### Message Types

#### Interaction Log
```json
{
  "type": "interaction",
  "sessionId": "xxx",
  "data": {
    "gestureType": "tap",
    "position": { "x": 100, "y": 100 },
    "timestamp": 1757090503316
  }
}
```

#### Server Response
```json
{
  "type": "CONNECTED",
  "clientId": "client_1757090503314_mgztclqtq",
  "timestamp": 1757090503314
}
```

---

## 🤖 Claude Orchestrator API

### Base URLs
```
HTTP: http://localhost:8089
WebSocket: ws://localhost:8090
```

### List Agents
```http
GET /agents/list
```
**Response:**
```json
[
  {"name": "mathConcept", "role": "수학 개념 전문가"},
  {"name": "gestureAnalyzer", "role": "제스처 분석 전문가"},
  {"name": "scriptGenerator", "role": "ExtendScript 생성 전문가"},
  {"name": "documentManager", "role": "문서 자동화 전문가"},
  {"name": "performanceOptimizer", "role": "성능 최적화 전문가"}
]
```

### Process Natural Language
```http
POST /nlp/process
Content-Type: application/json

{
  "command": "draw a triangle with 10cm sides"
}
```

### Enhance Gesture
```http
POST /gesture/enhance
Content-Type: application/json

{
  "gesture": "PINCH",
  "value": 0.8,
  "context": "resize"
}
```

---

## 🖐️ MediaPipe Gesture API

### Process Frame
```http
POST http://localhost:5000/process_frame
Content-Type: application/json

{
  "image": "base64_encoded_image"
}
```
**Response:**
```json
{
  "gesture": "PINCH",
  "confidence": 0.95,
  "landmarks": [...],
  "boundingBox": {...}
}
```

### Stream Gestures (SSE)
```http
GET http://localhost:5000/stream
```
Server-Sent Events stream for real-time gesture data.

---

## 🗣️ NLP Server API

### Process Command
```http
POST http://localhost:3000/process
Content-Type: application/json

{
  "text": "삼각형 그려줘",
  "language": "ko"
}
```
**Response:**
```json
{
  "intent": "CREATE_SHAPE",
  "shape": "triangle",
  "parameters": {},
  "extendScript": "// Generated ExtendScript code"
}
```

---

## 📊 Testing Endpoints

### Integration Test
```bash
cd backend && node test-integration.js
```

### WebSocket Test
```bash
cd backend && node test-websocket-connection.js
```

---

## 🔐 Authentication
Currently no authentication required (development mode).

## ⚠️ Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Bad Request | Check request format |
| 404 | Not Found | Verify endpoint path |
| 500 | Internal Server Error | Check server logs |
| 503 | Service Unavailable | Service may be starting |

---

## 📝 Quick Test Commands

```bash
# Health check
curl http://localhost:8086/api/health

# Start session
curl -X POST http://localhost:8086/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"userId": "test"}'

# WebSocket test
wscat -c ws://localhost:8086/ws
```

---

*This document is auto-generated from API routes and maintained by DocumentImprovementService.*

**Last sync:** 2025-09-06 01:50:00


---

## 📡 MCP Server APIs

### Get API Documentation
```http
GET /mcp/apis
```
**Description:** Returns all registered API endpoints with their schemas
**Response:**
```json
[
  {
    "endpoint": "/api/health",
    "method": "GET",
    "description": "Health check endpoint",
    "params": {},
    "response": {
      "status": "string",
      "timestamp": "string",
      "services": "object"
    }
  }
  // ... more APIs
]
```

### Get Schemas
```http
GET /mcp/schemas
```
**Description:** Returns all registered data schemas
**Response:**
```json
[
  {
    "name": "InteractionLog",
    "schema": {
      "type": "object",
      "properties": {
        "timestamp": { "type": "number" },
        "sessionId": { "type": "string" },
        "gestureType": { "type": "string" }
      }
    }
  }
  // ... more schemas
]
```

### Query Documentation
```http
POST /mcp/documentation
Content-Type: application/json

{
  "query": "gesture",
  "context": {
    "module": "interaction"
  }
}
```
**Description:** Search and retrieve relevant documentation
**Response:**
```json
{
  "apis": [...],
  "schemas": [...],
  "examples": [...],
  "relevantDocs": [...],
  "currentState": {...}
}
```

### Get System State
```http
GET /mcp/state
```
**Description:** Returns current MCP server state
**Response:**
```json
{
  "server": {
    "uptime": 3600,
    "memory": {...},
    "clients": 2
  },
  "cache": {
    "documents": 10,
    "apis": 5,
    "schemas": 4
  },
  "timestamp": 1757094028589
}
```

### Register New API
```http
POST /mcp/register-api
Content-Type: application/json

{
  "endpoint": "/api/custom",
  "method": "POST",
  "description": "Custom endpoint",
  "params": {...},
  "response": {...}
}
```
**Description:** Dynamically register a new API endpoint
**Response:**
```json
{
  "success": true,
  "message": "API registered successfully"
}
```

### MCP WebSocket Messages

#### Connection
```javascript
// Connect
ws = new WebSocket('ws://localhost:3001');

// Initial message
{
  "type": "connected",
  "clientId": "mcp-client-xxx",
  "config": {...}
}
```

#### Get Documentation
```javascript
// Request
{
  "type": "get_documentation",
  "payload": { "query": "search term" }
}

// Response
{
  "type": "documentation",
  "data": {...}
}
```

#### Validate AI Response
```javascript
// Request
{
  "type": "validate_ai_response",
  "payload": {
    "response": "AI generated code",
    "context": {...}
  }
}

// Response
{
  "type": "validation_result",
  "data": {
    "valid": boolean,
    "issues": [...],
    "suggestions": [...]
  }
}
```

#### File Change Notifications
```javascript
// Automatic notification
{
  "type": "file_changed",
  "filepath": "/src/services/Service.js",
  "timestamp": 1757094028589
}
```

## Claude Orchestration

AI agents can process this document through the ClaudeService orchestration system.
