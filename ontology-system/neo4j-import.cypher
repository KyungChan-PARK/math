
CREATE (n:Document {
    name: '00-UNIFIED-ARCHITECTURE',
    layer: 'L0_Core',
    ports: [8080, 8081, 9000],
    created: datetime()
})

CREATE (n:Document {
    name: '01-AGENT-GUIDELINES',
    layer: 'L0_Core',
    ports: [],
    created: datetime()
})

CREATE (n:Document {
    name: '06-VIBE-CODING-METHODOLOGY',
    layer: 'L1_Integration',
    ports: [],
    created: datetime()
})

CREATE (n:Document {
    name: '08-REALTIME-INTERACTION',
    layer: 'L1_Integration',
    ports: [8080],
    created: datetime()
})

CREATE (n:Document {
    name: '13-GESTURE-RECOGNITION-ARCHITECTURE',
    layer: 'L2_Feature',
    ports: [],
    created: datetime()
})

CREATE (n:Document {
    name: '09-IMPLEMENTATION-ROADMAP',
    layer: 'L3_Implementation',
    ports: [8080],
    created: datetime()
})

CREATE (n:Document {
    name: '14-GESTURE-IMPLEMENTATION-ROADMAP',
    layer: 'L3_Implementation',
    ports: [8081, 8086],
    created: datetime()
})

MATCH (a:Document {name: '00-UNIFIED-ARCHITECTURE'})
MATCH (b:Document {name: '01-AGENT-GUIDELINES'})
CREATE (a)-[:DEFINES]->(b)

MATCH (a:Document {name: '00-UNIFIED-ARCHITECTURE'})
MATCH (b:Document {name: '06-VIBE-CODING-METHODOLOGY'})
CREATE (a)-[:DEFINES]->(b)

MATCH (a:Document {name: '00-UNIFIED-ARCHITECTURE'})
MATCH (b:Document {name: '08-REALTIME-INTERACTION'})
CREATE (a)-[:DEFINES]->(b)

MATCH (a:Document {name: '00-UNIFIED-ARCHITECTURE'})
MATCH (b:Document {name: '11-WEBSOCKET-PERFORMANCE'})
CREATE (a)-[:DEFINES]->(b)

MATCH (a:Document {name: '00-UNIFIED-ARCHITECTURE'})
MATCH (b:Document {name: '12-WINDOWS-ML-MIGRATION'})
CREATE (a)-[:DEFINES]->(b)

MATCH (a:Document {name: '00-UNIFIED-ARCHITECTURE'})
MATCH (b:Document {name: '13-GESTURE-RECOGNITION-ARCHITECTURE'})
CREATE (a)-[:DEFINES]->(b)

MATCH (a:Document {name: '00-UNIFIED-ARCHITECTURE'})
MATCH (b:Document {name: '09-IMPLEMENTATION-ROADMAP'})
CREATE (a)-[:DEFINES]->(b)

MATCH (a:Document {name: '00-UNIFIED-ARCHITECTURE'})
MATCH (b:Document {name: '10-PLATFORM-MIGRATION-STRATEGY'})
CREATE (a)-[:DEFINES]->(b)

MATCH (a:Document {name: '00-UNIFIED-ARCHITECTURE'})
MATCH (b:Document {name: '14-GESTURE-IMPLEMENTATION-ROADMAP'})
CREATE (a)-[:DEFINES]->(b)

MATCH (a:Document {name: '01-AGENT-GUIDELINES'})
MATCH (b:Document {name: '00-UNIFIED-ARCHITECTURE'})
CREATE (a)-[:GOVERNS]->(b)

MATCH (a:Document {name: '01-AGENT-GUIDELINES'})
MATCH (b:Document {name: '06-VIBE-CODING-METHODOLOGY'})
CREATE (a)-[:GOVERNS]->(b)

MATCH (a:Document {name: '01-AGENT-GUIDELINES'})
MATCH (b:Document {name: '08-REALTIME-INTERACTION'})
CREATE (a)-[:GOVERNS]->(b)

MATCH (a:Document {name: '01-AGENT-GUIDELINES'})
MATCH (b:Document {name: '11-WEBSOCKET-PERFORMANCE'})
CREATE (a)-[:GOVERNS]->(b)

MATCH (a:Document {name: '01-AGENT-GUIDELINES'})
MATCH (b:Document {name: '12-WINDOWS-ML-MIGRATION'})
CREATE (a)-[:GOVERNS]->(b)

MATCH (a:Document {name: '01-AGENT-GUIDELINES'})
MATCH (b:Document {name: '13-GESTURE-RECOGNITION-ARCHITECTURE'})
CREATE (a)-[:GOVERNS]->(b)

MATCH (a:Document {name: '01-AGENT-GUIDELINES'})
MATCH (b:Document {name: '09-IMPLEMENTATION-ROADMAP'})
CREATE (a)-[:GOVERNS]->(b)

MATCH (a:Document {name: '01-AGENT-GUIDELINES'})
MATCH (b:Document {name: '10-PLATFORM-MIGRATION-STRATEGY'})
CREATE (a)-[:GOVERNS]->(b)

MATCH (a:Document {name: '01-AGENT-GUIDELINES'})
MATCH (b:Document {name: '14-GESTURE-IMPLEMENTATION-ROADMAP'})
CREATE (a)-[:GOVERNS]->(b)

MATCH (a:Document {name: '06-VIBE-CODING-METHODOLOGY'})
MATCH (b:Document {name: '08-REALTIME-INTERACTION'})
CREATE (a)-[:USES]->(b)

MATCH (a:Document {name: '08-REALTIME-INTERACTION'})
MATCH (b:Document {name: '11-WEBSOCKET-PERFORMANCE'})
CREATE (a)-[:REQUIRES]->(b)

MATCH (a:Document {name: '13-GESTURE-RECOGNITION-ARCHITECTURE'})
MATCH (b:Document {name: '08-REALTIME-INTERACTION'})
CREATE (a)-[:IMPLEMENTS]->(b)