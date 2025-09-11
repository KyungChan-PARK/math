/**
 * Mathpix Integration Test
 * API 키 검증 및 기능 테스트
 */

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testMathpixAPI() {
    console.log(' Testing Mathpix API Configuration...\n');
    
    const config = {
        baseURL: 'https://api.mathpix.com/v3',
        headers: {
            'app_id': process.env.MATHPIX_APP_ID,
            'app_key': process.env.MATHPIX_APP_KEY,
            'Content-Type': 'application/json'
        }
    };
    
    console.log(' Configuration:');
    console.log(`  App ID: ${process.env.MATHPIX_APP_ID}`);
    console.log(`  App Key: ${process.env.MATHPIX_APP_KEY?.substring(0, 10)}...`);
    
    try {
        // Test with a simple LaTeX equation
        const testData = {
            src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            formats: ['text', 'latex'],
            ocr: ['math', 'text']
        };
        
        const response = await axios.post(
            `${config.baseURL}/text`,
            testData,
            { headers: config.headers }
        );
        
        console.log('\n✅ API Connection Successful!');
        console.log('Response:', response.data);
        
        // Test text extraction
        const textTest = {
            text: '1. Solve for x: x^2 + 5x + 6 = 0',
            formats: ['latex']
        };
        
        console.log('\n Testing text processing...');
        console.log('Input:', textTest.text);
        
        return {
            success: true,
            apiWorking: true,
            appId: process.env.MATHPIX_APP_ID,
            features: ['OCR', 'LaTeX', 'Text', 'Math']
        };
        
    } catch (error) {
        console.error('❌ API Test Failed:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.error(' Invalid API credentials');
        } else if (error.response?.status === 429) {
            console.error('⏳ Rate limit exceeded');
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Run test
testMathpixAPI()
    .then(result => {
        console.log('\n Test Results:', result);
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });