export default class NLPEngine {
    constructor() {
        this.intents = {
            CREATE: /create|make|add|draw/i,
            MOVE: /move|drag|shift|position/i,
            SCALE: /scale|resize|bigger|smaller/i,
            ANIMATE: /animate|wiggle|bounce|pulse/i
        };
        this.contextMap = new Map(); // Track context per connection
    }
    
    async parse(text, connectionId) {
        const intent = this.detectIntent(text);
        return {
            type: intent,
            text: text,
            confidence: 0.95,
            needsClarification: false
        };
    }
    
    detectIntent(text) {
        for (const [action, pattern] of Object.entries(this.intents)) {
            if (pattern.test(text)) return action;
        }
        return 'UNKNOWN';
    }
    
    getSupportedIntents() {
        return Object.keys(this.intents);
    }
    
    clearContext(connectionId) {
        this.contextMap.delete(connectionId);
    }
}
