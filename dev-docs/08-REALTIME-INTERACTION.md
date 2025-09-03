# 🎮 Real-time Interaction Architecture for AE Claude Max
**Bidirectional Natural Language ↔ After Effects Communication System**
*Created: 2025-01-22*

## 🌟 System Overview

This document defines the complete architecture for real-time, bidirectional communication between users and After Effects through natural language and direct manipulation interfaces.

## 🏗️ Core Architecture

### System Components
```
┌──────────────────────────────────────────────────────┐
│                   User Interface Layer                │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐│
│  │ Chat Interface│  │ Visual Canvas│  │Gesture Input ││
│  └──────┬───────┘  └──────┬──────┘  └──────┬───────┘│
└─────────┼──────────────────┼────────────────┼────────┘
          │                  │                 │
      ┌───▼──────────────────▼─────────────────▼───┐
      │         Natural Language Processor          │
      │  • Intent Recognition                       │
      │  • Context Management                       │
      │  • Parameter Extraction                     │
      └──────────────────┬──────────────────────────┘
                         │
      ┌──────────────────▼──────────────────────────┐
      │          Translation Engine                 │
      │  • NL → ExtendScript                       │
      │  • AE State → Natural Language             │
      │  • Bidirectional Mapping                   │
      └──────────────────┬──────────────────────────┘
                         │
      ┌──────────────────▼──────────────────────────┐
      │      After Effects Runtime Bridge           │
      │  • Script Execution                        │
      │  • State Monitoring                        │
      │  • Event Streaming                         │
      └──────────────────────────────────────────────┘
```

## 💬 Natural Language Processing Pipeline

### 1. Input Processing
```javascript
class InputProcessor {
    constructor() {
        this.contextManager = new ContextManager();
        this.intentClassifier = new IntentClassifier();
        this.entityExtractor = new EntityExtractor();
    }
    
    async process(userInput) {
        // Step 1: Tokenization and normalization
        const tokens = this.tokenize(userInput);
        
        // Step 2: Intent classification
        const intent = await this.intentClassifier.classify(tokens);
        
        // Step 3: Entity extraction
        const entities = await this.entityExtractor.extract(tokens, intent);
        
        // Step 4: Context enrichment
        const context = this.contextManager.enrich(intent, entities);
        
        // Step 5: Ambiguity resolution
        if (this.hasAmbiguity(context)) {
            return this.requestClarification(context);
        }
        
        return {
            intent: intent,
            entities: entities,
            context: context,
            confidence: this.calculateConfidence(intent, entities)
        };
    }
}
```

### 2. Intent Recognition Patterns
```javascript
const INTENT_PATTERNS = {
    // Object Creation
    CREATE: {
        patterns: [
            /(?:create|make|add|draw|generate)\s+(?:a|an|new)?\s*(\w+)/i,
            /(?:can you|could you|please)?\s*(?:create|make)\s+(\w+)/i,
            /(?:I need|I want|give me)\s+(?:a|an)?\s*(\w+)/i
        ],
        parameters: ['object_type', 'properties']
    },
    
    // Object Manipulation
    TRANSFORM: {
        patterns: [
            /(?:move|shift|position)\s+(?:the|this|that)?\s*(\w+)\s+(?:to|by|towards)?\s*(.*)/i,
            /(?:scale|resize|make)\s+(?:the|this|that)?\s*(\w+)\s+(?:bigger|smaller|larger|to)?\s*(.*)/i,
            /(?:rotate|spin|turn)\s+(?:the|this|that)?\s*(\w+)\s+(?:by|to)?\s*(.*)/i
        ],
        parameters: ['target', 'transformation', 'amount']
    },
    
    // Animation
    ANIMATE: {
        patterns: [
            /(?:animate|make)\s+(?:the|this|that)?\s*(\w+)\s+(\w+)/i,
            /(?:add|apply)\s+(\w+)\s+(?:animation|effect|movement)\s+(?:to)?\s*(.*)/i,
            /(?:wiggle|bounce|pulse|breathe|shake)\s+(?:the|this|that)?\s*(.*)/i
        ],
        parameters: ['target', 'animation_type', 'duration', 'intensity']
    },
    
    // Query
    QUERY: {
        patterns: [
            /(?:what|where|how|which)\s+(?:is|are)\s+(.*)/i,
            /(?:show|tell|describe)\s+(?:me)?\s*(.*)/i,
            /(?:list|display|get)\s+(?:all)?\s*(.*)/i
        ],
        parameters: ['query_type', 'subject']
    }
};
```

