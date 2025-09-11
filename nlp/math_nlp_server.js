/**
 * Math NLP Server - Natural Language to ExtendScript
 * Port: 3000
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Math command patterns
const MATH_PATTERNS = {
    // 도형 생성
    createShape: {
        triangle: /삼각형|triangle|세모/i,
        circle: /원|circle|동그라미/i,
        square: /정사각형|square|네모/i,
        rectangle: /직사각형|rectangle/i,
        pentagon: /오각형|pentagon/i,
        hexagon: /육각형|hexagon/i
    },
    
    // 크기 조절
    size: {
        pattern: /(크게|작게|크기|size|scale)/i,
        values: /(\d+)(%|배|times|픽셀|px)?/i
    },
    
    // 위치 이동
    position: {
        pattern: /(이동|움직|move|position|위치)/i,
        direction: {
            up: /위|위로|up|위쪽/i,
            down: /아래|아래로|down|아래쪽/i,
            left: /왼쪽|왼|left|좌/i,
            right: /오른쪽|오른|right|우/i
        }
    }
};

class MathNLPProcessor {
    constructor() {
        this.context = {
            lastShape: null,
            lastAction: null,
            shapes: [],
            history: []
        };
    }
    
    /**
     * Process natural language command
     */
    processCommand(text) {
        const result = {
            text: text,
            intent: null,
            parameters: {},
            extendScript: null,
            timestamp: Date.now()
        };
        
        // Shape creation
        for (const [shape, pattern] of Object.entries(MATH_PATTERNS.createShape)) {
            if (pattern.test(text)) {
                result.intent = 'CREATE_SHAPE';
                result.parameters.shape = shape;
                result.extendScript = this.generateShapeScript(shape);
                this.context.lastShape = shape;
                break;
            }
        }
        
        // Size adjustment
        if (MATH_PATTERNS.size.pattern.test(text)) {
            result.intent = 'ADJUST_SIZE';
            const sizeMatch = text.match(MATH_PATTERNS.size.values);
            if (sizeMatch) {
                result.parameters.value = parseInt(sizeMatch[1]);
                result.parameters.unit = sizeMatch[2] || 'percent';
            }
            result.extendScript = this.generateSizeScript(result.parameters);
        }
        
        // Position adjustment
        if (MATH_PATTERNS.position.pattern.test(text)) {
            result.intent = 'MOVE';
            for (const [dir, pattern] of Object.entries(MATH_PATTERNS.position.direction)) {
                if (pattern.test(text)) {
                    result.parameters.direction = dir;
                    break;
                }
            }
            result.extendScript = this.generateMoveScript(result.parameters);
        }
        
        // Save to history
        this.context.history.push(result);
        
        return result;
    }
    
    /**
     * Generate ExtendScript for shape creation
     */
    generateShapeScript(shape) {
        const scripts = {
            triangle: `
                var comp = app.project.activeItem;
                if (comp && comp instanceof CompItem) {
                    var shapeLayer = comp.layers.addShape();
                    shapeLayer.name = "Triangle";
                    var shapeGroup = shapeLayer.property("Contents").addProperty("ADBE Vector Group");
                    var shapePath = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Star");
                    shapePath.property("Type").setValue(2); // Polygon
                    shapePath.property("Points").setValue(3);
                    shapePath.property("Position").setValue([comp.width/2, comp.height/2]);
                    shapePath.property("Outer Radius").setValue(100);
                }
            `,
            circle: `
                var comp = app.project.activeItem;
                if (comp && comp instanceof CompItem) {
                    var shapeLayer = comp.layers.addShape();
                    shapeLayer.name = "Circle";
                    var shapeGroup = shapeLayer.property("Contents").addProperty("ADBE Vector Group");
                    var ellipse = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Ellipse");
                    ellipse.property("Size").setValue([200, 200]);
                    ellipse.property("Position").setValue([comp.width/2, comp.height/2]);
                }
            `,
            square: `
                var comp = app.project.activeItem;
                if (comp && comp instanceof CompItem) {
                    var shapeLayer = comp.layers.addShape();
                    shapeLayer.name = "Square";
                    var shapeGroup = shapeLayer.property("Contents").addProperty("ADBE Vector Group");
                    var rect = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Rect");
                    rect.property("Size").setValue([200, 200]);
                    rect.property("Position").setValue([comp.width/2, comp.height/2]);
                }
            `
        };
        
        return scripts[shape] || scripts.square;
    }
    
    /**
     * Generate ExtendScript for size adjustment
     */
    generateSizeScript(params) {
        const scale = params.value || 100;
        return `
            var comp = app.project.activeItem;
            if (comp && comp.selectedLayers.length > 0) {
                var layer = comp.selectedLayers[0];
                var currentScale = layer.property("Transform").property("Scale").value;
                var newScale = [currentScale[0] * ${scale/100}, currentScale[1] * ${scale/100}];
                layer.property("Transform").property("Scale").setValue(newScale);
            }
        `;
    }
    
    /**
     * Generate ExtendScript for position adjustment
     */
    generateMoveScript(params) {
        const direction = params.direction || 'right';
        const distance = params.distance || 50;
        
        const offsets = {
            up: [0, -distance],
            down: [0, distance],
            left: [-distance, 0],
            right: [distance, 0]
        };
        
        const offset = offsets[direction];
        
        return `
            var comp = app.project.activeItem;
            if (comp && comp.selectedLayers.length > 0) {
                var layer = comp.selectedLayers[0];
                var currentPos = layer.property("Transform").property("Position").value;
                var newPos = [currentPos[0] + ${offset[0]}, currentPos[1] + ${offset[1]}];
                layer.property("Transform").property("Position").setValue(newPos);
            }
        `;
    }
}

// Create processor instance
const processor = new MathNLPProcessor();

// API Endpoints
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Math NLP Server',
        port: PORT,
        patterns: Object.keys(MATH_PATTERNS)
    });
});

app.post('/process', (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }
        
        const result = processor.processCommand(text);
        res.json(result);
        
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.get('/context', (req, res) => {
    res.json(processor.context);
});

app.post('/context/reset', (req, res) => {
    processor.context = {
        lastShape: null,
        lastAction: null,
        shapes: [],
        history: []
    };
    res.json({ message: 'Context reset successful' });
});

// WebSocket for real-time processing
const server = app.listen(PORT, () => {
    console.log('Math NLP Server running on port', PORT);
    console.log('Ready to process Korean and English math commands');
    console.log('Endpoints: /process, /context, /health');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const result = processor.processCommand(data.text);
            ws.send(JSON.stringify(result));
        } catch (error) {
            ws.send(JSON.stringify({ error: error.message }));
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

export default app;
