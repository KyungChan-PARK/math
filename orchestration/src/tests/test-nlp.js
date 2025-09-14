import axios from 'axios';

// Test NLP server
async function testNLP() {
    try {
        const response = await axios.post('http://localhost:3000/process', {
            text: 'draw a circle'
        });
        
        console.log('NLP Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testNLP();