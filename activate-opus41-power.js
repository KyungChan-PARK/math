import { activateFullPower } from './opus41-full-power-config.js';

// Activate Claude Opus 4.1 Full Power
activateFullPower().then(config => {
  console.log('\n🎯 Configuration Applied Successfully!');
  console.log(`   Total Agents: ${Object.keys(config.agentOrchestration.agents).length}`);
  console.log(`   Memory Layers: ${Object.keys(config.memory.layers).length}`);
  console.log(`   Security Level: ${config.security.level}`);
  process.exit(0);
}).catch(error => {
  console.error('❌ Activation failed:', error);
  process.exit(1);
});