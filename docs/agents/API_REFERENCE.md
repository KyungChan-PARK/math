# API Reference

> Last Updated: 2025-09-09T04:13:40.816Z
> Base URL: http://localhost:8091

## Authentication
Currently no authentication required (development mode).

## Endpoints

### List All Agents
```http
GET /api/agents
```

### List Agents by Category
```http
GET /api/agents?category=math_concepts
```

### Call Specific Agent
```http
POST /api/agent/call
Content-Type: application/json

{
  "agent": "algebraExpert",
  "task": "Solve x^2 + 3x + 2 = 0",
  "options": {
    "maxTokens": 1000
  }
}
```

### Auto-Select Agent
```http
POST /api/agent/auto
Content-Type: application/json

{
  "task": "Draw a triangle",
  "complexity": "medium"
}
```

### Parallel Execution
```http
POST /api/agent/parallel
Content-Type: application/json

{
  "tasks": [
    {
      "agent": "algebraExpert",
      "prompt": "Solve equation",
      "options": {}
    },
    {
      "agent": "geometryExpert",
      "prompt": "Draw shape",
      "options": {}
    }
  ]
}
```

### Sequential Workflow
```http
POST /api/agent/workflow
Content-Type: application/json

{
  "workflow": [
    {
      "agent": "mathConcept",
      "prompt": "Analyze problem"
    },
    {
      "agent": "solutionExplainer",
      "prompt": "Explain solution"
    }
  ]
}
```

## WebSocket API

Connect to: `ws://localhost:8092`

### Message Format
```json
{
  "type": "call|auto|workflow",
  "agent": "agentName",
  "task": "task description",
  "options": {}
}
```

---
*API Version: 1.0.0 | Generated: 2025-09-09T04:13:40.816Z*
