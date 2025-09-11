export default class AEBridge {
    constructor(config = {}) {
        this.config = config;
        this.connected = false;
        this.mockMode = true; // Start in mock mode for testing
    }
    
    async execute(script) {
        // Simulated AE bridge for testing
        return {
            success: true,
            message: `Executed: ${script.substring(0, 50)}...`
        };
    }
    
    async getState() {
        return {
            composition: { name: 'Main Comp', width: 1920, height: 1080 },
            layers: []
        };
    }
    
    isConnected() {
        return this.connected;
    }
    
    isMockMode() {
        return this.mockMode;
    }
    
    on(event, handler) {
        // Event handler stub for compatibility
    }
}