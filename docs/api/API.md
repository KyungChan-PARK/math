# API Documentation

## Health Check
- **GET** `/api/health`
  - Returns server health status

## Self-Improvement Endpoints
- **POST** `/api/self-improvement/handle`
  - Handle detected issues automatically
  
- **GET** `/api/self-improvement/status`
  - Get current self-improvement status
  
- **GET** `/api/self-improvement/metrics`
  - Get self-improvement metrics
  
- **GET** `/api/self-improvement/history`
  - Get self-improvement history

## Document Improvement
- **POST** `/api/docs/analyze`
  - Analyze document for improvements
  
- **GET** `/api/docs/improvement/status`
  - Get document improvement status

## WebSocket
- **WS** `ws://localhost:8086/ws`
  - Real-time interaction logging

---
*Last updated: 2025-09-05T16:35:03.577Z*
