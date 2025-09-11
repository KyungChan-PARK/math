const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ErrorTracker {
    constructor(config = {}) {
        this.maxErrors = config.maxErrors || 1000;
        this.logPath = config.logPath || path.join(__dirname, 'error-logs');
        this.errors = [];
        this.errorPatterns = new Map();
        this.initializeLogDir();
    }

    async initializeLogDir() {
        try {
            await fs.mkdir(this.logPath, { recursive: true });
        } catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }

    async trackError(error, context = {}) {
        const errorEntry = {
            id: crypto.randomBytes(8).toString('hex'),
            timestamp: new Date().toISOString(),
            message: error.message || 'Unknown error',
            stack: error.stack || '',
            type: error.name || 'Error',
            context: {
                ...context,
                pid: process.pid,
                platform: process.platform,
                nodeVersion: process.version
            },
            fingerprint: this.generateFingerprint(error)
        };

        this.errors.push(errorEntry);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        this.updatePatterns(errorEntry);
        await this.logError(errorEntry);
        
        return errorEntry;
    }

    generateFingerprint(error) {
        const key = `${error.name}-${error.message}`;
        return crypto.createHash('md5').update(key).digest('hex').substring(0, 8);
    }

    updatePatterns(errorEntry) {
        const pattern = this.errorPatterns.get(errorEntry.fingerprint) || {
            count: 0,
            firstSeen: errorEntry.timestamp,
            lastSeen: errorEntry.timestamp,
            message: errorEntry.message
        };
        
        pattern.count++;
        pattern.lastSeen = errorEntry.timestamp;
        this.errorPatterns.set(errorEntry.fingerprint, pattern);
    }

    async logError(errorEntry) {
        const filename = `error-${new Date().toISOString().split('T')[0]}.log`;
        const filepath = path.join(this.logPath, filename);
        const logLine = JSON.stringify(errorEntry) + '\n';
        
        try {
            await fs.appendFile(filepath, logLine);
        } catch (error) {
            console.error('Failed to write error log:', error);
        }
    }

    getStatistics() {
        const now = Date.now();
        const last24h = this.errors.filter(e => 
            now - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
        );
        const last1h = this.errors.filter(e => 
            now - new Date(e.timestamp).getTime() < 60 * 60 * 1000
        );

        return {
            total: this.errors.length,
            last24h: last24h.length,
            last1h: last1h.length,
            patterns: Array.from(this.errorPatterns.entries()).map(([key, value]) => ({
                fingerprint: key,
                ...value
            })).sort((a, b) => b.count - a.count).slice(0, 10),
            recentErrors: this.errors.slice(-5)
        };
    }

    async generateReport() {
        const stats = this.getStatistics();
        const report = {
            generated: new Date().toISOString(),
            statistics: stats,
            topErrors: stats.patterns.slice(0, 5),
            errorsByType: this.groupErrorsByType()
        };

        await fs.writeFile(
            path.join(this.logPath, 'error-report.json'),
            JSON.stringify(report, null, 2)
        );

        return report;
    }

    groupErrorsByType() {
        const groups = {};
        this.errors.forEach(error => {
            if (!groups[error.type]) {
                groups[error.type] = 0;
            }
            groups[error.type]++;
        });
        return groups;
    }

    clear() {
        this.errors = [];
        this.errorPatterns.clear();
    }
}

module.exports = ErrorTracker;