## 🔄 Bidirectional Translation System

### Natural Language → ExtendScript
```javascript
class NLToExtendScript {
    constructor() {
        this.templates = new ScriptTemplateLibrary();
        this.validator = new ExtendScriptValidator();
    }
    
    translate(parsedInput) {
        const { intent, entities, context } = parsedInput;
        
        // Select appropriate template
        const template = this.templates.getTemplate(intent);
        
        // Fill template with entities
        const script = this.fillTemplate(template, entities, context);
        
        // Validate script syntax
        if (!this.validator.validate(script)) {
            throw new ScriptGenerationError('Invalid script generated');
        }
        
        // Add safety wrapper
        return this.wrapWithSafety(script);
    }
    
    fillTemplate(template, entities, context) {
        let script = template.base;
        
        // Replace placeholders
        Object.entries(entities).forEach(([key, value]) => {
            script = script.replace(`{{${key}}}`, this.sanitize(value));
        });
        
        // Add context-specific modifications
        if (context.hasSelection) {
            script = this.adaptForSelection(script, context.selection);
        }
        
        return script;
    }
    
    wrapWithSafety(script) {
        return `
            try {
                app.beginUndoGroup("User Action");
                ${script}
                app.endUndoGroup();
                "SUCCESS";
            } catch (error) {
                app.endUndoGroup();
                "ERROR: " + error.toString();
            }
        `;
    }
}
```

### ExtendScript → Natural Language
```javascript
class AEStateDescriber {
    constructor() {
        this.vocabulary = new DescriptiveVocabulary();
    }
    
    describeState(aeState) {
        const descriptions = [];
        
        // Describe composition
        descriptions.push(this.describeComposition(aeState.composition));
        
        // Describe selected items
        if (aeState.selection.length > 0) {
            descriptions.push(this.describeSelection(aeState.selection));
        }
        
        // Describe recent changes
        if (aeState.recentChanges) {
            descriptions.push(this.describeChanges(aeState.recentChanges));
        }
        
        return descriptions.join('. ');
    }
    
    describeLayer(layer) {
        const shape = this.identifyShape(layer);
        const position = this.describePosition(layer.position);
        const animation = this.describeAnimation(layer);
        
        return `${shape} ${position}${animation ? `, ${animation}` : ''}`;
    }
    
    describePosition(pos) {
        const [x, y] = pos;
        const comp = this.currentComposition;
        
        // Convert to human-friendly description
        if (this.isNear(x, comp.width / 2) && this.isNear(y, comp.height / 2)) {
            return "in the center";
        } else if (x < comp.width / 3) {
            return "on the left side";
        } else if (x > comp.width * 2 / 3) {
            return "on the right side";
        } else {
            return `at position (${Math.round(x)}, ${Math.round(y)})`;
        }
    }
}
```

## 🎮 Real-time Interaction Handlers

