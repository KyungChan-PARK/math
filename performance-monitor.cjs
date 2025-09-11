const EventEmitter = require('events');
const os = require('os');
const v8 = require('v8');
const fs = require('fs').promises;
const path = require('path');

class PerformanceMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.metricsInterval = config.metricsInterval || 1000;
        this.historySize = config.historySize || 1000;
        this.thresholds = {
            cpu: config.cpuThreshold || 80,
            memory: config.memoryThreshold || 85,
            responseTime: config.responseTimeThreshold || 1000,
            errorRate: config.errorRateThreshold || 5
        };
        
        this.metrics = {
            cpu: [],
            memory: [],
            requests: [],
            errors: [],
            responseTime: [],
            throughput: []
        };
        
        this.alerts = [];
        this.startTime = Date.now();
        this.lastCpuUsage = process.cpuUsage();
    }

    start() {
        this.interval = setInterval(() => this.collectMetrics(), this.metricsInterval);
        this.collectMetrics();
    }

    collectMetrics() {
        const timestamp = Date.now();
        
        // CPU metrics
        const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
        const cpuPercent = (currentCpuUsage.user + currentCpuUsage.system) / 10000;
        this.lastCpuUsage = process.cpuUsage();
        
        // Memory metrics
        const memUsage = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memPercent = (usedMem / totalMem) * 100;
        
        // V8 heap statistics
        const heapStats = v8.getHeapStatistics();
        
        const metrics = {
            timestamp,
            cpu: {
                percent: cpuPercent.toFixed(2),
                user: currentCpuUsage.user,
                system: currentCpuUsage.system
            },
            memory: {
                percent: memPercent.toFixed(2),
                used: Math.round(usedMem / 1024 / 1024),
                total: Math.round(totalMem / 1024 / 1024),
                heap: {
                    used: Math.round(heapStats.used_heap_size / 1024 / 1024),
                    total: Math.round(heapStats.total_heap_size / 1024 / 1024),
                    limit: Math.round(heapStats.heap_size_limit / 1024 / 1024)
                }
            },
            uptime: Math.round((timestamp - this.startTime) / 1000)
        };
        
        this.addMetric('cpu', cpuPercent);
        this.addMetric('memory', memPercent);
        
        this.checkThresholds(metrics);
        this.emit('metrics', metrics);
        
        return metrics;
    }

    addMetric(type, value) {
        if (!this.metrics[type]) this.metrics[type] = [];
        this.metrics[type].push({ timestamp: Date.now(), value });
        if (this.metrics[type].length > this.historySize) {
            this.metrics[type].shift();
        }
    }

    recordRequest(duration, status) {
        this.addMetric('requests', 1);
        this.addMetric('responseTime', duration);
        if (status >= 400) {
            this.addMetric('errors', 1);
        }
    }

    checkThresholds(metrics) {
        const alerts = [];
        
        if (metrics.cpu.percent > this.thresholds.cpu) {
            alerts.push({
                type: 'CPU_HIGH',
                value: metrics.cpu.percent,
                threshold: this.thresholds.cpu,
                severity: 'warning'
            });
        }
        
        if (metrics.memory.percent > this.thresholds.memory) {
            alerts.push({
                type: 'MEMORY_HIGH',
                value: metrics.memory.percent,
                threshold: this.thresholds.memory,
                severity: 'warning'
            });
        }
        
        if (alerts.length > 0) {
            this.alerts.push(...alerts);
            this.emit('alert', alerts);
        }
    }

    getStatistics() {
        const calculate = (arr) => {
            if (!arr || arr.length === 0) return { avg: 0, min: 0, max: 0 };
            const values = arr.map(m => m.value);
            return {
                avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
                min: Math.min(...values).toFixed(2),
                max: Math.max(...values).toFixed(2)
            };
        };
        
        return {
            cpu: calculate(this.metrics.cpu),
            memory: calculate(this.metrics.memory),
            responseTime: calculate(this.metrics.responseTime),
            requestsPerSec: this.calculateThroughput(),
            errorRate: this.calculateErrorRate(),
            uptime: Math.round((Date.now() - this.startTime) / 1000),
            alerts: this.alerts.slice(-10)
        };
    }

    calculateThroughput() {
        const recentRequests = this.metrics.requests.filter(
            r => Date.now() - r.timestamp < 60000
        );
        return (recentRequests.length / 60).toFixed(2);
    }

    calculateErrorRate() {
        if (this.metrics.requests.length === 0) return 0;
        const errors = this.metrics.errors.length;
        const requests = this.metrics.requests.length;
        return ((errors / requests) * 100).toFixed(2);
    }

    async saveReport() {
        const report = {
            timestamp: new Date().toISOString(),
            statistics: this.getStatistics(),
            metrics: {
                cpu: this.metrics.cpu.slice(-100),
                memory: this.metrics.memory.slice(-100),
                responseTime: this.metrics.responseTime.slice(-100)
            }
        };
        
        await fs.writeFile(
            path.join(__dirname, 'performance-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        return report;
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}

module.exports = PerformanceMonitor;