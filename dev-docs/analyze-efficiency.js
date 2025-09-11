import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsPath = __dirname;

function analyzeDocuments() {
    const docAnalysis = {};
    const contentHashes = {};
    
    const files = fs.readdirSync(docsPath)
        .filter(f => f.endsWith('.md') && !f.startsWith('.'));
    
    files.forEach(file => {
        try {
            const filePath = path.join(docsPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
            
            const info = {
                file,
                size: content.length,
                lines: content.split('\n').length,
                hash,
                topics: extractTopics(content),
                priority: determinePriority(file, content)
            };
            
            docAnalysis[file] = info;            
            if (!contentHashes[hash]) contentHashes[hash] = [];
            contentHashes[hash].push(file);
            
        } catch (e) {
            console.error(`Error reading ${file}:`, e.message);
        }
    });
    
    const duplicates = Object.entries(contentHashes)
        .filter(([h, files]) => files.length > 1)
        .reduce((acc, [h, files]) => ({ ...acc, [h]: files }), {});
    
    return { docAnalysis, duplicates };
}

function extractTopics(content) {
    const topics = [];
    const patterns = {
        migration: ['migration', 'migrate', 'websocket', 'Windows ML', 'CEP', 'UXP'],
        gesture: ['gesture', 'recognition', 'hand', 'tracking'],
        optimization: ['optimization', 'performance', 'benchmark'],
        architecture: ['architecture', 'design', 'structure'],
        implementation: ['implementation', 'roadmap', 'plan']
    };
    
    const contentLower = content.toLowerCase();    
    Object.entries(patterns).forEach(([topic, keywords]) => {
        if (keywords.some(kw => contentLower.includes(kw.toLowerCase()))) {
            topics.push(topic);
        }
    });
    
    return topics;
}

function determinePriority(filename, content) {
    const highPriority = [
        '11-websocket-performance-optimization.md',
        '12-windows-ml-migration.md', 
        '10-platform-migration-strategy.md',
        'index.md',
        '01-AGENT-GUIDELINES.md'
    ];
    
    if (highPriority.includes(filename)) return 'HIGH';
    if (filename.toLowerCase().includes('gesture') || content.includes('COMPLETED')) return 'LOW';
    return 'MEDIUM';
}

function createEfficientIndex() {
    const { docAnalysis, duplicates } = analyzeDocuments();
    
    const index = {
        high_priority: [],
        medium_priority: [],
        low_priority: [],
        duplicates,
        topic_map: {}
    };
    
    Object.entries(docAnalysis).forEach(([doc, info]) => {
        const priorityKey = `${info.priority.toLowerCase()}_priority`;
        index[priorityKey].push({
            file: doc,
            topics: info.topics,
            size: info.size
        });
        
        info.topics.forEach(topic => {
            if (!index.topic_map[topic]) index.topic_map[topic] = [];
            index.topic_map[topic].push(doc);
        });
    });
    
    return index;
}

function generateAIAgentConfig(index) {
    return {
        version: '3.4.0',
        agent: 'AE Claude Max',
        workflow: {
            primary_docs: index.high_priority.slice(0, 5),
            reference_docs: index.medium_priority.slice(0, 3),
            skip_docs: index.low_priority
        },
        active_migrations: {
            uwebsockets: { progress: 15, doc: '11-websocket-performance-optimization.md' },
            windows_ml: { progress: 30, doc: '12-windows-ml-migration.md' },
            cep_uxp: { progress: 60, doc: '10-platform-migration-strategy.md' }
        },
        memory_optimization: {
            max_docs_in_memory: 5,
            rotation_strategy: 'LRU',
            cache_completed: false
        }
    };
}

// Main execution
console.log(' Analyzing dev-docs for efficiency...\n');

const index = createEfficientIndex();
const config = generateAIAgentConfig(index);

// Save results
const outputPath = path.join(docsPath, 'ai-agent-efficient-config.json');
fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));

console.log('✅ Analysis complete!');
console.log(` Found ${Object.keys(index.duplicates).length} duplicate groups`);
console.log(` High Priority: ${index.high_priority.length} docs`);
console.log(` Medium Priority: ${index.medium_priority.length} docs`);
console.log(` Low Priority: ${index.low_priority.length} docs`);

console.log('\n Recommended workflow:');
config.workflow.primary_docs.slice(0, 3).forEach((doc, i) => {
    console.log(`  ${i + 1}. ${doc.file}`);
});

console.log('\n Active Migrations:');
Object.entries(config.active_migrations).forEach(([name, info]) => {
    console.log(`  • ${name}: ${info.progress}% - ${info.doc}`);
});

console.log(`\n Config saved to: ${outputPath}`);