### Mouse Interaction System
```javascript
class MouseInteractionHandler {
    constructor(aeConnection) {
        this.ae = aeConnection;
        this.isDragging = false;
        this.dragTarget = null;
        this.startPos = null;
    }
    
    async handleMouseDown(event) {
        const hitTest = await this.ae.execute(`
            var point = [${event.x}, ${event.y}];
            var comp = app.project.activeItem;
            var hit = null;
            
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                var bounds = layer.sourceRectAtTime(comp.time, false);
                var pos = layer.transform.position.value;
                
                var left = pos[0] + bounds.left;
                var right = pos[0] + bounds.left + bounds.width;
                var top = pos[1] + bounds.top;
                var bottom = pos[1] + bounds.top + bounds.height;
                
                if (point[0] >= left && point[0] <= right &&
                    point[1] >= top && point[1] <= bottom) {
                    hit = {
                        layerIndex: i,
                        layerName: layer.name,
                        position: pos
                    };
                    break;
                }
            }
            
            JSON.stringify(hit);
        `);
        
        if (hitTest) {
            this.isDragging = true;
            this.dragTarget = JSON.parse(hitTest);
            this.startPos = { x: event.x, y: event.y };
            
            return {
                action: 'DRAG_START',
                target: this.dragTarget.layerName
            };
        }
    }
    
    async handleMouseMove(event) {
        if (!this.isDragging || !this.dragTarget) return;
        
        const deltaX = event.x - this.startPos.x;
        const deltaY = event.y - this.startPos.y;
        
        await this.ae.execute(`
            var layer = comp.layer(${this.dragTarget.layerIndex});
            if (layer) {
                var newPos = [
                    ${this.dragTarget.position[0]} + ${deltaX},
                    ${this.dragTarget.position[1]} + ${deltaY}
                ];
                layer.transform.position.setValue(newPos);
            }
        `);
        
        return {
            action: 'DRAGGING',
            target: this.dragTarget.layerName,
            position: [
                this.dragTarget.position[0] + deltaX,
                this.dragTarget.position[1] + deltaY
            ]
        };
    }
    
    async handleMouseUp(event) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        const finalPos = await this.getCurrentPosition(this.dragTarget.layerIndex);
        
        const result = {
            action: 'DRAG_END',
            target: this.dragTarget.layerName,
            from: this.dragTarget.position,
            to: finalPos
        };
        
        this.dragTarget = null;
        this.startPos = null;
        
        return result;
    }
}
```

### Keyboard Shortcuts System
```javascript
class KeyboardHandler {
    constructor() {
        this.shortcuts = {
            'ctrl+z': 'undo',
            'ctrl+y': 'redo',
            'ctrl+d': 'duplicate',
            'delete': 'delete',
            'ctrl+g': 'group',
            'ctrl+shift+g': 'ungroup',
            'space': 'preview',
            'ctrl+s': 'save'
        };
        
        this.customShortcuts = new Map();
    }
    
    registerCustomShortcut(keys, action) {
        this.customShortcuts.set(keys, action);
    }
    
    async handleKeyPress(event) {
        const combo = this.getKeyCombo(event);
        
        // Check built-in shortcuts
        if (this.shortcuts[combo]) {
            return await this.executeBuiltIn(this.shortcuts[combo]);
        }
        
        // Check custom shortcuts
        if (this.customShortcuts.has(combo)) {
            return await this.executeCustom(this.customShortcuts.get(combo));
        }
        
        // Single key actions
        if (event.key.length === 1) {
            return await this.handleTextInput(event.key);
        }
    }
}
```

## 🔧 WebSocket Communication Protocol

### Message Types and Formats
```typescript
// TypeScript definitions for message protocol
interface ClientMessage {
    id: string;
    type: 'NATURAL_LANGUAGE' | 'MOUSE_EVENT' | 'KEYBOARD_EVENT' | 'STATE_QUERY';
    timestamp: number;
    payload: any;
}

interface ServerMessage {
    id: string;
    type: 'RESPONSE' | 'STATE_UPDATE' | 'ERROR' | 'CLARIFICATION';
    timestamp: number;
    payload: any;
}

interface NaturalLanguagePayload {
    text: string;
    context?: {
        previousMessages?: string[];
        currentSelection?: string[];
        compositionState?: any;
    };
}

interface ResponsePayload {
    success: boolean;
    message: string;
    executedScript?: string;
    stateChange?: any;
    preview?: string; // Base64 encoded preview image
}
```

