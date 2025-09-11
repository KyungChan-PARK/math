/**
 * Math Education Ontology for AE Claude Max
 * Connects mathematical concepts with visual representations
 * @version 3.5.0-edu
 */

import neo4j from 'neo4j-driver';

class MathEducationOntology {
    constructor() {
        this.driver = neo4j.driver(
            'neo4j://localhost:7687',
            neo4j.auth.basic('neo4j', 'aeclaudemax')
        );
    }

    async initialize() {
        const session = this.driver.session();
        try {
            // Create Math Education node types
            const mathOntology = {
                concepts: [
                    { name: 'Triangle', properties: ['vertices', 'angles', 'sides'] },
                    { name: 'Angle', properties: ['degree', 'type', 'label'] },
                    { name: 'Side', properties: ['length', 'label', 'style'] },
                    { name: 'Vertex', properties: ['position', 'label', 'highlight'] },
                    { name: 'Transformation', properties: ['type', 'parameters'] },
                    { name: 'Animation', properties: ['duration', 'easing', 'property'] }
                ],
                gestures: [
                    { name: 'PINCH', action: 'RESIZE', target: 'Shape' },
                    { name: 'SPREAD', action: 'ROTATE', target: 'Angle' },
                    { name: 'GRAB', action: 'MOVE', target: 'Position' },
                    { name: 'POINT', action: 'SELECT', target: 'Vertex' },
                    { name: 'DRAW', action: 'CREATE', target: 'Shape' }
                ],
                commands: [
                    { phrase: 'draw triangle', action: 'CREATE_TRIANGLE' },
                    { phrase: 'show angles', action: 'DISPLAY_ANGLES' },
                    { phrase: 'measure sides', action: 'SHOW_MEASUREMENTS' },
                    { phrase: 'rotate by', action: 'ROTATE_SHAPE' },
                    { phrase: 'make isosceles', action: 'TRANSFORM_ISOSCELES' }
                ]
            };

            // Create concept nodes
            for (const concept of mathOntology.concepts) {
                await session.run(
                    `CREATE (c:MathConcept {
                        name: $name,
                        properties: $properties,
                        created: datetime()
                    })`,
                    { 
                        name: concept.name, 
                        properties: concept.properties 
                    }
                );
            }

            // Create gesture nodes
            for (const gesture of mathOntology.gestures) {
                await session.run(
                    `CREATE (g:Gesture {
                        name: $name,
                        action: $action,
                        target: $target,
                        created: datetime()
                    })`,
                    gesture
                );
            }

            // Create command nodes
            for (const command of mathOntology.commands) {
                await session.run(
                    `CREATE (c:Command {
                        phrase: $phrase,
                        action: $action,
                        created: datetime()
                    })`,
                    command
                );
            }

            // Create relationships
            await this.createRelationships(session);

            console.log('✅ Math Education Ontology initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Error initializing ontology:', error);
            throw error;
        } finally {
            await session.close();
        }
    }

    async createRelationships(session) {
        // Link Triangle to its components
        await session.run(`
            MATCH (t:MathConcept {name: 'Triangle'})
            MATCH (a:MathConcept {name: 'Angle'})
            MATCH (s:MathConcept {name: 'Side'})
            MATCH (v:MathConcept {name: 'Vertex'})
            CREATE (t)-[:HAS_COMPONENT]->(a)
            CREATE (t)-[:HAS_COMPONENT]->(s)
            CREATE (t)-[:HAS_COMPONENT]->(v)
        `);

        // Link gestures to concepts
        await session.run(`
            MATCH (g:Gesture {name: 'PINCH'})
            MATCH (t:MathConcept {name: 'Triangle'})
            CREATE (g)-[:CONTROLS]->(t)
        `);

        // Link commands to actions
        await session.run(`
            MATCH (c:Command {phrase: 'draw triangle'})
            MATCH (t:MathConcept {name: 'Triangle'})
            CREATE (c)-[:CREATES]->(t)
        `);
    }

    async processTeacherCommand(naturalLanguage) {
        const session = this.driver.session();
        try {
            // Find matching command
            const result = await session.run(
                `MATCH (c:Command)
                 WHERE c.phrase CONTAINS $phrase
                 RETURN c.action as action`,
                { phrase: naturalLanguage.toLowerCase() }
            );

            if (result.records.length > 0) {
                const action = result.records[0].get('action');
                return this.generateExtendScript(action);
            }

            return null;
        } finally {
            await session.close();
        }
    }

    async processGesture(gestureType, parameters) {
        const session = this.driver.session();
        try {
            // Find gesture action
            const result = await session.run(
                `MATCH (g:Gesture {name: $gesture})
                 RETURN g.action as action, g.target as target`,
                { gesture: gestureType }
            );

            if (result.records.length > 0) {
                const action = result.records[0].get('action');
                const target = result.records[0].get('target');
                return this.applyGestureAction(action, target, parameters);
            }

            return null;
        } finally {
            await session.close();
        }
    }

    generateExtendScript(action) {
        const scripts = {
            CREATE_TRIANGLE: `
                var comp = app.project.activeItem;
                var triangle = comp.layers.addShape();
                triangle.name = "Triangle";
                
                var shapeGroup = triangle.property("Contents").addProperty("ADBE Vector Group");
                var shapePath = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Star");
                
                shapePath.property("Type").setValue(2); // Polygon
                shapePath.property("Points").setValue(3); // Triangle
                shapePath.property("Position").setValue([640, 360]);
                shapePath.property("Outer Radius").setValue(150);
            `,
            DISPLAY_ANGLES: `
                // Add angle indicators
                var angleLayer = comp.layers.addText();
                angleLayer.property("Source Text").setValue("60°");
                angleLayer.position.setValue([600, 250]);
            `,
            SHOW_MEASUREMENTS: `
                // Add side measurements
                var measureLayer = comp.layers.addText();
                measureLayer.property("Source Text").setValue("10 cm");
                measureLayer.position.setValue([640, 450]);
            `
        };

        return scripts[action] || null;
    }

    applyGestureAction(action, target, params) {
        return {
            action: action,
            target: target,
            parameters: params,
            script: `// Apply ${action} to ${target}`
        };
    }

    async getVisualizationSuggestions(topic) {
        const session = this.driver.session();
        try {
            const result = await session.run(
                `MATCH (c:MathConcept)
                 WHERE c.name CONTAINS $topic
                 MATCH (c)-[:HAS_COMPONENT]->(comp)
                 RETURN c.name as concept, collect(comp.name) as components`,
                { topic: topic }
            );

            return result.records.map(r => ({
                concept: r.get('concept'),
                components: r.get('components')
            }));
        } finally {
            await session.close();
        }
    }

    async close() {
        await this.driver.close();
    }
}

// Test the ontology
async function main() {
    const ontology = new MathEducationOntology();
    
    try {
        await ontology.initialize();
        
        // Test command processing
        const script = await ontology.processTeacherCommand("draw triangle");
        console.log('Generated script:', script);
        
        // Test gesture processing
        const gesture = await ontology.processGesture('PINCH', { scale: 1.5 });
        console.log('Gesture action:', gesture);
        
        // Get suggestions
        const suggestions = await ontology.getVisualizationSuggestions('Triangle');
        console.log('Visualization suggestions:', suggestions);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await ontology.close();
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default MathEducationOntology;