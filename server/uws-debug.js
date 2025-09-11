console.log('Starting µWebSockets debug test...');

import('uWebSockets.js').then(module => {
    console.log('✅ µWebSockets.js loaded successfully');
    const { App } = module;
    
    const app = App();
    
    app.get('/*', (res, req) => {
        res.end('Hello µWebSockets!');
    });
    
    app.listen(8085, (token) => {
        if (token) {
            console.log(' Test server running on port 8085');
        } else {
            console.log('❌ Failed to start server');
        }
    });
}).catch(error => {
    console.error('❌ Failed to load µWebSockets.js:', error.message);
    console.error('Stack:', error.stack);
});
