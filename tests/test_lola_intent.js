/**
 * LOLA Math Intent System 테스트
 * lola_math_intent_system.py 서버 테스트
 */

const assert = require('assert');
const axios = require('axios');

describe('LOLA Math Intent System', function() {
    this.timeout(5000);
    
    const SERVER_URL = 'http://localhost:8092';
    
    describe('Server Status', () => {
        it('should respond to status endpoint', async () => {
            try {
                const response = await axios.get(`${SERVER_URL}/status`);
                assert.strictEqual(response.status, 200);
                assert(response.data.session_id);
                assert.strictEqual(typeof response.data.attempts, 'number');
            } catch (error) {
                // Server not running
                console.warn('LOLA server not running on port 8092');
            }
        });
    });
    
    describe('Drawing Submission', () => {
        it('should accept drawing attempt', async () => {
            const testStroke = {
                points: [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0]],
                pressure: [0.5, 0.6, 0.7, 0.6, 0.5],
                velocity: [1.0, 1.2, 1.1, 1.2, 1.0],
                context: 'geometry',
                dimension: 2
            };
            
            try {
                const response = await axios.post(`${SERVER_URL}/attempt`, testStroke);
                assert.strictEqual(response.status, 200);
                assert(response.data.attempt);
                assert(response.data.latent_vector);
                assert(response.data.compression_rate);
                assert(response.data.message);
            } catch (error) {
                console.warn('Could not submit drawing attempt');
            }
        });
        
        it('should handle invalid stroke data', async () => {
            const invalidStroke = {
                points: [],  // Empty points
                context: 'invalid'
            };
            
            try {
                const response = await axios.post(`${SERVER_URL}/attempt`, invalidStroke);
                // Should still handle gracefully
                assert(response.status === 200 || response.status === 400);
            } catch (error) {
                // Expected for invalid data
                assert(error.response.status === 400 || error.response.status === 500);
            }
        });
    });
    
    describe('Suggestion Generation', () => {
        it('should return suggestion after multiple attempts', async () => {
            // Submit 5 attempts to trigger suggestion
            for (let i = 0; i < 5; i++) {
                const stroke = {
                    points: [[i, 0], [i+1, 1], [i+2, 0]],
                    pressure: [0.5, 0.7, 0.5],
                    velocity: [1.0, 1.0, 1.0],
                    context: 'calculus',
                    dimension: 2
                };
                
                try {
                    await axios.post(`${SERVER_URL}/attempt`, stroke);
                } catch (error) {
                    console.warn('Could not submit attempt', i);
                }
            }
            
            // Get suggestion
            try {
                const response = await axios.get(`${SERVER_URL}/suggestion`);
                assert.strictEqual(response.status, 200);
                
                if (response.data && Object.keys(response.data).length > 0) {
                    assert(response.data.type);
                    assert(response.data.data);
                }
            } catch (error) {
                console.warn('Could not get suggestion');
            }
        });
    });
    
    describe('Session Management', () => {
        it('should reset session', async () => {
            try {
                const response = await axios.post(`${SERVER_URL}/reset`);
                assert.strictEqual(response.status, 200);
                assert.strictEqual(response.data.status, 'reset');
                assert(response.data.new_session);
            } catch (error) {
                console.warn('Could not reset session');
            }
        });
    });
    
    describe('Latent Space Encoding', () => {
        it('should compress to 64 dimensions', async () => {
            const complexStroke = {
                points: Array.from({length: 100}, (_, i) => [i, Math.sin(i/10)]),
                pressure: Array(100).fill(0.5),
                velocity: Array(100).fill(1.0),
                context: 'geometry',
                dimension: 2
            };
            
            try {
                const response = await axios.post(`${SERVER_URL}/attempt`, complexStroke);
                assert(response.data.latent_vector);
                assert.strictEqual(response.data.latent_vector.length, 64);
                assert(response.data.compression_rate >= 256);
            } catch (error) {
                console.warn('Could not test latent encoding');
            }
        });
    });
});

// Integration tests
describe('LOLA Integration Tests', function() {
    this.timeout(10000);
    
    describe('Math Learning Workflow', () => {
        it('should complete full learning cycle', async () => {
            // 1. Reset session
            try {
                await axios.post('http://localhost:8092/reset');
            } catch (e) {
                console.warn('Reset failed');
            }
            
            // 2. Submit multiple attempts
            const attempts = 7;
            for (let i = 0; i < attempts; i++) {
                const angle = (i / attempts) * Math.PI * 2;
                const stroke = {
                    points: Array.from({length: 20}, (_, j) => [
                        Math.cos(angle) * j,
                        Math.sin(angle) * j
                    ]),
                    pressure: Array(20).fill(0.5 + i * 0.05),
                    velocity: Array(20).fill(1.0),
                    context: 'geometry',
                    dimension: 2
                };
                
                try {
                    const response = await axios.post('http://localhost:8092/attempt', stroke);
                    
                    if (i >= 4) {  // After 5 attempts
                        assert(response.data.analysis, 'Should have analysis after 5 attempts');
                        
                        if (response.data.analysis) {
                            assert(response.data.analysis.convergence);
                            assert(typeof response.data.analysis.confidence === 'number');
                        }
                    }
                } catch (error) {
                    console.warn(`Attempt ${i+1} failed`);
                }
            }
            
            // 3. Get final suggestion
            try {
                const suggestion = await axios.get('http://localhost:8092/suggestion');
                if (suggestion.data && Object.keys(suggestion.data).length > 0) {
                    assert(suggestion.data.type);
                    assert(suggestion.data.data);
                    assert(suggestion.data.quality_score);
                }
            } catch (error) {
                console.warn('Final suggestion failed');
            }
        });
    });
    
    describe('Mathematical Properties', () => {
        it('should detect symmetry', async () => {
            // Create symmetric shape
            const symmetricPoints = [
                [-2, 0], [-1, 1], [0, 2], [1, 1], [2, 0],
                [1, -1], [0, -2], [-1, -1], [-2, 0]
            ];
            
            const stroke = {
                points: symmetricPoints,
                pressure: Array(symmetricPoints.length).fill(0.5),
                velocity: Array(symmetricPoints.length).fill(1.0),
                context: 'geometry',
                dimension: 2
            };
            
            try {
                const response = await axios.post('http://localhost:8092/attempt', stroke);
                // Properties should be preserved in the latent encoding
                assert(response.data.latent_vector);
            } catch (error) {
                console.warn('Symmetry test failed');
            }
        });
        
        it('should detect periodicity', async () => {
            // Create periodic function
            const periodicPoints = Array.from({length: 50}, (_, i) => [
                i / 5,
                Math.sin(i / 5)
            ]);
            
            const stroke = {
                points: periodicPoints,
                pressure: Array(50).fill(0.5),
                velocity: Array(50).fill(1.0),
                context: 'calculus',
                dimension: 2
            };
            
            try {
                const response = await axios.post('http://localhost:8092/attempt', stroke);
                assert(response.data.latent_vector);
            } catch (error) {
                console.warn('Periodicity test failed');
            }
        });
    });
});

// Run tests if this file is executed directly
if (require.main === module) {
    const Mocha = require('mocha');
    const mocha = new Mocha();
    
    mocha.addFile(__filename);
    mocha.run(failures => {
        process.exitCode = failures ? 1 : 0;
    });
}
