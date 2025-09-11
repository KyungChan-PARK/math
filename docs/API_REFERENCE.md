# 📚 API Reference
> **Version**: 2.0.0 | **Updated**: 2025-09-08 | **Status**: Active | **Next Review**: 2025-09-09

## Quick Navigation
- [Service Endpoints](#service-endpoints)
- [Authentication](#authentication)
- [Core APIs](#core-apis)
- [WebSocket Events](#websocket-events)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## 🌐 Service Endpoints

### Base URLs
```yaml
Production:  https://api.mathlearning.com
Staging:     https://staging-api.mathlearning.com
Development: http://localhost:8086
```

### Service Ports
| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Backend API | 8086 | HTTP/REST | Main API server |
| WebSocket | 8089 | WS | Real-time updates |
| Frontend | 3000 | HTTP | React application |
| Monitoring | 8081 | HTTP | Dashboard |
| Neo4j | 7687 | Bolt | Graph database |
| MongoDB | 27017 | MongoDB | Document store |
| ChromaDB | 8000 | HTTP | Vector database |
| Redis | 6379 | Redis | Cache |

---

## 🔐 Authentication

### API Key Authentication
```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Example Request
```bash
curl -X GET http://localhost:8086/api/user/profile \
  -H "Authorization: Bearer sk-abc123..." \
  -H "Content-Type: application/json"
```

---

## 📡 Core APIs

### Health & Status

#### System Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2025-09-08T10:00:00Z",
  "services": {
    "neo4j": "connected",
    "mongodb": "connected",
    "redis": "connected",
    "chromadb": "connected"
  },
  "uptime": 123456,
  "metrics": {
    "cpu": "45%",
    "memory": "2.1GB",
    "requests": 15234
  }
}
```

#### Service Status
```http
GET /api/status
```

**Response:**
```json
{
  "operational": true,
  "services": [
    {"name": "api", "status": "online"},
    {"name": "websocket", "status": "online"},
    {"name": "database", "status": "online"}
  ]
}
```

### User Management

#### Create User Profile
```http
POST /api/users/create
```

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "level": "beginner",
  "preferences": {
    "difficulty": 3,
    "learningSpeed": "normal",
    "topics": ["algebra", "geometry"]
  }
}
```

**Response:**
```json
{
  "userId": "usr_abc123",
  "username": "john_doe",
  "created": "2025-09-08T10:00:00Z",
  "profile": {
    "level": "beginner",
    "knownConcepts": [],
    "completedLessons": 0
  }
}
```

#### Get User Profile
```http
GET /api/users/:userId
```

**Response:**
```json
{
  "userId": "usr_abc123",
  "username": "john_doe",
  "level": "intermediate",
  "progress": {
    "completedConcepts": 45,
    "totalTime": 1234,
    "currentStreak": 7
  }
}
```

### Learning Path

#### Generate Learning Path
```http
POST /api/learning/path
```

**Request Body:**
```json
{
  "userId": "usr_abc123",
  "targetConcept": "calculus",
  "options": {
    "maxSteps": 10,
    "includePrerequisites": true,
    "adaptiveDifficulty": true
  }
}
```

**Response:**
```json
{
  "pathId": "path_xyz789",
  "userId": "usr_abc123",
  "targetConcept": "calculus",
  "steps": [
    {
      "order": 1,
      "concept": "limits",
      "type": "prerequisite",
      "difficulty": 4,
      "estimatedTime": 30,
      "resources": ["video_1", "quiz_1"]
    },
    {
      "order": 2,
      "concept": "derivatives",
      "type": "core",
      "difficulty": 5,
      "estimatedTime": 45,
      "resources": ["lesson_1", "practice_1"]
    }
  ],
  "totalEstimatedTime": 240,
  "difficulty": 5
}
```

#### Get Next Recommendation
```http
GET /api/learning/next/:userId
```

**Response:**
```json
{
  "concept": "integration",
  "reason": "Next step in calculus path",
  "difficulty": 6,
  "estimatedTime": 40,
  "prerequisites": ["derivatives"],
  "resources": [
    {
      "type": "video",
      "url": "/resources/integration_intro.mp4",
      "duration": 15
    }
  ]
}
```

### Gesture Processing

#### Process Gesture
```http
POST /api/gesture/process
```

**Request Body:**
```json
{
  "gesture": "circle",
  "confidence": 0.95,
  "timestamp": "2025-09-08T10:00:00Z",
  "keypoints": [
    {"x": 0.5, "y": 0.3, "z": 0.1},
    {"x": 0.6, "y": 0.4, "z": 0.1}
  ]
}
```

**Response:**
```json
{
  "recognized": true,
  "concept": "integral",
  "confidence": 0.92,
  "action": "display_formula",
  "formula": "∫f(x)dx",
  "related": ["derivative", "area", "accumulation"]
}
```

### Knowledge Graph

#### Query Concepts
```http
POST /api/graph/query
```

**Request Body:**
```json
{
  "query": "find concepts related to calculus",
  "limit": 10,
  "depth": 2
}
```

**Response:**
```json
{
  "results": [
    {
      "concept": "derivatives",
      "relationship": "PART_OF",
      "distance": 1
    },
    {
      "concept": "limits",
      "relationship": "PREREQUISITE",
      "distance": 1
    }
  ],
  "totalFound": 15,
  "queryTime": 23
}
```

#### Hybrid Search (GraphRAG)
```http
POST /api/search/hybrid
```

**Request Body:**
```json
{
  "query": "integration techniques",
  "options": {
    "includeVectors": true,
    "includeGraph": true,
    "maxResults": 5
  }
}
```

**Response:**
```json
{
  "results": {
    "vector": [
      {"concept": "u-substitution", "score": 0.89},
      {"concept": "integration by parts", "score": 0.85}
    ],
    "graph": [
      {"concept": "definite integrals", "connections": 12},
      {"concept": "antiderivatives", "connections": 8}
    ],
    "hybrid": [
      {"concept": "integration by parts", "totalScore": 0.92}
    ]
  },
  "metrics": {
    "responseTime": 45,
    "vectorCount": 2,
    "graphCount": 2
  }
}
```

### Progress Tracking

#### Update Progress
```http
POST /api/progress/update
```

**Request Body:**
```json
{
  "userId": "usr_abc123",
  "conceptName": "derivatives",
  "completed": true,
  "timeSpent": 45,
  "score": 85
}
```

**Response:**
```json
{
  "success": true,
  "progress": {
    "totalCompleted": 23,
    "currentStreak": 5,
    "nextConcept": "integration"
  }
}
```

---

## 🔌 WebSocket Events

### Connection
```javascript
const socket = io('ws://localhost:8089');

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});
```

### Client → Server Events

#### Subscribe to Updates
```javascript
socket.emit('subscribe', {
  userId: 'usr_abc123',
  channels: ['progress', 'recommendations']
});
```

#### Send Gesture Data
```javascript
socket.emit('gesture', {
  type: 'circle',
  confidence: 0.95,
  keypoints: [...]
});
```

#### Request Help
```javascript
socket.emit('requestHelp', {
  concept: 'derivatives',
  context: 'stuck_on_problem'
});
```

### Server → Client Events

#### Concept Update
```javascript
socket.on('conceptUpdate', (data) => {
  // data: { concept, action, details }
});
```

#### Progress Notification
```javascript
socket.on('progressUpdate', (data) => {
  // data: { completed, nextStep, achievement }
});
```

#### Real-time Metrics
```javascript
socket.on('metrics', (data) => {
  // data: { cpu, memory, requests, latency }
});
```

---

## ⚠️ Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found",
    "details": {
      "userId": "usr_invalid"
    },
    "timestamp": "2025-09-08T10:00:00Z"
  }
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Missing or invalid auth |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily down |

---

## 🚦 Rate Limiting

### Default Limits
```yaml
Anonymous:     60 requests/hour
Authenticated: 600 requests/hour
Premium:       6000 requests/hour
```

### Rate Limit Headers
```http
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 543
X-RateLimit-Reset: 1704537600
```

### Handling Rate Limits
```javascript
// Example retry logic
async function apiCall(url, options, retries = 3) {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      await sleep(retryAfter * 1000);
      return apiCall(url, options, retries - 1);
    }
    
    return response.json();
  } catch (error) {
    if (retries > 0) {
      await sleep(1000);
      return apiCall(url, options, retries - 1);
    }
    throw error;
  }
}
```

---

## 📝 Response Codes

### Success Codes
| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 202 | Accepted - Request accepted for processing |
| 204 | No Content - Request successful, no content |

### Client Error Codes
| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid request format |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource conflict |
| 429 | Too Many Requests - Rate limited |

### Server Error Codes
| Code | Description |
|------|-------------|
| 500 | Internal Server Error |
| 502 | Bad Gateway |
| 503 | Service Unavailable |
| 504 | Gateway Timeout |

---

## 🔍 Testing Endpoints

### Postman Collection
Download: [Math Learning API.postman_collection.json](#)

### cURL Examples
```bash
# Health check
curl http://localhost:8086/api/health

