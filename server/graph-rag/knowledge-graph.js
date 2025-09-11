import neo4j from 'neo4j-driver';
import fs from 'fs';
import path from 'path';

class AEKnowledgeGraph {
    constructor() {
        this.driver = null;
        this.ontology = null;
        this.session = null;
    }

    async initialize() {
        // Load ontology
        const ontologyPath = path.join(process.cwd(), 'ae-ontology.json');
        this.ontology = JSON.parse(fs.readFileSync(ontologyPath, 'utf8'));
        
        // Connect to Neo4j
        this.driver = neo4j.driver(
            'bolt://localhost:7687',
            neo4j.auth.basic('neo4j', 'aemax2025')
        );
        
        await this.setupSchema();
    }

    async setupSchema() {
        const session = this.driver.session();
        
        try {
            // Create constraints and indexes
            for (const entity of this.ontology.entities) {
                await session.run(
                    `CREATE CONSTRAINT IF NOT EXISTS FOR (n:${entity.name}) REQUIRE n.name IS UNIQUE`
                );
            }
            
            // Populate base knowledge
            await this.populateBaseKnowledge();
        } finally {
            await session.close();
        }
    }

    async populateBaseKnowledge() {
        const session = this.driver.session();
        
        try {
            // Create basic AE structure nodes
            const aeStructure = {
                effects: ['Wiggle', 'Glow', 'Blur', 'Drop Shadow', 'Fractal Noise'],
                properties: ['Position', 'Scale', 'Rotation', 'Opacity', 'Anchor Point'],
                layerTypes: ['Text', 'Shape', 'Solid', 'Null', 'Camera']
            };

            for (const effect of aeStructure.effects) {
                await session.run(
                    'MERGE (e:Effect {name: $name, category: $category})',
                    { name: effect, category: 'Standard' }
                );
            }

            for (const prop of aeStructure.properties) {
                await session.run(
                    'MERGE (p:Property {name: $name, animated: false})',
                    { name: prop }
                );
            }
        } finally {
            await session.close();
        }
    }

    async parseIntent(text) {
        const session = this.driver.session();
        
        try {
            // Extract entities from text
            const entities = await this.extractEntities(text);
            
            // Build graph query
            const query = this.buildGraphQuery(entities);
            
            // Execute and return structured intent
            const result = await session.run(query);
            
            return this.formatIntent(result.records);
        } finally {
            await session.close();
        }
    }

    extractEntities(text) {
        const words = text.toLowerCase().split(' ');
        const entities = {
            action: null,
            effect: null,
            property: null,
            layerType: null,
            target: null
        };

        // Match action verbs
        for (const [intent, verbs] of Object.entries(this.ontology.intents)) {
            if (verbs.some(verb => words.includes(verb))) {
                entities.action = intent;
                break;
            }
        }

        // Match effect names
        const effectNames = ['wiggle', 'glow', 'blur', 'shadow'];
        entities.effect = effectNames.find(e => text.toLowerCase().includes(e));

        // Match layer types
        const layerTypes = ['text', 'shape', 'solid', 'null'];
        entities.layerType = layerTypes.find(t => text.toLowerCase().includes(t));

        return entities;
    }

    buildGraphQuery(entities) {
        let query = 'MATCH ';
        const params = [];

        if (entities.effect) {
            params.push(`(e:Effect {name: '${entities.effect}'})`);
        }
        if (entities.layerType) {
            params.push(`(l:Layer {type: '${entities.layerType}'})`);
        }

        query += params.join(', ');
        query += ' RETURN *';

        return query;
    }

    formatIntent(records) {
        return {
            action: records[0]?.get('action') || 'CREATE',
            target: records[0]?.get('target') || 'layer',
            parameters: records[0]?.get('parameters') || {},
            confidence: 0.95
        };
    }

    async close() {
        await this.driver.close();
    }
}

export default AEKnowledgeGraph;
