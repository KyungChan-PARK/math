/**
 * Comprehensive Error Handling System for AI-in-the-Loop Math Education
 * Provides centralized error management with recovery strategies
 */

import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ErrorHandler extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            logPath: options.logPath || path.join(__dirname, '../logs'),
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            alertThreshold: options.alertThreshold || 10,
            enableRecovery: options.enableRecovery !== false,
            enableLogging: options.enableLogging !== false,
            enableMetrics: options.enableMetrics !== false,
            ...options
        };
        
        // Error categories with specific handling strategies
        this.errorCategories = {
            NETWORK: {
                name: 'Network Error',
                recoverable: true,
                strategy: 'retry_with_backoff',
                maxRetries: 5
            },
            DATABASE: {
                name: 'Database Error',
                recoverable: true,
                strategy: 'reconnect',
                maxRetries: 3
            },
            VALIDATION: {
                name: 'Validation Error',
                recoverable: false,
                strategy: 'reject',
                maxRetries: 0
            },
            AUTHENTICATION: {
                name: 'Authentication Error',
                recoverable: true,
                strategy: 'refresh_token',
                maxRetries: 2
            },
            PERMISSION: {
                name: 'Permission Error',
                recoverable: false,
                strategy: 'escalate',
                maxRetries: 0
            },
            RESOURCE: {
                name: 'Resource Error',
                recoverable: true,
                strategy: 'cleanup_retry',
                maxRetries: 3
            },
            TIMEOUT: {
                name: 'Timeout Error',
                recoverable: true,
                strategy: 'retry_with_timeout',
                maxRetries: 2
            },
            PROCESSING: {
                name: 'Processing Error',
                recoverable: true,
                strategy: 'fallback',
                maxRetries: 1
            },
            SYSTEM: {
                name: 'System Error',
                recoverable: false,
                strategy: 'alert_admin',
                maxRetries: 0
            },
            UNKNOWN: {
                name: 'Unknown Error',
                recoverable: false,
                strategy: 'log_and_alert',
                maxRetries: 0
            }
        };
        
        // Error statistics
        this.statistics = {
            totalErrors: 0,
            errorsByCategory: {},
            errorsByService: {},
            recoveredErrors: 0,
            failedRecoveries: 0,
            lastError: null,
            startTime: Date.now()
        };
        
        // Recovery strategies
        this.recoveryStrategies = new Map();
        this.setupDefaultStrategies();
        
        // Error history for pattern detection
        this.errorHistory = [];
        this.maxHistorySize = 1000;
        
        // Circuit breaker states
        this.circuitBreakers = new Map();
        
        // Initialize error tracking
        this.initialize();
    }
    
    async initialize() {
        // Ensure log directory exists
        await this.ensureLogDirectory();
        
        // Set up global error handlers
        this.setupGlobalHandlers();
        
        // Load previous error statistics if available
        await this.loadStatistics();
        
        console.log('Error Handler initialized with comprehensive recovery strategies');
    }
    
    async ensureLogDirectory() {
        try {
            await fs.mkdir(this.options.logPath, { recursive: true });
        } catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }
    
    setupGlobalHandlers() {
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.handleCriticalError(error, 'uncaughtException');
        });
        
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.handleCriticalError(reason, 'unhandledRejection', { promise });
        });
        
        // Handle warnings
        process.on('warning', (warning) => {
            this.handleWarning(warning);
        });
        
        // Handle exit
        process.on('exit', (code) => {
            this.handleExit(code);
        });
        
        // Handle signals
        ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
            process.on(signal, () => {
                this.handleSignal(signal);
            });
        });
    }
    
    setupDefaultStrategies() {
        // Retry with exponential backoff
        this.recoveryStrategies.set('retry_with_backoff', async (error, context) => {
            const delay = this.options.retryDelay * Math.pow(2, context.attempt || 0);
            await this.delay(delay);
            return { retry: true, delay };
        });
        
        // Database reconnection
        this.recoveryStrategies.set('reconnect', async (error, context) => {
            if (context.service && context.service.reconnect) {
                await context.service.reconnect();
                return { retry: true, reconnected: true };
            }
            return { retry: false };
        });
        
        // Token refresh
        this.recoveryStrategies.set('refresh_token', async (error, context) => {
            if (context.authService && context.authService.refreshToken) {
                const newToken = await context.authService.refreshToken();
                return { retry: true, token: newToken };
            }
            return { retry: false };
        });
        
        // Resource cleanup and retry
        this.recoveryStrategies.set('cleanup_retry', async (error, context) => {
            if (context.cleanup) {
                await context.cleanup();
            }
            await this.delay(this.options.retryDelay);
            return { retry: true, cleaned: true };
        });
        
        // Fallback to alternative service
        this.recoveryStrategies.set('fallback', async (error, context) => {
            if (context.fallbackService) {
                return { 
                    retry: false, 
                    fallback: true, 
                    service: context.fallbackService 
                };
            }
            return { retry: false };
        });
        
        // Alert administrator
        this.recoveryStrategies.set('alert_admin', async (error, context) => {
            await this.alertAdministrator(error, context);
            return { retry: false, alerted: true };
        });
        
        // Log and alert
        this.recoveryStrategies.set('log_and_alert', async (error, context) => {
            await this.logError(error, context);
            await this.alertIfNeeded(error, context);
            return { retry: false };
        });
    }
    
    async handleError(error, context = {}) {
        try {
            // Enhance error with context
            const enhancedError = this.enhanceError(error, context);
            
            // Categorize error
            const category = this.categorizeError(enhancedError);
            enhancedError.category = category;
            
            // Update statistics
            this.updateStatistics(enhancedError);
            
            // Add to history
            this.addToHistory(enhancedError);
            
            // Check circuit breaker
            if (this.isCircuitOpen(context.service)) {
                throw new Error(`Circuit breaker open for service: ${context.service}`);
            }
            
            // Log error
            if (this.options.enableLogging) {
                await this.logError(enhancedError, context);
            }
            
            // Attempt recovery if enabled
            if (this.options.enableRecovery && category.recoverable) {
                const recovered = await this.attemptRecovery(enhancedError, context);
                if (recovered) {
                    this.statistics.recoveredErrors++;
                    this.emit('error_recovered', enhancedError);
                    return recovered;
                } else {
                    this.statistics.failedRecoveries++;
                }
            }
            
            // Emit error event
            this.emit('error', enhancedError);
            
            // Check if we need to alert
            await this.alertIfNeeded(enhancedError, context);
            
            // Return error info
            return {
                handled: true,
                error: enhancedError,
                category,
                recoverable: category.recoverable
            };
            
        } catch (handlingError) {
            console.error('Error in error handler:', handlingError);
            return {
                handled: false,
                error: error,
                handlingError
            };
        }
    }
    
    enhanceError(error, context) {
        // Ensure error is an Error object
        if (!(error instanceof Error)) {
            error = new Error(String(error));
        }
        
        // Add context
        error.context = context;
        error.timestamp = Date.now();
        error.id = this.generateErrorId();
        
        // Add stack trace if missing
        if (!error.stack) {
            Error.captureStackTrace(error);
        }
        
        // Add service information
        if (context.service) {
            error.service = context.service;
        }
        
        // Add user information if available
        if (context.user) {
            error.user = context.user;
        }
        
        // Add request information if available
        if (context.request) {
            error.request = {
                method: context.request.method,
                url: context.request.url,
                headers: context.request.headers
            };
        }
        
        return error;
    }
    
    categorizeError(error) {
        // Check for specific error types
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return this.errorCategories.NETWORK;
        }
        
        if (error.message && error.message.includes('database')) {
            return this.errorCategories.DATABASE;
        }
        
        if (error.message && error.message.includes('validation')) {
            return this.errorCategories.VALIDATION;
        }
        
        if (error.code === 401 || error.message && error.message.includes('unauthorized')) {
            return this.errorCategories.AUTHENTICATION;
        }
        
        if (error.code === 403 || error.message && error.message.includes('forbidden')) {
            return this.errorCategories.PERMISSION;
        }
        
        if (error.code === 'ENOMEM' || error.code === 'ENOSPC') {
            return this.errorCategories.RESOURCE;
        }
        
        if (error.message && error.message.includes('timeout')) {
            return this.errorCategories.TIMEOUT;
        }
        
        if (error.name === 'ProcessingError') {
            return this.errorCategories.PROCESSING;
        }
        
        if (error.name === 'SystemError') {
            return this.errorCategories.SYSTEM;
        }
        
        return this.errorCategories.UNKNOWN;
    }
    
    async attemptRecovery(error, context) {
        const category = error.category;
        const strategy = this.recoveryStrategies.get(category.strategy);
        
        if (!strategy) {
            console.error(`No recovery strategy for: ${category.strategy}`);
            return false;
        }
        
        let attempt = 0;
        const maxRetries = context.maxRetries || category.maxRetries;
        
        while (attempt < maxRetries) {
            try {
                const result = await strategy(error, { ...context, attempt });
                
                if (result.retry) {
                    attempt++;
                    console.log(`Recovery attempt ${attempt}/${maxRetries} for ${category.name}`);
                    
                    // Execute the original operation if provided
                    if (context.operation) {
                        return await context.operation();
                    }
                } else if (result.fallback && result.service) {
                    // Use fallback service
                    if (context.operation) {
                        return await context.operation(result.service);
                    }
                } else {
                    return false;
                }
            } catch (recoveryError) {
                console.error(`Recovery attempt ${attempt} failed:`, recoveryError);
                attempt++;
            }
        }
        
        return false;
    }
    
    updateStatistics(error) {
        this.statistics.totalErrors++;
        this.statistics.lastError = {
            message: error.message,
            category: error.category.name,
            timestamp: error.timestamp
        };
        
        // Update category statistics
        const categoryName = error.category.name;
        this.statistics.errorsByCategory[categoryName] = 
            (this.statistics.errorsByCategory[categoryName] || 0) + 1;
        
        // Update service statistics
        if (error.service) {
            this.statistics.errorsByService[error.service] = 
                (this.statistics.errorsByService[error.service] || 0) + 1;
            
            // Update circuit breaker
            this.updateCircuitBreaker(error.service);
        }
    }
    
    addToHistory(error) {
        this.errorHistory.push({
            id: error.id,
            message: error.message,
            category: error.category.name,
            service: error.service,
            timestamp: error.timestamp
        });
        
        // Maintain history size limit
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.shift();
        }
        
        // Detect patterns
        this.detectErrorPatterns();
    }
    
    detectErrorPatterns() {
        // Check for repeated errors
        const recentErrors = this.errorHistory.slice(-10);
        const errorCounts = {};
        
        recentErrors.forEach(error => {
            const key = `${error.category}_${error.service}`;
            errorCounts[key] = (errorCounts[key] || 0) + 1;
        });
        
        // Alert if same error occurs too frequently
        Object.entries(errorCounts).forEach(([key, count]) => {
            if (count >= 5) {
                this.emit('error_pattern_detected', {
                    pattern: key,
                    count,
                    timeWindow: '10_errors'
                });
            }
        });
    }
    
    updateCircuitBreaker(service) {
        if (!this.circuitBreakers.has(service)) {
            this.circuitBreakers.set(service, {
                failures: 0,
                lastFailure: null,
                state: 'closed'
            });
        }
        
        const breaker = this.circuitBreakers.get(service);
        breaker.failures++;
        breaker.lastFailure = Date.now();
        
        // Open circuit if too many failures
        if (breaker.failures >= 5) {
            breaker.state = 'open';
            console.error(`Circuit breaker opened for service: ${service}`);
            
            // Schedule circuit reset
            setTimeout(() => {
                breaker.state = 'half-open';
                breaker.failures = 0;
            }, 60000); // Reset after 1 minute
        }
    }
    
    isCircuitOpen(service) {
        const breaker = this.circuitBreakers.get(service);
        return breaker && breaker.state === 'open';
    }
    
    async logError(error, context) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            id: error.id,
            category: error.category?.name || 'UNKNOWN',
            message: error.message,
            stack: error.stack,
            context,
            service: error.service,
            user: error.user
        };
        
        const logPath = path.join(
            this.options.logPath,
            `errors_${new Date().toISOString().split('T')[0]}.log`
        );
        
        try {
            await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
        } catch (writeError) {
            console.error('Failed to write error log:', writeError);
        }
    }
    
    async alertIfNeeded(error, context) {
        // Check if we've hit the alert threshold
        const recentErrors = this.errorHistory.slice(-this.options.alertThreshold);
        const criticalErrors = recentErrors.filter(e => 
            e.category === 'SYSTEM' || e.category === 'DATABASE'
        );
        
        if (criticalErrors.length >= this.options.alertThreshold / 2) {
            await this.alertAdministrator(error, {
                ...context,
                criticalCount: criticalErrors.length,
                threshold: this.options.alertThreshold
            });
        }
    }
    
    async alertAdministrator(error, context) {
        // In production, this would send email/SMS/Slack notification
        console.error(' ADMIN ALERT:', {
            error: error.message,
            category: error.category?.name,
            service: error.service,
            context
        });
        
        this.emit('admin_alert', { error, context });
    }
    
    handleCriticalError(error, type, extra = {}) {
        console.error(` CRITICAL ERROR [${type}]:`, error);
        
        this.handleError(error, {
            critical: true,
            type,
            ...extra
        });
        
        // For truly critical errors, consider shutting down gracefully
        if (type === 'uncaughtException') {
            console.error('Shutting down due to uncaught exception...');
            setTimeout(() => process.exit(1), 1000);
        }
    }
    
    handleWarning(warning) {
        console.warn('️ Warning:', warning);
        
        this.emit('warning', warning);
    }
    
    handleExit(code) {
        console.log(`Process exiting with code ${code}`);
        
        // Save statistics
        this.saveStatistics();
    }
    
    handleSignal(signal) {
        console.log(`Received signal: ${signal}`);
        
        this.emit('signal', signal);
        
        // Graceful shutdown
        if (signal === 'SIGTERM' || signal === 'SIGINT') {
            this.shutdown();
        }
    }
    
    async saveStatistics() {
        const statsPath = path.join(this.options.logPath, 'error_statistics.json');
        
        try {
            await fs.writeFile(statsPath, JSON.stringify(this.statistics, null, 2));
        } catch (error) {
            console.error('Failed to save statistics:', error);
        }
    }
    
    async loadStatistics() {
        const statsPath = path.join(this.options.logPath, 'error_statistics.json');
        
        try {
            const data = await fs.readFile(statsPath, 'utf-8');
            const saved = JSON.parse(data);
            
            // Merge with current statistics
            Object.assign(this.statistics, saved);
        } catch (error) {
            // File might not exist, which is fine
            if (error.code !== 'ENOENT') {
                console.error('Failed to load statistics:', error);
            }
        }
    }
    
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getStatistics() {
        return {
            ...this.statistics,
            uptime: Date.now() - this.statistics.startTime,
            errorRate: this.statistics.totalErrors / ((Date.now() - this.statistics.startTime) / 1000),
            recoveryRate: this.statistics.recoveredErrors / this.statistics.totalErrors
        };
    }
    
    clearHistory() {
        this.errorHistory = [];
    }
    
    resetStatistics() {
        this.statistics = {
            totalErrors: 0,
            errorsByCategory: {},
            errorsByService: {},
            recoveredErrors: 0,
            failedRecoveries: 0,
            lastError: null,
            startTime: Date.now()
        };
    }
    
    async shutdown() {
        console.log('Error Handler shutting down...');
        
        await this.saveStatistics();
        
        this.emit('shutdown');
    }
}

export default ErrorHandler;