### WebSocket Server Implementation
```javascript
// server/websocket-server.js
const WebSocket = require('ws');
const AEBridge = require('./ae-bridge');
const NLPEngine = require('./nlp-engine');

class RealtimeServer {
    constructor(port = 8080) {
        this.wss = new WebSocket.Server({ port });
        this.aeBridge = new AEBridge();
        this.nlp = new NLPEngine();
        this.sessions = new Map();
        
        this.initialize();
    }
    
    initialize() {
        this.wss.on('connection', (ws, req) => {
            const sessionId = this.createSession(ws);
            console.log(`New connection: ${sessionId}`);
            
            // Send initial state
            this.sendState(ws, sessionId);
            
            // Handle messages
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleMessage(ws, sessionId, data);
                } catch (error) {
                    this.sendError(ws, error);
                }
            });
            
            // Handle disconnect
            ws.on('close', () => {
                this.sessions.delete(sessionId);
                console.log(`Disconnected: ${sessionId}`);
            });
        });
        
        // Start state monitoring
        this.startStateMonitoring();
    }
    
    async handleMessage(ws, sessionId, message) {
        const session = this.sessions.get(sessionId);
        
        switch (message.type) {
            case 'NATURAL_LANGUAGE':
                await this.handleNaturalLanguage(ws, session, message.payload);
                break;
                
            case 'MOUSE_EVENT':
                await this.handleMouseEvent(ws, session, message.payload);
                break;
                
            case 'KEYBOARD_EVENT':
                await this.handleKeyboardEvent(ws, session, message.payload);
                break;
                
            case 'STATE_QUERY':
                await this.sendState(ws, sessionId);
                break;
        }
    }
    
    async handleNaturalLanguage(ws, session, payload) {
        // Parse natural language
        const parsed = await this.nlp.parse(payload.text, session.context);
        
        // Check for ambiguity
        if (parsed.needsClarification) {
            return this.sendClarification(ws, parsed.clarificationOptions);
        }
        
        // Generate and execute script
        const script = this.generateScript(parsed);
        const result = await this.aeBridge.execute(script);
        
        // Update session context
        session.context.addInteraction(payload.text, result);
        
        // Send response
        this.sendResponse(ws, {
            success: result.success,
            message: this.generateHumanResponse(parsed, result),
            executedScript: script,
            stateChange: result.stateChange
        });
    }
    
    startStateMonitoring() {
        setInterval(async () => {
            const currentState = await this.aeBridge.getState();
            
            // Check for changes and notify connected clients
            for (const [sessionId, session] of this.sessions) {
                if (this.hasStateChanged(session.lastState, currentState)) {
                    this.sendStateUpdate(session.ws, currentState);
                    session.lastState = currentState;
                }
            }
        }, 100); // 100ms polling interval
    }
}

// Start server
const server = new RealtimeServer(8080);
console.log('Realtime AE server running on port 8080');
```

## 🎯 Concrete Use Cases

### Use Case 1: Creating and Animating Shapes
```javascript
// User: "Create three blue circles and make them bounce"
async function createBouncingCircles() {
    const conversation = [
        { user: "Create three blue circles", ai: null },
        { user: null, ai: "I'll create three blue circles for you." },
        { user: "Make them bounce", ai: null }
    ];
    
    // Step 1: Create circles
    const createScript = `
        app.beginUndoGroup("Create Blue Circles");
        var comp = app.project.activeItem;
        var circles = [];
        
        for (var i = 0; i < 3; i++) {
            var circle = comp.layers.addShape();
            circle.name = "Blue Circle " + (i + 1);
            
            // Shape content
            var contents = circle.property("Contents");
            var group = contents.addProperty("ADBE Vector Group");
            var ellipse = group.property("Contents")
                .addProperty("ADBE Vector Shape - Ellipse");
            ellipse.property("Size").setValue([100, 100]);
            
            // Blue fill
            var fill = group.property("Contents")
                .addProperty("ADBE Vector Graphic - Fill");
            fill.property("Color").setValue([0, 0.5, 1, 1]);
            
            // Position
            var xPos = comp.width * (i + 1) / 4;
            circle.transform.position.setValue([xPos, comp.height / 2]);
            
            circles.push(circle.index);
        }
        
        app.endUndoGroup();
        JSON.stringify(circles);
    `;
    
    const circleIds = JSON.parse(await ae.execute(createScript));
    
    // Step 2: Add bounce animation
    const bounceScript = `
        app.beginUndoGroup("Add Bounce");
        var comp = app.project.activeItem;
        var circles = ${JSON.stringify(circleIds)};
        
        circles.forEach(function(id, index) {
            var layer = comp.layer(id);
            var startTime = comp.time + (index * 0.2); // Stagger
            
            // Initial position
            var pos = layer.transform.position.value;
            var groundY = comp.height - 100;
            
            // Keyframes for bounce
            layer.transform.position.setValueAtTime(startTime, pos);
            layer.transform.position.setValueAtTime(startTime + 0.5, 
                [pos[0], groundY]);
            layer.transform.position.setValueAtTime(startTime + 0.7, 
                [pos[0], groundY - 150]);
            layer.transform.position.setValueAtTime(startTime + 0.85, 
                [pos[0], groundY]);
            layer.transform.position.setValueAtTime(startTime + 0.95, 
                [pos[0], groundY - 50]);
            layer.transform.position.setValueAtTime(startTime + 1, 
                [pos[0], groundY]);
            
            // Apply easing
            for (var k = 1; k <= layer.transform.position.numKeys; k++) {
                layer.transform.position.setInterpolationTypeAtKey(k,
                    KeyframeInterpolationType.BEZIER);
            }
            
            // Loop expression
            layer.transform.position.expression = "loopOut('cycle')";
        });
        
        app.endUndoGroup();
    `;
    
    await ae.execute(bounceScript);
    
    return "Created three blue circles with bouncing animation!";
}
```