# Create user
curl -X POST http://localhost:8086/api/users/create \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com"}'

# Generate learning path
curl -X POST http://localhost:8086/api/learning/path \
  -H "Content-Type: application/json" \
  -d '{"userId":"usr_123","targetConcept":"calculus"}'
```

---

## 📸 Mathpix OCR Endpoints

### Process Image/PDF
```http
POST /api/mathpix/process
```

**Description**: Extract math equations and text from images or PDFs

**Request Body:**
```json
{
  "image": "base64_encoded_image_or_pdf",
  "options": {
    "formats": ["text", "latex", "mathml"],
    "ocr": ["math", "text"],
    "language": ["en", "ko"]
  }
}
```

**Response:**
```json
{
  "text": "Solve for x: x^2 + 5x + 6 = 0",
  "latex": "$x^2 + 5x + 6 = 0$",
  "confidence": 0.95,
  "timestamp": "2025-09-08T10:00:00Z"
}
```

### Extract SAT Problems
```http
POST /api/mathpix/extract-sat
```

**Description**: Extract and categorize SAT problems from exam papers

**Request Body:**
```json
{
  "file_path": "/path/to/sat_exam.pdf",
  "options": {
    "autoCategorie": true,
    "assessDifficulty": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "problemCount": 52,
  "problems": [
    {
      "id": "SAT_2025_001",
      "number": 1,
      "question": "If x + 3 = 7, what is x?",
      "category": "ALGEBRA",
      "difficulty": 1,
      "choices": ["A) 3", "B) 4", "C) 5", "D) 6"]
    }
  ],
  "report": {
    "byCategory": {
      "ALGEBRA": 15,
      "GEOMETRY": 12,
      "STATISTICS": 10,
      "CALCULUS": 15
    },
    "byDifficulty": {
      "1": 10, "2": 15, "3": 12, "4": 10, "5": 5
    }
  }
}
```

### Search Similar Problems
```http
POST /api/mathpix/search-similar
```

**Description**: Find similar problems based on content

**Request Body:**
```json
{
  "query": "quadratic equation",
  "options": {
    "category": "ALGEBRA",
    "difficulty": 3,
    "limit": 5
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "SAT_2025_042",
      "question": "Solve x^2 - 4x + 3 = 0",
      "similarity": 0.92,
      "category": "ALGEBRA",
      "difficulty": 3
    }
  ]
}
```

---

## 📚 Additional Resources

- [Unified Documentation](./UNIFIED_DOCUMENTATION.md)
- WebSocket Guide <!-- Link pending: UNIFIED_DOCUMENTATION.md#websocket-events -->
- Error Handling Best Practices <!-- Link pending: UNIFIED_DOCUMENTATION.md#error-handling -->
- API Changelog <!-- Link pending: CHANGELOG.md -->

---

**Note**: This API reference is part of the unified documentation system. For complete system documentation, see [UNIFIED_DOCUMENTATION.md](./UNIFIED_DOCUMENTATION.md)