// Integration test for ChromaDB Math Education Service
import ChromaDBService from './chromadb-service.js';

async function testMathEducationIntegration() {
  console.log('Starting ChromaDB Math Education Integration Test...\n');
  
  const service = new ChromaDBService();
  
  // Initialize service
  console.log('1. Initializing service...');
  await service.initialize();
  
  // Test math concepts
  console.log('\n2. Testing Math Concepts Storage...');
  
  const concepts = [
    {
      name: 'Pythagorean Theorem',
      category: 'geometry',
      description: 'In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c²',
      difficulty: 'intermediate',
      prerequisites: ['right triangle', 'square', 'square root']
    },
    {
      name: 'Triangle Area',
      category: 'geometry',
      description: 'The area of a triangle is half the base times the height: A = ½ × base × height',
      difficulty: 'basic',
      prerequisites: ['multiplication', 'division']
    },
    {
      name: 'Circle Circumference',
      category: 'geometry',
      description: 'The circumference of a circle is 2π times the radius: C = 2πr',
      difficulty: 'intermediate',
      prerequisites: ['pi', 'multiplication', 'radius']
    }
  ];
  
  for (const concept of concepts) {
    const id = await service.storeConcept(concept);
    console.log(`   Stored: ${concept.name} (ID: ${id})`);
  }
  
  // Test gesture patterns
  console.log('\n3. Testing Gesture Pattern Storage...');
  
  const gestures = [
    {
      type: 'PINCH',
      action: 'RESIZE_TRIANGLE',
      description: 'Teacher uses pinch gesture to resize triangle visualization',
      confidence: 0.95,
      teacherId: 'teacher-001',
      frequency: 15
    },
    {
      type: 'DRAG',
      action: 'MOVE_SHAPE',
      description: 'Teacher drags shape to reposition on canvas',
      confidence: 0.88,
      teacherId: 'teacher-001',
      frequency: 32
    }
  ];
  
  for (const gesture of gestures) {
    const id = await service.storeGesturePattern(gesture);
    console.log(`   Stored: ${gesture.type} - ${gesture.action}`);
  }
  
  // Test interactions for RLHF
  console.log('\n4. Testing Interaction Storage (RLHF)...');
  
  const interaction = {
    sessionId: 'session-001',
    userId: 'teacher-001',
    actionType: 'CREATE_TRIANGLE',
    objectId: 'tri-001',
    action: {
      command: 'create',
      shape: 'triangle',
      properties: { base: 10, height: 8 }
    },
    reward: 0.9
  };
  
  await service.storeInteraction(interaction);
  console.log('   Stored interaction with reward: 0.9');
  
  // Test search functionality
  console.log('\n5. Testing Search Capabilities...');
  
  const searchResults = await service.searchConcepts('triangle area calculation');
  console.log(`   Found ${searchResults.length} relevant concepts:`);
  searchResults.forEach(result => {
    console.log(`     - ${result.metadata.name} (distance: ${result.distance?.toFixed(3)})`);
  });
  
  // Test gesture pattern search
  console.log('\n6. Testing Gesture Pattern Search...');
  
  const similarGestures = await service.findSimilarGestures('resize shape with fingers');
  console.log(`   Found ${similarGestures.length} similar gestures:`);
  similarGestures.forEach(result => {
    console.log(`     - ${result.metadata.gesture_type}: ${result.metadata.action}`);
  });
  
  // Get stats
  console.log('\n7. Collection Statistics:');
  const stats = await service.getStats();
  for (const [collection, count] of Object.entries(stats)) {
    console.log(`   ${collection}: ${count} documents`);
  }
  
  console.log('\n✅ Integration test completed successfully!');
  console.log('ChromaDB is ready for the Math Education System.');
}

// Run test
testMathEducationIntegration().catch(console.error);
