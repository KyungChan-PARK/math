import AEKnowledgeGraph from './knowledge-graph.js';

class GraphRAGNLPEngine {
    constructor() {
        this.graph = new AEKnowledgeGraph();
        this.initialized = false;
    }

    async initialize() {
        await this.graph.initialize();
        this.initialized = true;
        console.log('✅ GraphRAG NLP Engine initialized');
    }

    async parse(text) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        // GraphRAG replaces regex patterns
        const intent = await this.graph.parseIntent(text);
        
        // Enhanced with graph relationships
        const enhanced = await this.enhanceWithRelationships(intent);
        
        return {
            originalText: text,
            intent: enhanced.action,
            entities: enhanced.entities,
            extendScript: await this.generateExtendScript(enhanced),
            confidence: enhanced.confidence || 0.95
        };
    }

    async enhanceWithRelationships(intent) {
        // Graph traversal for related concepts
        const session = this.graph.driver.session();
        
        try {
            const result = await session.run(`
                MATCH (e:Effect)-[r:CONTROLS]->(p:Property)
                WHERE e.name = $effect
                RETURN p.name as property
            `, { effect: intent.effect || 'Wiggle' });
            
            intent.relatedProperties = result.records.map(r => r.get('property'));
            return intent;
        } finally {
            await session.close();
        }
    }

    async generateExtendScript(intent) {
        const scripts = {
            CREATE: (e) => `app.project.activeItem.layers.addText("${e.target || 'New Layer'}");`,
            ANIMATE: (e) => `layer.property("Transform").property("Position").expression = "wiggle(2,50);";`,
            TRANSFORM: (e) => `layer.property("Transform").property("${e.property}").setValue(${e.value});`,
            STYLE: (e) => `layer.property("Effects").addProperty("${e.effect}");`
        };
        
        return scripts[intent.action]?.(intent) || '// Unknown command';
    }
}

// Direct replacement for current regex-based system
export default GraphRAGNLPEngine;
