# ⚡ Quick Start Guide
> **Version**: 2.0.0 | **Updated**: 2025-09-08 | **Status**: Active | **Next Review**: 2025-09-09

## 📋 Prerequisites

### System Requirements
- **OS**: Windows 11 (Touch support recommended)
- **Node.js**: v20.0.0 or higher
- **Python**: v3.11 or higher
- **Docker**: Docker Desktop latest
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 10GB free space

### Required API Keys
```env
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
MATHPIX_APP_ID=your_mathpix_app_id
MATHPIX_APP_KEY=your_mathpix_app_key
```

## 🚀 Installation

### Option 1: Docker (Recommended)
```bash
# 1. Clone the repository
git clone [repository_url]
cd C:\palantir\math

# 2. Create environment file
copy .env.example .env
# Edit .env with your API keys

# 3. Start all services
docker-compose up -d

# 4. Verify installation
node verify-completion.js
```

### Option 2: Manual Installation
```bash
# 1. Navigate to project
cd C:\palantir\math

# 2. Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# 3. Setup environment
copy .env.example .env
# Edit .env file with your API keys

# 4. Start databases
docker-compose up neo4j mongodb redis chromadb -d

# 5. Start services
npm run start:backend    # Terminal 1
npm run start:frontend   # Terminal 2
npm run start:monitoring # Terminal 3 (optional)
```

## 🔍 Verification

### Health Checks
```bash
# Check backend API
curl http://localhost:8086/api/health

# Check Neo4j
curl http://localhost:7474

# Check frontend
start http://localhost:3000

# Run integration test
node test-complete-integration.js
```

### Expected Output
```json
{
  "status": "healthy",
  "services": {
    "neo4j": "connected",
    "mongodb": "connected",
    "redis": "connected",
    "chromadb": "connected"
  },
  "version": "2.0.0"
}
```

## 🌐 Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Main application UI |
| **Backend API** | http://localhost:8086 | REST API server |
| **WebSocket** | ws://localhost:8089 | Real-time updates |
| **Monitoring** | http://localhost:8081/dashboard | System metrics |
| **Neo4j Browser** | http://localhost:7474 | Graph database UI |

## 🎮 First Steps

### 1. Access the Application
```bash
# Open in browser
start http://localhost:3000
```

### 2. Test Gesture Recognition
- Enable camera permissions
- Try basic gestures:
  - ✋ Open palm - Menu
  - 👆 Point - Select
  - ✌️ Peace - Next
  - 👊 Fist - Cancel

### 3. Create Learning Path
```bash
# Via API
curl -X POST http://localhost:8086/api/learning/path \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "targetConcept": "calculus",
    "level": "beginner"
  }'
```

### 4. Monitor System
```bash
# Open monitoring dashboard
start http://localhost:8081/dashboard
```

## 🔧 Configuration

### Environment Variables
```env
# API Keys (Required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Database URLs (Default values)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
MONGODB_URI=mongodb://localhost:27017/math
REDIS_URL=redis://localhost:6379

# Server Ports (Default values)
BACKEND_PORT=8086
FRONTEND_PORT=3000
WEBSOCKET_PORT=8089
MONITORING_PORT=8081
```

### Docker Configuration
```yaml
# docker-compose.yml adjustments
services:
  math-app:
    environment:
      - NODE_ENV=development  # or 'production'
      - LOG_LEVEL=info        # debug, info, warn, error
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :8086

# Kill process
taskkill /PID [process_id] /F
```

#### Docker Services Not Starting
```bash
# Reset Docker
docker-compose down -v
docker-compose up -d --force-recreate
```

#### Module Not Found
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Neo4j Connection Failed
```bash
# Check Neo4j logs
docker logs math-neo4j

# Reset Neo4j
docker-compose restart neo4j
```

## 📚 Next Steps

After successful installation:

1. **Read Documentation**: See [UNIFIED_DOCUMENTATION.md](./UNIFIED_DOCUMENTATION.md)
2. **Explore API**: Check API Reference <!-- Link pending: UNIFIED_DOCUMENTATION.md#api-reference -->
3. **Run Tests**: Execute `npm test`
4. **Start Developing**: See Development Guide <!-- Link pending: UNIFIED_DOCUMENTATION.md#development-guide -->

## 📸 Using Mathpix OCR

### Process Math Problems from Images
```javascript
// Example: Extract SAT problems
const mathpix = require('./mathpix-integration.js');

// Process an exam paper
await mathpix.processSATExam('sat_exam.pdf');

// Extract equation from image
await mathpix.processImage('equation.png');
```

### Quick Test
```bash
# Test Mathpix integration
node test-mathpix-api.js

# Process a sample exam
node mathpix-integration.js process sample.pdf
```

## 🆘 Support

- **Documentation**: [UNIFIED_DOCUMENTATION.md](./UNIFIED_DOCUMENTATION.md)
- **Troubleshooting**: Troubleshooting Guide <!-- Link pending: UNIFIED_DOCUMENTATION.md#troubleshooting -->
- **Issues**: Check [GitHub Issues](#)

---

**Need more details?** See the complete [Unified Documentation](./UNIFIED_DOCUMENTATION.md)