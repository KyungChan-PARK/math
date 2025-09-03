# 🚀 AE Claude Max v3.2 - Complete Implementation Roadmap
**Real-time Natural Language Motion Graphics System**
*Created: 2025-01-22*

## 📋 Executive Summary

This roadmap provides a **step-by-step implementation guide** for building a real-time, bidirectional natural language interface for After Effects. Every step includes concrete code, specific files to create, and validation criteria.

## 🎯 Project Goals

1. **Real-time natural language control** of After Effects
2. **Bidirectional translation** between human language and AE states
3. **Interactive shape manipulation** through conversation
4. **Zero-latency response** for simple operations
5. **Learning system** that improves with use

## 📁 Project Structure

```
AE_Claude_Max_Project/
├── server/                      # Backend services
│   ├── websocket-server.js     # Main WebSocket server
│   ├── nlp-engine.js           # Natural language processor
│   ├── script-generator.js     # ExtendScript generator
│   ├── ae-bridge.js            # After Effects communication
│   └── state-manager.js        # State synchronization
├── cep-extension/              # After Effects panel
│   ├── CSXS/
│   │   └── manifest.xml        # Extension configuration
│   ├── index.html              # Panel UI
│   ├── css/
│   │   └── styles.css          # Panel styling
│   └── js/
│       ├── main.js             # Panel logic
│       └── ae-interface.js    # AE communication
├── scripts/                    # ExtendScript templates
│   ├── templates/              # Reusable script templates
│   └── utilities/              # Helper functions
├── ai-agents/                  # AI agent implementations
│   ├── vibe-coding.js         # Vibe coding agent
│   ├── motion-analyzer.js     # Motion analysis agent
│   └── composition-builder.js # Composition agent
└── tests/                      # Test suites
    ├── unit/                   # Unit tests
    ├── integration/            # Integration tests
    └── e2e/                    # End-to-end tests
```

## 🔧 Phase 1: Core Infrastructure (Days 1-3)

### Day 1: WebSocket Server Setup

#### 1.1 Create WebSocket Server
```javascript
// server/websocket-server.js
const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');

class AERealtimeServer {
    constructor(port = 8080) {
        this.app = express();
        this.setupMiddleware();
        this.server = this.app.listen(port);
        this.wss = new WebSocket.Server({ server: this.server });
        this.clients = new Map();
        this.initialize();
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'running',
                clients: this.clients.size,
                uptime: process.uptime()
            });
        });
    }
    
    initialize() {
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            this.clients.set(clientId, {
                socket: ws,
                connected: Date.now(),
                context: {}
            });
            
            console.log(`Client connected: ${clientId}`);
            
            ws.on('message', (data) => {
                this.handleMessage(clientId, data);
            });
            
            ws.on('close', () => {
                this.clients.delete(clientId);
                console.log(`Client disconnected: ${clientId}`);
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'CONNECTED',
                clientId: clientId,
                timestamp: Date.now()
            }));
        });
    }
    
    async handleMessage(clientId, data) {
        try {
            const message = JSON.parse(data);
            const client = this.clients.get(clientId);
            
            console.log(`Message from ${clientId}:`, message.type);
            
            const response = await this.processMessage(message, client.context);
            
            client.socket.send(JSON.stringify(response));
        } catch (error) {
            console.error('Error handling message:', error);
            this.sendError(clientId, error.message);
        }
    }
    
    async processMessage(message, context) {
        switch (message.type) {
            case 'NATURAL_LANGUAGE':
                return await this.handleNaturalLanguage(message.payload, context);
            case 'STATE_QUERY':
                return await this.handleStateQuery();
            default:
                throw new Error(`Unknown message type: ${message.type}`);
        }
    }
    
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Start server
const server = new AERealtimeServer(8080);
console.log('AE Realtime Server running on port 8080');
```

#### 1.2 Package Configuration
```json
// package.json
{
  "name": "ae-claude-max-server",
  "version": "3.2.0",
  "description": "Real-time After Effects control server",
  "main": "server/websocket-server.js",
  "scripts": {
    "start": "node server/websocket-server.js",
    "dev": "nodemon server/websocket-server.js",
    "test": "jest"
  },
  "dependencies": {
    "ws": "^8.16.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "natural": "^6.10.0",
    "compromise": "^14.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  }
}
```

