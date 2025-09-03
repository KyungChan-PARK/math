/**
 * ExtendScript Generator for After Effects Automation
 * 
 * This module converts parsed natural language intents into executable ExtendScript code
 * for After Effects. It generates safe, optimized scripts with proper error handling.
 * 
 * Key Features:
 * - Template-based script generation for consistency
 * - Parameter validation and sanitization
 * - Undo group support for safe execution
 * - Performance optimizations for batch operations
 * - Compatibility with After Effects CC 2024+
 * 
 * Performance Targets:
 * - Script generation: <5ms per command
 * - Template caching for instant common operations
 * - Batch operation optimization for multiple commands
 * 
 * @module ScriptGenerator
 * @version 3.3.0
 */

class ScriptGenerator {
    constructor() {
        // Initialize script templates for common operations
        this.templates = this.loadTemplates();
        
        // Cache for frequently generated scripts
        this.scriptCache = new Map();
        this.cacheSize = 100; // Maximum cached scripts
        
        // Safety validators
        this.validators = this.initializeValidators();
        
        // Performance metrics
        this.metrics = {
            scriptsGenerated: 0,
            cacheHits: 0,
            averageGenerationTime: 0
        };
    }
    
    /**
     * Load ExtendScript templates for various operations
     * These templates ensure consistent, safe script generation
     */
    loadTemplates() {
        return {
            // Shape creation templates
            CREATE: {
                circle: (params) => `
                    // Create a circle shape layer
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        alert("Please select a composition first");
                        null;
                    } else {
                        app.beginUndoGroup("Create Circle");
                        
                        var shapeLayer = comp.layers.addShape();
                        shapeLayer.name = "${this.sanitize(params.name || 'Circle')}";
                        
                        var shapeContents = shapeLayer.property("Contents");
                        var shapeGroup = shapeContents.addProperty("ADBE Vector Group");
                        
                        // Add ellipse
                        var ellipse = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Ellipse");
                        ellipse.property("Size").setValue([${params.size || 200}, ${params.size || 200}]);
                        
                        // Add fill
                        var fill = shapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
                        fill.property("Color").setValue(${this.colorToRGBA(params.color)});
                        
                        // Set position
                        shapeLayer.transform.position.setValue(${this.positionToCoords(params.position)});
                        
                        app.endUndoGroup();
                        
                        shapeLayer.index; // Return layer index
                    }
                `,
                
                square: (params) => `
                    // Create a square shape layer
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        alert("Please select a composition first");
                        null;
                    } else {
                        app.beginUndoGroup("Create Square");
                        
                        var shapeLayer = comp.layers.addShape();
                        shapeLayer.name = "${this.sanitize(params.name || 'Square')}";
                        
                        var shapeContents = shapeLayer.property("Contents");
                        var shapeGroup = shapeContents.addProperty("ADBE Vector Group");
                        
                        // Add rectangle
                        var rect = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Rect");
                        rect.property("Size").setValue([${params.size || 200}, ${params.size || 200}]);
                        
                        // Add fill
                        var fill = shapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
                        fill.property("Color").setValue(${this.colorToRGBA(params.color)});
                        
                        // Set position
                        shapeLayer.transform.position.setValue(${this.positionToCoords(params.position)});
                        
                        app.endUndoGroup();
                        
                        shapeLayer.index; // Return layer index
                    }
                `,
                
                triangle: (params) => `
                    // Create a triangle shape layer
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        alert("Please select a composition first");
                        null;
                    } else {
                        app.beginUndoGroup("Create Triangle");
                        
                        var shapeLayer = comp.layers.addShape();
                        shapeLayer.name = "${this.sanitize(params.name || 'Triangle')}";
                        
                        var shapeContents = shapeLayer.property("Contents");
                        var shapeGroup = shapeContents.addProperty("ADBE Vector Group");
                        
                        // Add star/polygon for triangle
                        var star = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Star");
                        star.property("Type").setValue(1); // Polygon type
                        star.property("Points").setValue(3); // 3 points for triangle
                        star.property("Outer Radius").setValue(${params.size || 100});
                        
                        // Add fill
                        var fill = shapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
                        fill.property("Color").setValue(${this.colorToRGBA(params.color)});
                        
                        // Set position
                        shapeLayer.transform.position.setValue(${this.positionToCoords(params.position)});
                        
                        app.endUndoGroup();
                        
                        shapeLayer.index; // Return layer index
                    }
                `,
                
                star: (params) => `
                    // Create a star shape layer
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        alert("Please select a composition first");
                        null;
                    } else {
                        app.beginUndoGroup("Create Star");
                        
                        var shapeLayer = comp.layers.addShape();
                        shapeLayer.name = "${this.sanitize(params.name || 'Star')}";
                        
                        var shapeContents = shapeLayer.property("Contents");
                        var shapeGroup = shapeContents.addProperty("ADBE Vector Group");
                        
                        // Add star
                        var star = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Star");
                        star.property("Type").setValue(2); // Star type
                        star.property("Points").setValue(${params.points || 5});
                        star.property("Outer Radius").setValue(${params.size || 100});
                        star.property("Inner Radius").setValue(${(params.size || 100) * 0.4});
                        
                        // Add fill
                        var fill = shapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
                        fill.property("Color").setValue(${this.colorToRGBA(params.color)});
                        
                        // Set position
                        shapeLayer.transform.position.setValue(${this.positionToCoords(params.position)});
                        
                        app.endUndoGroup();
                        
                        shapeLayer.index; // Return layer index
                    }
                `,
                
                text: (params) => `
                    // Create a text layer
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        alert("Please select a composition first");
                        null;
                    } else {
                        app.beginUndoGroup("Create Text");
                        
                        var textLayer = comp.layers.addText("${this.sanitize(params.text || 'Text')}");
                        textLayer.name = "${this.sanitize(params.name || 'Text Layer')}";
                        
                        // Set text properties
                        var textProp = textLayer.property("Source Text");
                        var textDocument = textProp.value;
                        textDocument.fontSize = ${params.size || 50};
                        textDocument.fillColor = ${this.colorToRGBA(params.color)};
                        textDocument.font = "${params.font || 'Arial'}";
                        textProp.setValue(textDocument);
                        
                        // Set position
                        textLayer.transform.position.setValue(${this.positionToCoords(params.position)});
                        
                        app.endUndoGroup();
                        
                        textLayer.index; // Return layer index
                    }
                `
            },
            
            // Movement templates
            MOVE: {
                absolute: (params) => `
                    // Move layer to absolute position
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        alert("Please select a composition first");
                        null;
                    } else {
                        app.beginUndoGroup("Move Layer");
                        
                        var targetLayer = ${this.getTargetLayer(params.target)};
                        if (targetLayer) {
                            targetLayer.transform.position.setValue(${this.positionToCoords(params.destination)});
                        }
                        
                        app.endUndoGroup();
                    }
                `,
                
                relative: (params) => `
                    // Move layer by relative amount
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        alert("Please select a composition first");
                        null;
                    } else {
                        app.beginUndoGroup("Move Layer");
                        
                        var targetLayer = ${this.getTargetLayer(params.target)};
                        if (targetLayer) {
                            var currentPos = targetLayer.transform.position.value;
                            var delta = ${this.directionToDelta(params.direction, params.distance)};
                            targetLayer.transform.position.setValue([
                                currentPos[0] + delta[0],
                                currentPos[1] + delta[1]
                            ]);
                        }
                        
                        app.endUndoGroup();
                    }
                `
            },
            
            // Transformation templates
            TRANSFORM: {
                scale: (params) => `
                    // Scale layer
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        alert("Please select a composition first");
                        null;
                    } else {
                        app.beginUndoGroup("Scale Layer");
                        
                        var targetLayer = ${this.getTargetLayer(params.target)};
                        if (targetLayer) {
                            var scaleValue = ${this.calculateScale(params.amount, params.units)};
                            targetLayer.transform.scale.setValue([scaleValue, scaleValue]);
                        }
                        
                        app.endUndoGroup();
                    }
                `,
                
                rotate: (params) => `
                    // Rotate layer
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        alert("Please select a composition first");
                        null;
                    } else {
                        app.beginUndoGroup("Rotate Layer");
                        
                        var targetLayer = ${this.getTargetLayer(params.target)};
                        if (targetLayer) {
                            var currentRotation = targetLayer.transform.rotation.value;
                            targetLayer.transform.rotation.setValue(currentRotation + ${params.amount || 45});
                        }
                        
                        app.endUndoGroup();
                    }
                `,
                
                flip: (params) => `
                    // Flip layer
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        alert("Please select a composition first");
                        null;
                    } else {
                        app.beginUndoGroup("Flip Layer");
                        
                        var targetLayer = ${this.getTargetLayer(params.target)};
                        if (targetLayer) {
                            var currentScale = targetLayer.transform.scale.value;
                            ${params.direction === 'horizontal' ? 
                                'targetLayer.transform.scale.setValue([-currentScale[0], currentScale[1]]);' :
                                'targetLayer.transform.scale.setValue([currentScale[0], -currentScale[1]]);'
                            }
                        }
                        
                        app.endUndoGroup();
                    }
                `
            },
            
            // Animation templates
            ANIMATE: {
                wiggle: (params) => `
                    // Add wiggle animation
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        alert("Please select a composition first");
                        null;
                    } else {
                        app.beginUndoGroup("Add Wiggle");
                        
                        var targetLayer = ${this.getTargetLayer(params.target)};
                        if (targetLayer) {
                            targetLayer.transform.position.expression = 
                                "wiggle(${params.frequency || 5}, ${params.amplitude || 30})";
                        }
                        
                        app.endUndoGroup();
                    }
                `,
                
                bounce: (params) => `
                    // Add bounce animation
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        alert("Please select a composition first");
                        null;
                    } else {
                        app.beginUndoGroup("Add Bounce");
                        
                        var targetLayer = ${this.getTargetLayer(params.target)};
                        if (targetLayer) {
                            // Add bounce expression
                            var expression = 
                                "n = 0;\\n" +
                                "if (numKeys > 0){\\n" +
                                "  n = nearestKey(time).index;\\n" +
                                "  if (key(n).time > time) n--;\\n" +
                                "}\\n" +
                                "if (n > 0){\\n" +
                                "  t = time - key(n).time;\\n" +
                                "  amp = velocityAtTime(key(n).time - 0.001);\\n" +
                                "  w = 2 * Math.PI * ${params.frequency || 2.5};\\n" +
                                "  value + amp * Math.sin(t * w) / Math.exp(t * ${params.decay || 4});\\n" +
                                "} else value;";
                            
                            targetLayer.transform.position.expression = expression;
                        }
                        
                        app.endUndoGroup();
                    }
                `,
                
                pulse: (params) => `
                    // Add pulse animation
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        alert("Please select a composition first");
                        null;
                    } else {
                        app.beginUndoGroup("Add Pulse");
                        
                        var targetLayer = ${this.getTargetLayer(params.target)};
                        if (targetLayer) {
                            targetLayer.transform.scale.expression = 
                                "s = ${params.baseScale || 100};\\n" +
                                "amp = ${params.amplitude || 10};\\n" +
                                "freq = ${params.frequency || 2};\\n" +
                                "[s + Math.sin(time * freq * Math.PI * 2) * amp, " +
                                "s + Math.sin(time * freq * Math.PI * 2) * amp]";
                        }
                        
                        app.endUndoGroup();
                    }
                `
            }
        };
    }
    