### Use Case 2: Interactive Shape Manipulation
```javascript
// Real-time shape manipulation through conversation
class InteractiveShapeController {
    constructor(websocket) {
        this.ws = websocket;
        this.selectedShape = null;
    }
    
    async handleCommand(command) {
        const commands = {
            "select the red square": () => this.selectShape("red", "square"),
            "move it to the right": () => this.moveShape("right", 100),
            "make it bigger": () => this.scaleShape(1.5),
            "rotate it 45 degrees": () => this.rotateShape(45),
            "change color to green": () => this.changeColor([0, 1, 0]),
            "duplicate it": () => this.duplicateShape(),
            "delete it": () => this.deleteShape()
        };
        
        // Fuzzy matching for commands
        const matched = this.fuzzyMatch(command, Object.keys(commands));
        if (matched) {
            return await commands[matched]();
        }
        
        return "I didn't understand that command. Try something like 'move it to the right' or 'make it bigger'.";
    }
    
    async moveShape(direction, amount) {
        if (!this.selectedShape) {
            return "Please select a shape first.";
        }
        
        const directions = {
            "right": [amount, 0],
            "left": [-amount, 0],
            "up": [0, -amount],
            "down": [0, amount]
        };
        
        const delta = directions[direction] || [0, 0];
        
        const script = `
            var layer = comp.layer("${this.selectedShape}");
            if (layer) {
                var pos = layer.transform.position.value;
                layer.transform.position.setValue([
                    pos[0] + ${delta[0]},
                    pos[1] + ${delta[1]}
                ]);
                "Moved ${direction} by ${amount} pixels";
            } else {
                "Layer not found";
            }
        `;
        
        return await this.execute(script);
    }
}
```

## 📊 Performance Optimization

### Latency Reduction Strategies
```javascript
class PerformanceOptimizer {
    constructor() {
        this.scriptCache = new Map();
        this.stateCache = null;
        this.cacheTimeout = 100; // ms
    }
    
    // Cache frequently used scripts
    cacheScript(key, script) {
        this.scriptCache.set(key, {
            script: script,
            timestamp: Date.now()
        });
    }
    
    getCachedScript(key) {
        const cached = this.scriptCache.get(key);
        if (cached && Date.now() - cached.timestamp < 5000) {
            return cached.script;
        }
        return null;
    }
    
    // Batch operations for efficiency
    batchOperations(operations) {
        const batchScript = `
            app.beginUndoGroup("Batch Operation");
            var results = [];
            
            ${operations.map(op => `
                results.push((function() {
                    ${op}
                })());
            `).join('\n')}
            
            app.endUndoGroup();
            JSON.stringify(results);
        `;
        
        return batchScript;
    }
    
    // Predictive pre-loading
    async preloadCommonOperations() {
        const common = [
            'CREATE_CIRCLE',
            'CREATE_SQUARE',
            'MOVE_SELECTED',
            'SCALE_SELECTED',
            'ROTATE_SELECTED'
        ];
        
        for (const op of common) {
            const script = this.generateBaseScript(op);
            this.cacheScript(op, script);
        }
    }
}
```