#### 1.3 Test WebSocket Connection
```javascript
// tests/websocket.test.js
const WebSocket = require('ws');

describe('WebSocket Server', () => {
    let ws;
    
    beforeEach((done) => {
        ws = new WebSocket('ws://localhost:8080');
        ws.on('open', done);
    });
    
    afterEach(() => {
        ws.close();
    });
    
    test('should connect successfully', (done) => {
        ws.on('message', (data) => {
            const message = JSON.parse(data);
            expect(message.type).toBe('CONNECTED');
            expect(message.clientId).toBeDefined();
            done();
        });
    });
    
    test('should handle natural language input', (done) => {
        ws.send(JSON.stringify({
            type: 'NATURAL_LANGUAGE',
            payload: { text: 'Create a red circle' }
        }));
        
        ws.on('message', (data) => {
            const message = JSON.parse(data);
            if (message.type !== 'CONNECTED') {
                expect(message.success).toBeDefined();
                done();
            }
        });
    });
});
```

### Day 2: Natural Language Processing

#### 2.1 NLP Engine Implementation
```javascript
// server/nlp-engine.js
const natural = require('natural');
const compromise = require('compromise');

class NLPEngine {
    constructor() {
        this.tokenizer = new natural.WordTokenizer();
        this.classifier = new natural.BayesClassifier();
        this.initializePatterns();
        this.trainClassifier();
    }
    
    initializePatterns() {
        this.patterns = {
            CREATE: [
                /(?:create|make|add|draw|generate)\s+(?:a|an|some)?\s*(.+)/i,
                /(?:I want|I need|give me)\s+(?:a|an|some)?\s*(.+)/i
            ],
            MOVE: [
                /(?:move|drag|shift|position)\s+(?:the|this|that)?\s*(.+?)\s+(?:to|towards|by)\s+(.+)/i,
                /(?:put|place)\s+(?:the|this|that)?\s*(.+?)\s+(?:at|in|on)\s+(.+)/i
            ],
            TRANSFORM: [
                /(?:scale|resize|make)\s+(?:the|this|that)?\s*(.+?)\s+(bigger|smaller|larger)/i,
                /(?:rotate|spin|turn)\s+(?:the|this|that)?\s*(.+?)\s+(?:by)?\s*(\d+)/i
            ],
            ANIMATE: [
                /(?:animate|make)\s+(?:the|this|that)?\s*(.+?)\s+(.+)/i,
                /(?:add|apply)\s+(.+?)\s+to\s+(?:the|this|that)?\s*(.+)/i
            ],
            COLOR: [
                /(?:change|make|set)\s+(?:the|this|that)?\s*(.+?)\s+(?:color|colour)\s+(?:to)?\s*(.+)/i,
                /(?:color|colour)\s+(?:the|this|that)?\s*(.+?)\s+(.+)/i
            ]
        };
    }
    
    trainClassifier() {
        // Training data for intent classification
        const trainingData = [
            // CREATE intent
            { text: 'create a circle', intent: 'CREATE' },
            { text: 'make a new square', intent: 'CREATE' },
            { text: 'add a triangle', intent: 'CREATE' },
            { text: 'draw a star', intent: 'CREATE' },
            
            // MOVE intent
            { text: 'move it to the right', intent: 'MOVE' },
            { text: 'shift the circle up', intent: 'MOVE' },
            { text: 'position the square in the center', intent: 'MOVE' },
            
            // TRANSFORM intent
            { text: 'make it bigger', intent: 'TRANSFORM' },
            { text: 'scale the shape down', intent: 'TRANSFORM' },
            { text: 'rotate it 90 degrees', intent: 'TRANSFORM' },
            
            // ANIMATE intent
            { text: 'make it bounce', intent: 'ANIMATE' },
            { text: 'add wiggle to the position', intent: 'ANIMATE' },
            { text: 'animate the opacity', intent: 'ANIMATE' },
            
            // COLOR intent
            { text: 'change color to blue', intent: 'COLOR' },
            { text: 'make it red', intent: 'COLOR' },
            { text: 'set the fill to green', intent: 'COLOR' }
        ];
        
        trainingData.forEach(item => {
            this.classifier.addDocument(item.text, item.intent);
        });
        
        this.classifier.train();
    }
    
    async parse(text) {
        // Tokenize and normalize
        const tokens = this.tokenizer.tokenize(text.toLowerCase());
        
        // Classify intent
        const intent = this.classifier.classify(text);
        
        // Extract entities using compromise
        const doc = compromise(text);
        const entities = this.extractEntities(doc, intent);
        
        // Extract parameters
        const parameters = this.extractParameters(text, intent);
        
        return {
            originalText: text,
            tokens: tokens,
            intent: intent,
            entities: entities,
            parameters: parameters,
            confidence: this.calculateConfidence(text, intent)
        };
    }
    
    extractEntities(doc, intent) {
        const entities = {
            shapes: [],
            colors: [],
            numbers: [],
            directions: [],
            positions: []
        };
        
        // Extract shapes
        const shapeWords = ['circle', 'square', 'triangle', 'rectangle', 'star', 'polygon', 'ellipse'];
        shapeWords.forEach(shape => {
            if (doc.has(shape)) {
                entities.shapes.push(shape);
            }
        });
        
        // Extract colors
        const colorWords = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'black', 'white'];
        colorWords.forEach(color => {
            if (doc.has(color)) {
                entities.colors.push(color);
            }
        });
        
        // Extract numbers
        const numbers = doc.match('#Value').out('array');
        entities.numbers = numbers.map(n => parseFloat(n));
        
        // Extract directions
        const directionWords = ['up', 'down', 'left', 'right', 'center', 'top', 'bottom'];
        directionWords.forEach(dir => {
            if (doc.has(dir)) {
                entities.directions.push(dir);
            }
        });
        
        return entities;
    }
    
    extractParameters(text, intent) {
        const params = {};
        
        // Extract based on intent
        switch (intent) {
            case 'CREATE':
                for (const pattern of this.patterns.CREATE) {
                    const match = text.match(pattern);
                    if (match) {
                        params.object = match[1];
                        break;
                    }
                }
                break;
                
            case 'MOVE':
                for (const pattern of this.patterns.MOVE) {
                    const match = text.match(pattern);
                    if (match) {
                        params.target = match[1];
                        params.destination = match[2];
                        break;
                    }
                }
                break;
                
            // Add more cases...
        }
        
        return params;
    }
    
    calculateConfidence(text, intent) {
        // Simple confidence calculation
        const classifications = this.classifier.getClassifications(text);
        const topScore = classifications[0].value;
        const secondScore = classifications[1] ? classifications[1].value : 0;
        
        // Higher difference means higher confidence
        return Math.min(1, (topScore - secondScore) * 2);
    }
}

module.exports = NLPEngine;
```

