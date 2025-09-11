// Advanced Memory Optimization Script
const axios = require('axios');

async function optimizeServices() {
    console.log('\n🔧 Advanced Service Optimization Starting...\n');
    
    const services = [
        {
            name: 'Monitoring Dashboard',
            url: 'http://localhost:8095/api/status',
            optimizeEndpoint: 'http://localhost:8095/api/optimize'
        },
        {
            name: 'Qwen Orchestrator',
            url: 'http://localhost:8093/api/agents',
            optimizeEndpoint: 'http://localhost:8093/api/optimize'
        }
    ];
    
    for (const service of services) {
        console.log(`📍 Optimizing ${service.name}...`);
        try {
            // Check service status
            const status = await axios.get(service.url, {timeout: 3000}).catch(() => null);
            if (status) {
                console.log(`  ✓ ${service.name} is responsive`);
                
                // Send optimization request
                await axios.post(service.optimizeEndpoint, {
                    action: 'clear_cache',
                    gc: true
                }).catch(() => {
                    console.log(`  ⚠ No optimization endpoint available`);
                });
            }
        } catch (error) {
            console.log(`  ⚠ ${service.name} optimization skipped`);
        }
    }
    
    console.log('\n✅ Service optimization completed!\n');
}

// Run if called directly
if (require.main === module) {
    optimizeServices().catch(console.error);
}

module.exports = { optimizeServices };