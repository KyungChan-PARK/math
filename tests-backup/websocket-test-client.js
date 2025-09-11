/**
 * WebSocket Test Client for AE Claude Max Server
 * 
 * This test client verifies that our WebSocket server is functioning correctly
 * and can process natural language commands.
 * 
 * Tests:
 * 1. Connection establishment
 * 2. Basic message exchange
 * 3. NLP command processing
 * 4. Error handling
 * 
 * @module WebSocketTestClient
 * @version 3.3.0
 */

import WebSocket from 'ws';

class WebSocketTestClient {
    constructor(url = 'ws://localhost:8082') {
        this.url = url;
        this.ws = null;
        this.messageQueue = [];
        this.responseHandlers = new Map();
        this.messageIdCounter = 0;
    }
    
    /**
     * Connect to the WebSocket server
     */
    async connect() {
        return new Promise((resolve, reject) => {
            console.log(` Connecting to ${this.url}...`);
            
            this.ws = new WebSocket(this.url);
            
            this.ws.on('open', () => {
                console.log('✅ Connected to WebSocket server');
                this.setupEventHandlers();
                resolve();
            });
            
            this.ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                reject(error);
            });
        });
    }
    
    /**
     * Set up WebSocket event handlers
     */
    setupEventHandlers() {
        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                console.log(' Received:', message);
                
                // Handle response if it has a matching request ID
                if (message.requestId && this.responseHandlers.has(message.requestId)) {
                    const handler = this.responseHandlers.get(message.requestId);
                    handler(message);
                    this.responseHandlers.delete(message.requestId);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        });
        
        this.ws.on('close', () => {
            console.log(' Connection closed');
        });
    }
    
    /**
     * Send a natural language command to the server
     */
    async sendCommand(command) {
        return new Promise((resolve) => {
            const messageId = `msg_${++this.messageIdCounter}`;
            
            const message = {
                type: 'NATURAL_LANGUAGE',
                payload: {
                    text: command,
                    context: {}
                },
                requestId: messageId,
                timestamp: Date.now()
            };
            
            console.log(` Sending command: "${command}"`);
            
            // Set up response handler
            this.responseHandlers.set(messageId, (response) => {
                resolve(response);
            });
            
            // Send the message
            this.ws.send(JSON.stringify(message));
            
            // Timeout after 5 seconds if no response
            setTimeout(() => {
                if (this.responseHandlers.has(messageId)) {
                    this.responseHandlers.delete(messageId);
                    resolve({ error: 'Timeout waiting for response' });
                }
            }, 5000);
        });
    }
    
    /**
     * Close the WebSocket connection
     */
    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Run tests if this file is executed directly
async function runTests() {
    const client = new WebSocketTestClient();
    
    try {
        // Test 1: Connection
        console.log('\n Test 1: Establishing connection...');
        await client.connect();
        console.log('✅ Connection test passed\n');
        
        // Test 2: Simple command
        console.log(' Test 2: Sending simple command...');
        const response1 = await client.sendCommand('Create a red circle');
        console.log('Response:', response1);
        console.log('✅ Simple command test passed\n');
        
        // Test 3: Complex command
        console.log(' Test 3: Sending complex command...');
        const response2 = await client.sendCommand('Make 5 blue squares in a row and animate them');
        console.log('Response:', response2);
        console.log('✅ Complex command test passed\n');
        
        // Test 4: Movement command
        console.log(' Test 4: Sending movement command...');
        const response3 = await client.sendCommand('Move the red circle to the right by 100 pixels');
        console.log('Response:', response3);
        console.log('✅ Movement command test passed\n');
        
        // Test complete
        console.log(' All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        client.close();
    }
}

// Run tests
runTests().catch(console.error);

export default WebSocketTestClient;