### Day 3: After Effects Bridge

#### 3.1 AE Communication Bridge
```javascript
// server/ae-bridge.js
const net = require('net');
const { exec } = require('child_process');

class AEBridge {
    constructor() {
        this.port = 9000;
        this.host = 'localhost';
        this.connected = false;
        this.commandQueue = [];
        this.connect();
    }
    
    connect() {
        // This would connect to a CEP extension running in AE
        // For now, we'll simulate the connection
        this.socket = new net.Socket();
        
        this.socket.connect(this.port, this.host, () => {
            console.log('Connected to After Effects');
            this.connected = true;
            this.processQueue();
        });
        
        this.socket.on('data', (data) => {
            this.handleResponse(data.toString());
        });
        
        this.socket.on('error', (error) => {
            console.error('AE connection error:', error);
            this.connected = false;
            // Retry connection
            setTimeout(() => this.connect(), 5000);
        });
    }
    
    async execute(script) {
        return new Promise((resolve, reject) => {
            const command = {
                id: this.generateCommandId(),
                script: script,
                timestamp: Date.now(),
                resolve: resolve,
                reject: reject
            };
            
            this.commandQueue.push(command);
            
            if (this.connected) {
                this.processQueue();
            }
        });
    }
    
    processQueue() {
        while (this.commandQueue.length > 0 && this.connected) {
            const command = this.commandQueue.shift();
            this.sendCommand(command);
        }
    }
    
    sendCommand(command) {
        const message = JSON.stringify({
            id: command.id,
            type: 'EXECUTE_SCRIPT',
            script: command.script
        });
        
        this.socket.write(message + '\n');
        
        // Store callback for response
        this.pendingCommands = this.pendingCommands || {};
        this.pendingCommands[command.id] = command;
    }
    
    handleResponse(data) {
        try {
            const response = JSON.parse(data);
            const command = this.pendingCommands[response.id];
            
            if (command) {
                delete this.pendingCommands[response.id];
                
                if (response.success) {
                    command.resolve(response.result);
                } else {
                    command.reject(new Error(response.error));
                }
            }
        } catch (error) {
            console.error('Error parsing AE response:', error);
        }
    }
    
    generateCommandId() {
        return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Helper method to get current AE state
    async getState() {
        const script = `
        (function() {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                return JSON.stringify({ error: "No active composition" });
            }
            
            var state = {
                composition: {
                    name: comp.name,
                    width: comp.width,
                    height: comp.height,
                    duration: comp.duration,
                    frameRate: comp.frameRate,
                    time: comp.time
                },
                layers: []
            };
            
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                state.layers.push({
                    index: i,
                    name: layer.name,
                    selected: layer.selected,
                    position: layer.transform.position.value,
                    scale: layer.transform.scale.value,
                    rotation: layer.transform.rotation.value
                });
            }
            
            return JSON.stringify(state);
        })();
        `;
        
        const result = await this.execute(script);
        return JSON.parse(result);
    }
}

module.exports = AEBridge;
```

