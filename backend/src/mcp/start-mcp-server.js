#!/usr/bin/env node

/**
 * MCP Server Launcher
 * Starts the Model Context Protocol server for real-time documentation
 */

import { IntegratedMCPServer } from './IntegratedMCPServer.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Configuration
const config = {
    name: 'math-education-mcp',
    version: '1.0.0',
    description: 'Real-time documentation and context provider for AI Math Education System',
    port: process.env.MCP_PORT || 3001
};

// Create and start server
async function startMCPServer() {
    console.log(chalk.blue('\n═══════════════════════════════════════'));
    console.log(chalk.blue('    MCP Server - Model Context Protocol'));
    console.log(chalk.blue('═══════════════════════════════════════\n'));

    try {
        const server = new IntegratedMCPServer(config);
        
        // Start the server
        await server.start();
        
        console.log(chalk.green(`✓ MCP Server started successfully`));
        console.log(chalk.cyan(`  Port: ${config.port}`));
        console.log(chalk.cyan(`  Health: http://localhost:${config.port}/mcp/health`));
        console.log(chalk.cyan(`  WebSocket: ws://localhost:${config.port}`));
        console.log(chalk.cyan(`  Documentation: http://localhost:${config.port}/mcp/documentation`));
        
        // Register initial APIs and schemas
        console.log(chalk.yellow('\nRegistering system components...'));
        
        // Log registration status
        server.on('api_registered', (api) => {
            console.log(chalk.gray(`  API registered: ${api.endpoint}`));
        });
        
        server.on('schema_registered', (schema) => {
            console.log(chalk.gray(`  Schema registered: ${schema.name}`));
        });
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log(chalk.yellow('\n\nShutting down MCP Server...'));
            await server.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            await server.stop();
            process.exit(0);
        });
        
        console.log(chalk.green('\n✓ MCP Server is ready for connections'));
        console.log(chalk.gray('  Press Ctrl+C to stop\n'));
        
    } catch (error) {
        console.error(chalk.red('Failed to start MCP Server:'), error);
        process.exit(1);
    }
}

// Start the server
startMCPServer();
