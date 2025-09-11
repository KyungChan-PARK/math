/**
 * LOLA Math Platform Web Server
 * Serves the LOLA-enhanced math learning interface
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001; // Different port to avoid conflict

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// Main route - serve LOLA platform
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../lola-platform.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'running',
        platform: 'LOLA Math Learning Platform',
        version: '4.1.0'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('================================================');
    console.log('  LOLA Math Learning Platform Web Server');
    console.log('================================================');
    console.log(`[Web Server] Running on http://localhost:${PORT}`);
    console.log('[Web Server] Ready for Samsung Galaxy Book 4 Pro 360 Touch!');
    console.log('');
    console.log('Features:');
    console.log('  ✓ Touch input support');
    console.log('  ✓ Multi-touch gestures');
    console.log('  ✓ Real-time physics simulation');
    console.log('  ✓ 10 math domains');
    console.log('');
    console.log('Open your browser at: http://localhost:3001');
});

export default app;