## 🔧 Phase 2: CEP Extension (Days 4-6)

### Day 4: CEP Extension Structure

#### 4.1 Extension Manifest
```xml
<!-- cep-extension/CSXS/manifest.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest Version="11.0" ExtensionBundleId="com.aeclaudemax.vibecoding" 
                   ExtensionBundleVersion="3.2.0"
                   ExtensionBundleName="AE Claude Max">
    <ExtensionList>
        <Extension Id="com.aeclaudemax.vibecoding.panel" Version="3.2.0"/>
    </ExtensionList>
    <ExecutionEnvironment>
        <HostList>
            <Host Name="AEFT" Version="[22.0,99.9]"/>
        </HostList>
        <LocaleList>
            <Locale Code="All"/>
        </LocaleList>
        <RequiredRuntimeList>
            <RequiredRuntime Name="CSXS" Version="11.0"/>
        </RequiredRuntimeList>
    </ExecutionEnvironment>
    <DispatchInfoList>
        <Extension Id="com.aeclaudemax.vibecoding.panel">
            <DispatchInfo>
                <Resources>
                    <MainPath>./index.html</MainPath>
                    <CEFCommandLine>
                        <Parameter>--enable-media-stream</Parameter>
                        <Parameter>--enable-speech-input</Parameter>
                    </CEFCommandLine>
                </Resources>
                <Lifecycle>
                    <AutoVisible>true</AutoVisible>
                </Lifecycle>
                <UI>
                    <Type>Panel</Type>
                    <Menu>AE Claude Max</Menu>
                    <Geometry>
                        <Size>
                            <Height>600</Height>
                            <Width>400</Width>
                        </Size>
                    </Geometry>
                </UI>
            </DispatchInfo>
        </Extension>
    </DispatchInfoList>
</ExtensionManifest>
```

#### 4.2 Panel HTML Interface
```html
<!-- cep-extension/index.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AE Claude Max - Vibe Coding</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div id="app">
        <!-- Header -->
        <header class="header">
            <h1>AE Claude Max</h1>
            <div class="status-indicator" id="status">
                <span class="status-dot"></span>
                <span class="status-text">Disconnected</span>
            </div>
        </header>
        
        <!-- Chat Container -->
        <div class="chat-container" id="chat-container">
            <div class="welcome-message">
                <h2>Welcome to Vibe Coding!</h2>
                <p>Tell me what you want to create in After Effects.</p>
                <div class="suggestions">
                    <button class="suggestion-btn">Create a bouncing ball</button>
                    <button class="suggestion-btn">Make 5 colorful circles</button>
                    <button class="suggestion-btn">Add wiggle to selected layers</button>
                </div>
            </div>
        </div>
        
        <!-- Input Area -->
        <div class="input-container">
            <textarea 
                id="user-input" 
                placeholder="Type your request... (e.g., 'Create a red circle')"
                rows="2"
            ></textarea>
            <button id="send-btn" class="send-button">
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                </svg>
            </button>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions">
            <button class="quick-action" data-action="undo">Undo</button>
            <button class="quick-action" data-action="redo">Redo</button>
            <button class="quick-action" data-action="clear">Clear Chat</button>
        </div>
    </div>
    
    <script src="js/CSInterface.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
```

#### 4.3 Panel Styling
```css
/* cep-extension/css/styles.css */
:root {
    --primary-color: #5E5CE6;
    --secondary-color: #FF453A;
    --background: #1E1E1E;
    --surface: #2A2A2A;
    --text-primary: #FFFFFF;
    --text-secondary: #999999;
    --success: #32D74B;
    --warning: #FFD60A;
    --error: #FF453A;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--background);
    color: var(--text-primary);
    height: 100vh;
    display: flex;
    flex-direction: column;
}

#app {
    display: flex;
    flex-direction: column;
    height: 100%;
}

/* Header */
.header {
    background: var(--surface);
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header h1 {
    font-size: 1.2rem;
    font-weight: 600;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--error);
    animation: pulse 2s infinite;
}

.status-indicator.connected .status-dot {
    background: var(--success);
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* Chat Container */
.chat-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.message {
    padding: 0.75rem 1rem;
    border-radius: 12px;
    max-width: 80%;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message.user {
    background: var(--primary-color);
    align-self: flex-end;
    margin-left: auto;
}

.message.assistant {
    background: var(--surface);
    align-self: flex-start;
}

.message.error {
    background: var(--error);
    color: white;
}

/* Code Block */
.code-block {
    background: #000;
    color: #0F0;
    padding: 0.5rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    margin-top: 0.5rem;
    overflow-x: auto;
}

/* Input Area */
.input-container {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--surface);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

#user-input {
    flex: 1;
    background: var(--background);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.75rem;
    color: var(--text-primary);
    font-size: 0.95rem;
    resize: none;
    outline: none;
}

#user-input:focus {
    border-color: var(--primary-color);
}

.send-button {
    background: var(--primary-color);
    border: none;
    border-radius: 8px;
    padding: 0.75rem;
    cursor: pointer;
    transition: background 0.2s;
}

.send-button:hover {
    background: #4C4CE6;
}

.send-button svg {
    fill: white;
    display: block;
}

/* Quick Actions */
.quick-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--surface);
}

.quick-action {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--text-secondary);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
}

.quick-action:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
    border-color: rgba(255, 255, 255, 0.3);
}

/* Suggestions */
.suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
}

.suggestion-btn {
    background: rgba(94, 92, 230, 0.2);
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
}

.suggestion-btn:hover {
    background: var(--primary-color);
    color: white;
}

/* Welcome Message */
.welcome-message {
    text-align: center;
    padding: 2rem;
}

.welcome-message h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.welcome-message p {
    color: var(--text-secondary);
    margin-bottom: 1rem;
}
```