## 🔒 Security and Validation

### Input Sanitization
```javascript
class SecurityValidator {
    constructor() {
        this.blacklist = [
            'system.callSystem',
            'File.execute',
            'app.exitAfterAllTasksComplete',
            'app.quit'
        ];
    }
    
    validateScript(script) {
        // Check for blacklisted commands
        for (const forbidden of this.blacklist) {
            if (script.includes(forbidden)) {
                throw new SecurityError(`Forbidden operation: ${forbidden}`);
            }
        }
        
        // Validate syntax
        try {
            new Function(script);
        } catch (error) {
            throw new SyntaxError(`Invalid script syntax: ${error.message}`);
        }
        
        return true;
    }
    
    sanitizeUserInput(input) {
        // Remove potential script injection
        return input
            .replace(/[<>]/g, '')
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'");
    }
}
```

## 📈 Analytics and Learning

### Interaction Analytics
```javascript
class InteractionAnalytics {
    constructor() {
        this.interactions = [];
        this.patterns = new Map();
    }
    
    recordInteraction(interaction) {
        this.interactions.push({
            timestamp: Date.now(),
            input: interaction.input,
            intent: interaction.intent,
            success: interaction.success,
            responseTime: interaction.responseTime,
            userSatisfaction: interaction.satisfaction
        });
        
        // Detect patterns
        this.updatePatterns(interaction);
    }
    
    updatePatterns(interaction) {
        const key = `${interaction.intent}_${interaction.success}`;
        const pattern = this.patterns.get(key) || { count: 0, examples: [] };
        
        pattern.count++;
        pattern.examples.push(interaction.input);
        
        if (pattern.examples.length > 10) {
            pattern.examples.shift(); // Keep only recent examples
        }
        
        this.patterns.set(key, pattern);
    }
    
    generateInsights() {
        return {
            totalInteractions: this.interactions.length,
            successRate: this.calculateSuccessRate(),
            averageResponseTime: this.calculateAverageResponseTime(),
            mostCommonIntents: this.getMostCommonIntents(),
            problemAreas: this.identifyProblemAreas()
        };
    }
}
```

## 🚀 Deployment Configuration

### Docker Setup
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy application
COPY . .

# Expose WebSocket port
EXPOSE 8080

# Start server
CMD ["node", "server/index.js"]
```

### Environment Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  ae-realtime:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - AE_HOST=host.docker.internal
      - AE_PORT=9000
      - NLP_MODEL=claude-3-opus
      - CACHE_ENABLED=true
      - LOG_LEVEL=info
    volumes:
      - ./logs:/app/logs
      - ./cache:/app/cache
    restart: unless-stopped
```

## 📋 Implementation Checklist

### Week 1: Foundation
- [ ] WebSocket server setup
- [ ] Basic NLP intent detection
- [ ] Simple ExtendScript generation
- [ ] CEP Extension skeleton
- [ ] Error handling framework

### Week 2: Core Features
- [ ] Bidirectional translation
- [ ] Mouse interaction handling
- [ ] Keyboard shortcut system
- [ ] State synchronization
- [ ] Context management

### Week 3: Advanced Features
- [ ] Gesture recognition
- [ ] Multi-object selection
- [ ] Animation preview
- [ ] Pattern learning
- [ ] User preferences

### Week 4: Polish & Deploy
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Analytics dashboard
- [ ] Documentation
- [ ] Production deployment

## 🎯 Success Metrics

- **Response Time**: < 100ms for simple operations
- **Intent Recognition**: > 95% accuracy
- **User Satisfaction**: > 4.5/5 rating
- **System Uptime**: > 99.9%
- **Concurrent Users**: Support 100+ simultaneous connections

---

*This architecture enables seamless, intuitive interaction between users and After Effects, removing all technical barriers to creative expression.*