// Palantir-style Ontology System Architecture Design
const http = require('http');

async function callQwenAPI() {
    const requestData = {
        agent: 'algebraExpert',
        task: 'Design a Palantir-style ontology system for Palantir Math project using Neo4j, Neosemantics, and LangChain. Focus on: 1) Semantic layer with RDF/OWL, 2) AI agent integration for natural language queries, 3) Dynamic file management and self-improvement system. Provide concrete implementation steps.',
        options: {
            maxTokens: 3000
        }
    };

    const data = JSON.stringify(requestData);

    const options = {
        hostname: 'localhost',
        port: 8093,
        path: '/api/agent/call',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(30000);
        req.write(data);
        req.end();
    });
}

// 실행
callQwenAPI().then(result => {
    console.log('=== Palantir-Style Ontology Architecture ===\n');
    if (result && result.result && result.result.response) {
        console.log(result.result.response);
    } else if (result && result.response) {
        console.log(result.response);
    } else {
        console.log('Full result:', JSON.stringify(result, null, 2));
    }
}).catch(error => {
    console.error('Error:', error);
});