### Day 5: Script Generator

#### 5.1 ExtendScript Template System
```javascript
// server/script-generator.js
class ScriptGenerator {
    constructor() {
        this.templates = this.loadTemplates();
    }
    
    loadTemplates() {
        return {
            CREATE_SHAPE: {
                circle: this.createCircleTemplate,
                square: this.createSquareTemplate,
                triangle: this.createTriangleTemplate,
                star: this.createStarTemplate
            },
            TRANSFORM: {
                move: this.moveTemplate,
                scale: this.scaleTemplate,
                rotate: this.rotateTemplate
            },
            ANIMATE: {
                wiggle: this.wiggleTemplate,
                bounce: this.bounceTemplate,
                pulse: this.pulseTemplate,
                loop: this.loopTemplate
            }
        };
    }
    
    generate(parsedInput) {
        const { intent, entities, parameters } = parsedInput;
        
        switch (intent) {
            case 'CREATE':
                return this.generateCreateScript(entities, parameters);
            case 'MOVE':
                return this.generateMoveScript(entities, parameters);
            case 'TRANSFORM':
                return this.generateTransformScript(entities, parameters);
            case 'ANIMATE':
                return this.generateAnimateScript(entities, parameters);
            case 'COLOR':
                return this.generateColorScript(entities, parameters);
            default:
                throw new Error(`Unknown intent: ${intent}`);
        }
    }
    
    generateCreateScript(entities, parameters) {
        const shape = entities.shapes[0] || 'circle';
        const color = entities.colors[0] || 'white';
        
        return `
        (function() {
            app.beginUndoGroup("Create ${shape}");
            
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("Please select a composition first");
                return "ERROR: No active composition";
            }
            
            var shapeLayer = comp.layers.addShape();
            shapeLayer.name = "${color} ${shape}";
            
            var contents = shapeLayer.property("Contents");
            var shapeGroup = contents.addProperty("ADBE Vector Group");
            
            ${this.getShapeCreationCode(shape)}
            
            // Add fill
            var fill = shapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
            fill.property("Color").setValue(${this.colorToRGBA(color)});
            
            // Center in composition
            shapeLayer.transform.position.setValue([comp.width/2, comp.height/2]);
            
            app.endUndoGroup();
            
            return JSON.stringify({
                success: true,
                message: "Created ${color} ${shape}",
                layerIndex: shapeLayer.index,
                layerName: shapeLayer.name
            });
        })();
        `;
    }
    
    getShapeCreationCode(shape) {
        const shapes = {
            circle: `
                var ellipse = shapeGroup.property("Contents")
                    .addProperty("ADBE Vector Shape - Ellipse");
                ellipse.property("Size").setValue([200, 200]);
            `,
            square: `
                var rect = shapeGroup.property("Contents")
                    .addProperty("ADBE Vector Shape - Rect");
                rect.property("Size").setValue([200, 200]);
            `,
            triangle: `
                var star = shapeGroup.property("Contents")
                    .addProperty("ADBE Vector Shape - Star");
                star.property("Type").setValue(1); // Polygon
                star.property("Points").setValue(3);
                star.property("Outer Radius").setValue(100);
            `,
            star: `
                var star = shapeGroup.property("Contents")
                    .addProperty("ADBE Vector Shape - Star");
                star.property("Points").setValue(5);
                star.property("Outer Radius").setValue(100);
                star.property("Inner Radius").setValue(40);
            `
        };
        
        return shapes[shape] || shapes.circle;
    }
    
    colorToRGBA(colorName) {
        const colors = {
            red: [1, 0, 0, 1],
            green: [0, 1, 0, 1],
            blue: [0, 0, 1, 1],
            yellow: [1, 1, 0, 1],
            orange: [1, 0.5, 0, 1],
            purple: [0.5, 0, 1, 1],
            black: [0, 0, 0, 1],
            white: [1, 1, 1, 1],
            gray: [0.5, 0.5, 0.5, 1]
        };
        
        return JSON.stringify(colors[colorName] || colors.white);
    }
    
    generateMoveScript(entities, parameters) {
        const direction = entities.directions[0] || 'right';
        const amount = entities.numbers[0] || 100;
        
        const movements = {
            right: [amount, 0],
            left: [-amount, 0],
            up: [0, -amount],
            down: [0, amount]
        };
        
        const movement = movements[direction] || [0, 0];
        
        return `
        (function() {
            app.beginUndoGroup("Move Layer");
            
            var comp = app.project.activeItem;
            if (!comp || comp.selectedLayers.length === 0) {
                alert("Please select a layer to move");
                return "ERROR: No layer selected";
            }
            
            var layer = comp.selectedLayers[0];
            var currentPos = layer.transform.position.value;
            var newPos = [
                currentPos[0] + ${movement[0]},
                currentPos[1] + ${movement[1]}
            ];
            
            layer.transform.position.setValue(newPos);
            
            app.endUndoGroup();
            
            return JSON.stringify({
                success: true,
                message: "Moved " + layer.name + " ${direction} by ${amount} pixels",
                from: currentPos,
                to: newPos
            });
        })();
        `;
    }
    
    generateAnimateScript(entities, parameters) {
        const animationType = parameters.animation || 'wiggle';
        
        const animations = {
            wiggle: `layer.transform.position.expression = "wiggle(5, 30)";`,
            bounce: `
                // Bounce expression
                var expression = 'n = 0;\\n' +
                    'if (numKeys > 0){\\n' +
                    '  n = nearestKey(time).index;\\n' +
                    '  if (key(n).time > time) n--;\\n' +
                    '}\\n' +
                    'if (n > 0){\\n' +
                    '  t = time - key(n).time;\\n' +
                    '  amp = velocityAtTime(key(n).time - 0.001);\\n' +
                    '  w = 2 * Math.PI * 2.5;\\n' +
                    '  value + amp * Math.sin(t * w) / Math.exp(t * 4);\\n' +
                    '} else value;';
                layer.transform.position.expression = expression;
            `,
            pulse: `
                layer.transform.scale.expression = 
                    "s = 100;\\namp = 10;\\nfreq = 2;\\n" +
                    "[s + Math.sin(time * freq * Math.PI * 2) * amp, " +
                    "s + Math.sin(time * freq * Math.PI * 2) * amp]";
            `,
            loop: `layer.transform.rotation.expression = "loopOut('cycle')";`
        };
        
        return `
        (function() {
            app.beginUndoGroup("Add Animation");
            
            var comp = app.project.activeItem;
            if (!comp || comp.selectedLayers.length === 0) {
                alert("Please select a layer to animate");
                return "ERROR: No layer selected";
            }
            
            var layer = comp.selectedLayers[0];
            
            ${animations[animationType] || animations.wiggle}
            
            app.endUndoGroup();
            
            return JSON.stringify({
                success: true,
                message: "Added ${animationType} animation to " + layer.name
            });
        })();
        `;
    }
}

module.exports = ScriptGenerator;
```

