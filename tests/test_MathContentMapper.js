/**
 * Math Content Mapper 테스트
 * MathContentMapper.js 테스트 스위트
 */

const assert = require('assert');
const MathContentMapper = require('../src/lola-integration/MathContentMapper.js');

describe('MathContentMapper', () => {
    let mapper;
    
    beforeEach(() => {
        mapper = new MathContentMapper();
    });
    
    describe('Content Mapping', () => {
        it('should map basic arithmetic correctly', () => {
            const input = '2 + 2';
            const result = mapper.mapContent(input);
            
            assert.strictEqual(result.type, 'arithmetic');
            assert.strictEqual(result.operation, 'addition');
            assert.deepEqual(result.operands, [2, 2]);
            assert.strictEqual(result.result, 4);
        });
        
        it('should map algebraic expressions', () => {
            const input = 'x^2 + 2x + 1';
            const result = mapper.mapContent(input);
            
            assert.strictEqual(result.type, 'algebra');
            assert.strictEqual(result.degree, 2);
            assert.strictEqual(result.variables.length, 1);
            assert.strictEqual(result.variables[0], 'x');
        });
        
        it('should map geometric shapes', () => {
            const circleData = {
                type: 'shape',
                points: generateCirclePoints(50)
            };
            
            const result = mapper.mapShape(circleData);
            
            assert.strictEqual(result.shape, 'circle');
            assert(result.radius > 0);
            assert(result.center);
            assert.strictEqual(result.accuracy > 0.9, true);
        });
        
        it('should map calculus expressions', () => {
            const input = 'd/dx(x^3)';
            const result = mapper.mapContent(input);
            
            assert.strictEqual(result.type, 'calculus');
            assert.strictEqual(result.operation, 'derivative');
            assert.strictEqual(result.result, '3x^2');
        });
        
        it('should handle invalid input gracefully', () => {
            const invalidInputs = [null, undefined, '', '%%%', '!!!'];
            
            invalidInputs.forEach(input => {
                const result = mapper.mapContent(input);
                assert.strictEqual(result.type, 'unknown');
                assert.strictEqual(result.error, false);
            });
        });
    });
    
    describe('Pattern Recognition', () => {
        it('should recognize linear patterns', () => {
            const points = [
                {x: 0, y: 0},
                {x: 1, y: 1},
                {x: 2, y: 2},
                {x: 3, y: 3}
            ];
            
            const pattern = mapper.recognizePattern(points);
            
            assert.strictEqual(pattern.type, 'linear');
            assert.strictEqual(pattern.slope, 1);
            assert.strictEqual(pattern.intercept, 0);
        });
        
        it('should recognize quadratic patterns', () => {
            const points = [
                {x: -2, y: 4},
                {x: -1, y: 1},
                {x: 0, y: 0},
                {x: 1, y: 1},
                {x: 2, y: 4}
            ];
            
            const pattern = mapper.recognizePattern(points);
            
            assert.strictEqual(pattern.type, 'quadratic');
            assert.strictEqual(pattern.a, 1);
            assert.strictEqual(pattern.b, 0);
            assert.strictEqual(pattern.c, 0);
        });
        
        it('should recognize periodic patterns', () => {
            const points = generateSineWave(100);
            const pattern = mapper.recognizePattern(points);
            
            assert.strictEqual(pattern.type, 'periodic');
            assert.strictEqual(pattern.function, 'sine');
            assert(pattern.period > 0);
            assert(pattern.amplitude > 0);
        });
    });
    
    describe('Difficulty Mapping', () => {
        it('should map difficulty levels correctly', () => {
            const problems = [
                { content: '1 + 1', expectedLevel: 1 },
                { content: 'x + 5 = 10', expectedLevel: 2 },
                { content: 'x^2 - 4x + 4 = 0', expectedLevel: 3 },
                { content: '∫x^2 dx', expectedLevel: 4 },
                { content: '∂²f/∂x∂y', expectedLevel: 5 }
            ];
            
            problems.forEach(problem => {
                const result = mapper.assessDifficulty(problem.content);
                assert.strictEqual(result.level, problem.expectedLevel);
            });
        });
        
        it('should provide appropriate scaffolding', () => {
            const content = 'x^2 - 4x + 4 = 0';
            const scaffolding = mapper.getScaffolding(content);
            
            assert(Array.isArray(scaffolding.hints));
            assert(scaffolding.hints.length > 0);
            assert(scaffolding.steps);
            assert(scaffolding.solution);
        });
    });
    
    describe('LaTeX Conversion', () => {
        it('should convert to LaTeX format', () => {
            const expressions = [
                { input: 'x^2', latex: 'x^{2}' },
                { input: 'sqrt(x)', latex: '\\sqrt{x}' },
                { input: 'x/y', latex: '\\frac{x}{y}' },
                { input: 'sum(i=1,n,i^2)', latex: '\\sum_{i=1}^{n} i^{2}' }
            ];
            
            expressions.forEach(expr => {
                const result = mapper.toLatex(expr.input);
                assert.strictEqual(result, expr.latex);
            });
        });
        
        it('should parse LaTeX input', () => {
            const latex = '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}';
            const parsed = mapper.parseLatex(latex);
            
            assert.strictEqual(parsed.type, 'formula');
            assert.strictEqual(parsed.name, 'quadratic_formula');
            assert.deepEqual(parsed.variables, ['a', 'b', 'c']);
        });
    });
    
    describe('Performance', () => {
        it('should map content quickly', () => {
            const startTime = Date.now();
            
            for (let i = 0; i < 1000; i++) {
                mapper.mapContent(`x + ${i}`);
            }
            
            const duration = Date.now() - startTime;
            assert(duration < 100, `Mapping took ${duration}ms, expected < 100ms`);
        });
        
        it('should cache repeated mappings', () => {
            const input = 'x^2 + 2x + 1';
            
            // First call
            const result1 = mapper.mapContent(input);
            const cacheKey = mapper._getCacheKey(input);
            
            // Second call should use cache
            const result2 = mapper.mapContent(input);
            
            assert.deepEqual(result1, result2);
            assert(mapper._cache.has(cacheKey));
        });
    });
});

// Helper functions
function generateCirclePoints(n) {
    const points = [];
    for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2;
        points.push({
            x: Math.cos(angle) * 50 + 100,
            y: Math.sin(angle) * 50 + 100
        });
    }
    return points;
}

function generateSineWave(n) {
    const points = [];
    for (let i = 0; i < n; i++) {
        const x = (i / n) * Math.PI * 4;
        points.push({
            x: x,
            y: Math.sin(x)
        });
    }
    return points;
}

module.exports = {};
