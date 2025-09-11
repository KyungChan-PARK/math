#!/bin/bash

# Mathpix Integration Setup Script
# Installs required dependencies and configures the system

echo " Setting up Mathpix Integration for Math Learning Platform"
echo "============================================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo " Creating .env from template..."
    cp .env.example .env
    echo "️  Please add your Mathpix API credentials to .env file:"
    echo "   MATHPIX_APP_ID=your_app_id"
    echo "   MATHPIX_APP_KEY=your_app_key"
fi

# Install Node.js dependencies
echo " Installing Node.js dependencies..."
npm install axios form-data

# Update package.json scripts
echo " Updating package.json scripts..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

// Add Mathpix scripts
pkg.scripts = {
    ...pkg.scripts,
    'mathpix:test': 'node mathpix-integration.js process test/sample.png',
    'mathpix:process': 'node mathpix-integration.js process',
    'mathpix:init': 'node -e \"require(\\'./mathpix-integration.js\\').default.prototype.initialize()\"'
};

// Add dependencies if not present
pkg.dependencies = {
    ...pkg.dependencies,
    'axios': '^1.6.0',
    'form-data': '^4.0.0'
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ package.json updated');
"

# Create test directory
echo " Creating test directory..."
mkdir -p test/sat_samples

# Setup Neo4j indices for SAT problems
echo "️ Setting up Neo4j schema..."
cat << 'EOF' > setup-mathpix-neo4j.cypher
// Create constraints and indices for SAT problems
CREATE CONSTRAINT problem_id IF NOT EXISTS 
FOR (p:Problem) REQUIRE p.id IS UNIQUE;

CREATE INDEX problem_category IF NOT EXISTS 
FOR (p:Problem) ON (p.category);

CREATE INDEX problem_difficulty IF NOT EXISTS 
FOR (p:Problem) ON (p.difficulty);

CREATE INDEX equation_latex IF NOT EXISTS 
FOR (e:Equation) ON (e.latex);

// Create sample categories
MERGE (c1:Category {name: 'ALGEBRA'})
MERGE (c2:Category {name: 'GEOMETRY'})
MERGE (c3:Category {name: 'STATISTICS'})
MERGE (c4:Category {name: 'CALCULUS'})

// Create difficulty levels
MERGE (d1:Difficulty {level: 1, name: 'Easy'})
MERGE (d2:Difficulty {level: 2, name: 'Medium-Easy'})
MERGE (d3:Difficulty {level: 3, name: 'Medium'})
MERGE (d4:Difficulty {level: 4, name: 'Medium-Hard'})
MERGE (d5:Difficulty {level: 5, name: 'Hard'})

RETURN "Schema created successfully" as result;
EOF

# Run Neo4j setup (if Neo4j is running)
if command -v cypher-shell &> /dev/null; then
    echo " Applying Neo4j schema..."
    cypher-shell -u neo4j -p password < setup-mathpix-neo4j.cypher 2>/dev/null || echo "️  Neo4j not running, schema will be created on first run"
fi

# Create sample test file
echo " Creating sample test file..."
cat << 'EOF' > test/mathpix-test.js
/**
 * Mathpix Integration Test
 * Tests OCR and problem extraction capabilities
 */

import MathpixIntegrationService from '../mathpix-integration.js';

async function testMathpixIntegration() {
    console.log(' Testing Mathpix Integration...\n');
    
    const service = new MathpixIntegrationService();
    
    try {
        // Initialize
        await service.initialize();
        console.log('✅ Service initialized');
        
        // Test text with math
        const testText = {
            text: `1. Solve for x: $x^2 + 5x + 6 = 0$
            
            A) x = -2, -3
            B) x = 2, 3
            C) x = -1, -6
            D) x = 1, 6
            
            2. Find the area of a circle with radius $r = 5$.
            
            A) $25\pi$
            B) $10\pi$
            C) $5\pi$
            D) $50\pi$`,
            confidence: 0.95
        };
        
        // Extract problems
        const problems = await service.extractSATProblems(testText);
        console.log(`\n Extracted ${problems.length} problems:`);
        
        problems.forEach(p => {
            console.log(`\n  Problem #${p.number}:`);
            console.log(`  Category: ${p.category}`);
            console.log(`  Difficulty: ${p.difficulty}/5`);
            console.log(`  Type: ${p.type}`);
            console.log(`  Equations: ${p.equations.length}`);
            console.log(`  Choices: ${p.choices.length}`);
        });
        
        // Store problems
        await service.storeProblems(problems);
        console.log('\n✅ Problems stored in database');
        
        // Search similar
        const similar = await service.searchSimilarProblems(
            "quadratic equation",
            { category: 'ALGEBRA' }
        );
        console.log(`\n Found ${similar.length} similar problems`);
        
        // Get metrics
        const metrics = service.getMetrics();
        console.log('\n Metrics:', metrics);
        
        console.log('\n✅ All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await service.cleanup();
    }
}

// Run test
testMathpixIntegration().catch(console.error);
EOF

echo ""
echo "✅ Mathpix Integration Setup Complete!"
echo "======================================"
echo ""
echo " Next Steps:"
echo "1. Add your Mathpix API credentials to .env:"
echo "   MATHPIX_APP_ID=your_app_id"
echo "   MATHPIX_APP_KEY=your_app_key"
echo ""
echo "2. Test the integration:"
echo "   node test/mathpix-test.js"
echo ""
echo "3. Process a SAT exam:"
echo "   node mathpix-integration.js process your_exam.pdf"
echo ""
echo " Documentation: MATHPIX_INTEGRATION_REPORT.md"
echo ""