### Day 6: Integration Testing

#### 6.1 End-to-End Test Suite
```javascript
// tests/e2e/realtime-interaction.test.js
const WebSocket = require('ws');
const { spawn } = require('child_process');

describe('Real-time Interaction E2E', () => {
    let serverProcess;
    let ws;
    
    beforeAll((done) => {
        // Start server
        serverProcess = spawn('node', ['server/websocket-server.js']);
        
        serverProcess.stdout.on('data', (data) => {
            if (data.toString().includes('running on port 8080')) {
                done();
            }
        });
    });
    
    afterAll(() => {
        if (ws) ws.close();
        if (serverProcess) serverProcess.kill();
    });
    
    beforeEach((done) => {
        ws = new WebSocket('ws://localhost:8080');
        ws.on('open', done);
    });
    
    test('Complete conversation flow', (done) => {
        const messages = [];
        
        ws.on('message', (data) => {
            const message = JSON.parse(data);
            messages.push(message);
            
            if (message.type === 'CONNECTED') {
                // Send first command
                ws.send(JSON.stringify({
                    type: 'NATURAL_LANGUAGE',
                    payload: { text: 'Create a red circle' }
                }));
            } else if (messages.length === 2) {
                // Check first response
                expect(message.success).toBe(true);
                expect(message.message).toContain('red circle');
                
                // Send second command
                ws.send(JSON.stringify({
                    type: 'NATURAL_LANGUAGE',
                    payload: { text: 'Make it bigger' }
                }));
            } else if (messages.length === 3) {
                // Check second response
                expect(message.success).toBe(true);
                expect(message.message).toContain('bigger');
                
                // Send third command
                ws.send(JSON.stringify({
                    type: 'NATURAL_LANGUAGE',
                    payload: { text: 'Add wiggle animation' }
                }));
            } else if (messages.length === 4) {
                // Check final response
                expect(message.success).toBe(true);
                expect(message.message).toContain('wiggle');
                done();
            }
        });
    });
});
```

