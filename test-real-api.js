#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

class RealAPITest {
    constructor() {
        if (process.env.GEMINI_API_KEY) {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        }
        
        this.qwenConfig = {
            apiKey: process.env.DASHSCOPE_API_KEY,
            endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
        };
    }
    
    async testGemini() {
        console.log(colors.yellow + '\nTesting Gemini API...' + colors.reset);
        try {
            const result = await this.geminiModel.generateContent('Generate a simple math problem');
            console.log(colors.green + '✅ Gemini API works!' + colors.reset);
            return true;
        } catch (error) {
            console.log(colors.red + '❌ Gemini API failed: ' + error.message + colors.reset);
            return false;
        }
    }
    
    async testQwen() {
        console.log(colors.yellow + '\nTesting Qwen API...' + colors.reset);
        try {
            const response = await axios.post(
                this.qwenConfig.endpoint,
                {
                    model: 'qwen-max',
                    input: { messages: [{ role: 'user', content: 'Hello' }] }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.qwenConfig.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log(colors.green + '✅ Qwen API works!' + colors.reset);
            return true;
        } catch (error) {
            console.log(colors.red + '❌ Qwen API failed: ' + error.message + colors.reset);
            return false;
        }
    }
    
    async run() {
        console.log(colors.cyan + '=== Real API Test ===' + colors.reset);
        const geminiWorks = await this.testGemini();
        const qwenWorks = await this.testQwen();
        
        console.log('\n' + colors.cyan + 'Summary:' + colors.reset);
        console.log('Gemini: ' + (geminiWorks ? colors.green + 'Working' : colors.red + 'Failed') + colors.reset);
        console.log('Qwen: ' + (qwenWorks ? colors.green + 'Working' : colors.red + 'Failed') + colors.reset);
    }
}

const tester = new RealAPITest();
tester.run().catch(console.error);