    /**
     * Initialize parameter validators for safety
     */
    initializeValidators() {
        return {
            name: (value) => {
                // Remove dangerous characters from names
                return String(value).replace(/[<>\"\'\\\/\0]/g, '');
            },
            
            number: (value, min = -Infinity, max = Infinity) => {
                const num = parseFloat(value);
                if (isNaN(num)) return 0;
                return Math.max(min, Math.min(max, num));
            },
            
            color: (value) => {
                // Validate color values
                const validColors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 
                                   'pink', 'black', 'white', 'gray', 'cyan', 'magenta'];
                return validColors.includes(value) ? value : 'white';
            },
            
            position: (value) => {
                const validPositions = ['center', 'top', 'bottom', 'left', 'right',
                                       'top-left', 'top-right', 'bottom-left', 'bottom-right'];
                return validPositions.includes(value) ? value : 'center';
            }
        };
    }
    
    /**
     * Generate ExtendScript from parsed intent and parameters
     * @param {Object} parsedInput - Parsed NLP result
     * @returns {Object} Generated script and metadata
     */
    generate(parsedInput) {
        const startTime = Date.now();
        
        try {
            // Check cache first for performance
            const cacheKey = this.getCacheKey(parsedInput);
            if (this.scriptCache.has(cacheKey)) {
                this.metrics.cacheHits++;
                return this.scriptCache.get(cacheKey);
            }
            
            // Validate and prepare parameters
            const validatedParams = this.validateParameters(parsedInput.parameters, parsedInput.intent);
            
            // Generate script based on intent
            const script = this.generateScript(parsedInput.intent, validatedParams, parsedInput.entities);
            
            // Wrap script with safety checks
            const safeScript = this.wrapWithSafety(script);
            
            // Create result object
            const result = {
                script: safeScript,
                intent: parsedInput.intent,
                parameters: validatedParams,
                generationTime: Date.now() - startTime,
                cached: false
            };
            
            // Cache the result
            this.cacheScript(cacheKey, result);
            
            // Update metrics
            this.updateMetrics(Date.now() - startTime);
            
            return result;
            
        } catch (error) {
            console.error('Error generating script:', error);
            
            return {
                script: this.generateErrorScript(error.message),
                intent: parsedInput.intent,
                error: error.message,
                generationTime: Date.now() - startTime
            };
        }
    }
    
    /**
     * Generate the actual ExtendScript code
     */
    generateScript(intent, params, entities) {
        const intentTemplates = this.templates[intent];
        
        if (!intentTemplates) {
            throw new Error(`No templates found for intent: ${intent}`);
        }
        
        // Select appropriate template based on parameters
        let templateKey = 'default';
        
        if (intent === 'CREATE') {
            // Determine shape type
            const shapeType = this.determineShapeType(params.object, entities);
            templateKey = shapeType;
            
        } else if (intent === 'MOVE') {
            // Determine movement type
            templateKey = params.destination ? 'absolute' : 'relative';
            
        } else if (intent === 'TRANSFORM') {
            // Determine transform type
            templateKey = params.transformType || 'scale';
            
        } else if (intent === 'ANIMATE') {
            // Determine animation type
            templateKey = params.animationType || 'wiggle';
        }
        
        const template = intentTemplates[templateKey];
        
        if (!template) {
            throw new Error(`No template found for ${intent}.${templateKey}`);
        }
        
        // Generate script from template
        return template(params);
    }
    
    /**
     * Wrap script with safety checks and error handling
     */
    wrapWithSafety(script) {
        return `
        // AE Claude Max - Generated Script
        // Timestamp: ${new Date().toISOString()}
        // Intent: Safe execution with error handling
        
        (function() {
            try {
                // Check After Effects environment
                if (typeof app === 'undefined' || !app.project) {
                    throw new Error('This script must be run in After Effects');
                }
                
                // Store original state for potential rollback
                var originalSelection = [];
                for (var i = 0; i < app.project.selection.length; i++) {
                    originalSelection.push(app.project.selection[i]);
                }
                
                // Execute the generated script
                var result = (function() {
                    ${script}
                })();
                
                // Return success
                if (typeof result !== 'undefined') {
                    JSON.stringify({ success: true, result: result });
                } else {
                    JSON.stringify({ success: true });
                }
                
            } catch (error) {
                // Handle errors gracefully
                app.endUndoGroup(); // Close any open undo groups
                
                // Return error information
                JSON.stringify({ 
                    success: false, 
                    error: error.toString(),
                    line: error.line || 'unknown'
                });
            }
        })();
        `;
    }
    
    /**
     * Validate and sanitize parameters
     */
    validateParameters(params, intent) {
        const validated = {};
        
        for (const [key, value] of Object.entries(params)) {
            if (key === 'name' || key === 'text') {
                validated[key] = this.validators.name(value);
            } else if (key === 'size' || key === 'amount' || key === 'distance') {
                validated[key] = this.validators.number(value, 0, 10000);
            } else if (key === 'color') {
                validated[key] = this.validators.color(value);
            } else if (key === 'position' || key === 'destination') {
                validated[key] = this.validators.position(value);
            } else {
                validated[key] = value;
            }
        }
        
        return validated;
    }
    
    /**
     * Utility: Convert color name to RGBA array
     */
    colorToRGBA(colorName) {
        const colors = {
            red: [1, 0, 0, 1],
            green: [0, 1, 0, 1],
            blue: [0, 0, 1, 1],
            yellow: [1, 1, 0, 1],
            orange: [1, 0.5, 0, 1],
            purple: [0.5, 0, 1, 1],
            pink: [1, 0.5, 0.75, 1],
            black: [0, 0, 0, 1],
            white: [1, 1, 1, 1],
            gray: [0.5, 0.5, 0.5, 1],
            cyan: [0, 1, 1, 1],
            magenta: [1, 0, 1, 1]
        };
        
        return JSON.stringify(colors[colorName] || colors.white);
    }
    
    /**
     * Utility: Convert position name to coordinates
     */
    positionToCoords(position) {
        // This will be evaluated in the context of the composition
        const positions = {
            'center': '[comp.width/2, comp.height/2]',
            'top': '[comp.width/2, 100]',
            'bottom': '[comp.width/2, comp.height - 100]',
            'left': '[100, comp.height/2]',
            'right': '[comp.width - 100, comp.height/2]',
            'top-left': '[100, 100]',
            'top-right': '[comp.width - 100, 100]',
            'bottom-left': '[100, comp.height - 100]',
            'bottom-right': '[comp.width - 100, comp.height - 100]'
        };
        
        return positions[position] || positions.center;
    }
    
    /**
     * Utility: Convert direction to delta movement
     */
    directionToDelta(direction, distance = 100) {
        const directions = {
            'up': `[0, -${distance}]`,
            'down': `[0, ${distance}]`,
            'left': `[-${distance}, 0]`,
            'right': `[${distance}, 0]`
        };
        
        return directions[direction] || '[0, 0]';
    }
    
    /**
     * Utility: Get target layer selector
     */
    getTargetLayer(target) {
        if (target === 'selected' || target === 'it' || target === 'that') {
            return 'comp.selectedLayers[0]';
        } else if (target === 'all') {
            return 'comp.layers';
        } else {
            // Try to find by name
            return `comp.layer("${this.sanitize(target)}")`;
        }
    }
    
    /**
     * Utility: Calculate scale value
     */
    calculateScale(amount, units) {
        if (units === 'percent') {
            return amount;
        } else if (amount === 'bigger' || amount === 'larger') {
            return 150;
        } else if (amount === 'smaller') {
            return 50;
        } else {
            return amount || 100;
        }
    }
    
    /**
     * Utility: Determine shape type from parameters
     */
    determineShapeType(object, entities) {
        // Check direct shape names
        if (object) {
            if (object.includes('circle') || object.includes('ellipse')) return 'circle';
            if (object.includes('square') || object.includes('rectangle')) return 'square';
            if (object.includes('triangle')) return 'triangle';
            if (object.includes('star')) return 'star';
            if (object.includes('text')) return 'text';
        }
        
        // Check entities
        if (entities.shapes && entities.shapes.length > 0) {
            const shape = entities.shapes[0];
            if (shape === 'circle' || shape === 'ellipse') return 'circle';
            if (shape === 'square' || shape === 'rectangle') return 'square';
            if (shape === 'triangle') return 'triangle';
            if (shape === 'star') return 'star';
        }
        
        // Default to circle
        return 'circle';
    }
    
    /**
     * Utility: Sanitize string for safe script execution
     */
    sanitize(str) {
        if (!str) return '';
        return String(str)
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }
    
    /**
     * Generate cache key from parsed input
     */
    getCacheKey(parsedInput) {
        return `${parsedInput.intent}_${JSON.stringify(parsedInput.parameters)}`;
    }
    
    /**
     * Cache generated script
     */
    cacheScript(key, result) {
        // Implement LRU cache
        if (this.scriptCache.size >= this.cacheSize) {
            // Remove oldest entry
            const firstKey = this.scriptCache.keys().next().value;
            this.scriptCache.delete(firstKey);
        }
        
        this.scriptCache.set(key, { ...result, cached: true });
    }
    
    /**
     * Generate error script
     */
    generateErrorScript(errorMessage) {
        return `
        // Error occurred during script generation
        alert("Script generation error: ${this.sanitize(errorMessage)}");
        null;
        `;
    }
    
    /**
     * Update performance metrics
     */
    updateMetrics(generationTime) {
        this.metrics.scriptsGenerated++;
        
        // Update rolling average
        const count = this.metrics.scriptsGenerated;
        const currentAvg = this.metrics.averageGenerationTime;
        this.metrics.averageGenerationTime = 
            (currentAvg * (count - 1) + generationTime) / count;
    }
    
    /**
     * Get performance metrics
     */
    getMetrics() {
        const cacheHitRate = this.metrics.cacheHits / 
            Math.max(1, this.metrics.scriptsGenerated);
        
        return {
            scriptsGenerated: this.metrics.scriptsGenerated,
            cacheHitRate: cacheHitRate,
            averageGenerationTime: this.metrics.averageGenerationTime
        };
    }
}

export default ScriptGenerator;