## 🔧 Phase 3: Optimization (Days 7-9)

### Day 7: Performance Optimization

#### 7.1 Caching System
```javascript
// server/cache-manager.js
class CacheManager {
    constructor() {
        this.scriptCache = new Map();
        this.stateCache = new Map();
        this.maxCacheSize = 1000;
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }
    
    generateKey(intent, params) {
        return `${intent}_${JSON.stringify(params)}`;
    }
    
    getScript(intent, params) {
        const key = this.generateKey(intent, params);
        const cached = this.scriptCache.get(key);
        
        if (cached) {
            this.cacheHits++;
            cached.lastAccessed = Date.now();
            cached.accessCount++;
            return cached.script;
        }
        
        this.cacheMisses++;
        return null;
    }
    
    setScript(intent, params, script) {
        const key = this.generateKey(intent, params);
        
        // Implement LRU eviction
        if (this.scriptCache.size >= this.maxCacheSize) {
            this.evictLRU();
        }
        
        this.scriptCache.set(key, {
            script: script,
            created: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 1
        });
    }
    
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, value] of this.scriptCache) {
            if (value.lastAccessed < oldestTime) {
                oldestTime = value.lastAccessed;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.scriptCache.delete(oldestKey);
        }
    }
    
    getStats() {
        const total = this.cacheHits + this.cacheMisses;
        return {
            size: this.scriptCache.size,
            hits: this.cacheHits,
            misses: this.cacheMisses,
            hitRate: total > 0 ? (this.cacheHits / total * 100).toFixed(2) + '%' : '0%'
        };
    }
}

module.exports = CacheManager;
```

### Day 8: Learning System

#### 8.1 Pattern Learning
```javascript
// server/learning-system.js
class LearningSystem {
    constructor() {
        this.patterns = new Map();
        this.userPreferences = new Map();
        this.successfulCommands = [];
    }
    
    recordInteraction(userId, input, result) {
        // Record successful patterns
        if (result.success) {
            this.successfulCommands.push({
                userId: userId,
                input: input,
                intent: result.intent,
                timestamp: Date.now()
            });
            
            // Update pattern frequency
            this.updatePatterns(input, result.intent);
            
            // Learn user preferences
            this.updateUserPreferences(userId, result);
        }
    }
    
    updatePatterns(input, intent) {
        const key = `${intent}`;
        const pattern = this.patterns.get(key) || {
            count: 0,
            examples: [],
            variations: new Set()
        };
        
        pattern.count++;
        pattern.examples.push(input);
        
        // Extract variations
        const words = input.toLowerCase().split(/\s+/);
        words.forEach(word => pattern.variations.add(word));
        
        // Keep only recent examples
        if (pattern.examples.length > 100) {
            pattern.examples = pattern.examples.slice(-100);
        }
        
        this.patterns.set(key, pattern);
    }
    
    updateUserPreferences(userId, result) {
        const prefs = this.userPreferences.get(userId) || {
            favoriteColors: new Map(),
            favoriteShapes: new Map(),
            favoriteAnimations: new Map(),
            commandStyle: 'concise' // or 'verbose'
        };
        
        // Track color preferences
        if (result.entities && result.entities.colors) {
            result.entities.colors.forEach(color => {
                const count = prefs.favoriteColors.get(color) || 0;
                prefs.favoriteColors.set(color, count + 1);
            });
        }
        
        // Track shape preferences
        if (result.entities && result.entities.shapes) {
            result.entities.shapes.forEach(shape => {
                const count = prefs.favoriteShapes.get(shape) || 0;
                prefs.favoriteShapes.set(shape, count + 1);
            });
        }
        
        this.userPreferences.set(userId, prefs);
    }
    
    getSuggestions(userId, currentContext) {
        const prefs = this.userPreferences.get(userId);
        const suggestions = [];
        
        if (prefs) {
            // Suggest based on favorites
            const favoriteColor = this.getMostFrequent(prefs.favoriteColors);
            const favoriteShape = this.getMostFrequent(prefs.favoriteShapes);
            
            if (favoriteColor && favoriteShape) {
                suggestions.push(`Create a ${favoriteColor} ${favoriteShape}`);
            }
        }
        
        // Suggest based on common patterns
        const commonPatterns = this.getCommonPatterns();
        suggestions.push(...commonPatterns.slice(0, 3));
        
        return suggestions;
    }
    
    getMostFrequent(map) {
        let maxCount = 0;
        let mostFrequent = null;
        
        for (const [item, count] of map) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequent = item;
            }
        }
        
        return mostFrequent;
    }
    
    getCommonPatterns() {
        const patterns = [];
        
        for (const [intent, data] of this.patterns) {
            if (data.count > 10) {
                patterns.push({
                    intent: intent,
                    count: data.count,
                    example: data.examples[data.examples.length - 1]
                });
            }
        }
        
        return patterns
            .sort((a, b) => b.count - a.count)
            .map(p => p.example);
    }
}

module.exports = LearningSystem;
```

### Day 9: Production Deployment

#### 9.1 Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Start application
CMD ["node", "server/websocket-server.js"]
```

#### 9.2 Production Configuration
```javascript
// config/production.js
module.exports = {
    server: {
        port: process.env.PORT || 8080,
        host: '0.0.0.0'
    },
    
    afterEffects: {
        host: process.env.AE_HOST || 'localhost',
        port: process.env.AE_PORT || 9000,
        reconnectInterval: 5000,
        maxReconnectAttempts: 10
    },
    
    cache: {
        enabled: true,
        maxSize: 10000,
        ttl: 3600000 // 1 hour
    },
    
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: '/var/log/ae-claude-max.log'
    },
    
    security: {
        maxRequestSize: '10mb',
        rateLimit: {
            windowMs: 60000, // 1 minute
            max: 100 // requests per window
        }
    },
    
    performance: {
        maxConcurrentScripts: 10,
        scriptTimeout: 30000, // 30 seconds
        statePollingInterval: 100 // ms
    }
};
```

## 📊 Testing & Validation

### Unit Test Coverage
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Expected coverage
- Statements: > 80%
- Branches: > 75%
- Functions: > 85%
- Lines: > 80%
```

### Performance Benchmarks
```javascript
// tests/performance/benchmarks.js
const Benchmark = require('benchmark');

const suite = new Benchmark.Suite();

suite
    .add('NLP parsing', function() {
        nlpEngine.parse('Create a red circle and make it bounce');
    })
    .add('Script generation', function() {
        scriptGenerator.generate({
            intent: 'CREATE',
            entities: { shapes: ['circle'], colors: ['red'] }
        });
    })
    .add('Cache lookup', function() {
        cacheManager.getScript('CREATE', { shape: 'circle' });
    })
    .on('complete', function() {
        console.log('Benchmark results:');
        this.forEach(function(benchmark) {
            console.log(`${benchmark.name}: ${benchmark.hz.toFixed(2)} ops/sec`);
        });
    })
    .run({ async: true });
```

## 🚀 Launch Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Performance benchmarks meet targets
- [ ] Security audit completed
- [ ] Documentation complete
- [ ] CEP extension signed
- [ ] Docker images built
- [ ] Load testing completed

### Launch Day
- [ ] Deploy server to production
- [ ] Install CEP extension in After Effects
- [ ] Verify WebSocket connection
- [ ] Test basic commands
- [ ] Monitor error rates
- [ ] Check performance metrics

### Post-Launch
- [ ] Monitor user feedback
- [ ] Track usage analytics
- [ ] Address bug reports
- [ ] Plan feature updates
- [ ] Optimize based on real usage

## 📈 Success Metrics

### Week 1 Targets
- **Active Users**: 10+
- **Commands Processed**: 1000+
- **Success Rate**: > 95%
- **Average Response Time**: < 100ms
- **User Satisfaction**: > 4/5

### Month 1 Targets
- **Active Users**: 100+
- **Commands Processed**: 50,000+
- **Pattern Library**: 500+ patterns
- **Cache Hit Rate**: > 70%
- **Uptime**: > 99.9%

## 🎯 Conclusion

This implementation roadmap provides a complete, actionable plan for building a real-time natural language interface for After Effects. By following these steps, you'll create a system that enables intuitive, conversational control of motion graphics creation.

The key to success is iterative development - start with the core WebSocket server, add NLP capabilities, integrate with After Effects, and continuously optimize based on real usage patterns.

---

*Ready to revolutionize After Effects automation. Let's build the future of creative tools together!*