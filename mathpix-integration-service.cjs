const express = require('express');
const multer = require('multer');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs').promises;
const path = require('path');
const ClaudeQwenMathpixOrchestrator = require('./claude-qwen-mathpix-orchestrator.cjs');

class MathpixIntegrationService {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: { origin: "*" }
        });
        this.port = 8098;
        
        // Initialize orchestrator
        this.orchestrator = new ClaudeQwenMathpixOrchestrator();
        
        // Setup multer for file uploads
        this.upload = multer({
            storage: multer.memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
            fileFilter: (req, file, cb) => {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
                if (allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
                }
            }
        });
        
        // Statistics tracking
        this.serviceStats = {
            startTime: Date.now(),
            totalRequests: 0,
            successfulOCR: 0,
            failedOCR: 0,
            activeUsers: new Set()
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
        this.setupOrchestratorEvents();
    }
    
    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // CORS for API access
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            next();
        });
    }
    
    setupRoutes() {
        // Main dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // OCR endpoint for image processing
        this.app.post('/api/ocr', this.upload.single('image'), async (req, res) => {
            this.serviceStats.totalRequests++;
            
            try {
                if (!req.file) {
                    return res.status(400).json({ error: 'No image file provided' });
                }
                
                // Convert image to base64
                const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                
                // Process with orchestrator
                const task = {
                    id: `ocr-${Date.now()}`,
                    type: 'image',
                    data: base64Image,
                    educational: req.body.educational === 'true',
                    metadata: {
                        source: req.body.source || 'upload',
                        filename: req.file.originalname
                    }
                };
                
                const result = await this.orchestrator.routeTask(task);
                this.serviceStats.successfulOCR++;
                
                res.json({
                    success: true,
                    result: result,
                    statistics: this.orchestrator.getStatistics()
                });
                
            } catch (error) {
                this.serviceStats.failedOCR++;
                console.error('OCR Error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Batch processing endpoint
        this.app.post('/api/batch', this.upload.array('images', 10), async (req, res) => {
            this.serviceStats.totalRequests++;
            
            try {
                if (!req.files || req.files.length === 0) {
                    return res.status(400).json({ error: 'No images provided' });
                }
                
                // Prepare batch
                const images = req.files.map(file => ({
                    data: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                    options: { formats: ['latex_styled', 'text'] }
                }));
                
                const task = {
                    id: `batch-${Date.now()}`,
                    type: 'batch',
                    images: images
                };
                
                const result = await this.orchestrator.routeTask(task);
                
                res.json({
                    success: true,
                    processed: images.length,
                    results: result
                });
                
            } catch (error) {
                console.error('Batch Error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // LaTeX rendering endpoint
        this.app.post('/api/render', async (req, res) => {
            try {
                const { latex, format = 'svg' } = req.body;
                
                if (!latex) {
                    return res.status(400).json({ error: 'LaTeX content required' });
                }
                
                const result = await this.orchestrator.mathpixClient.renderLatex(
                    latex,
                    format,
                    req.body.options || {}
                );
                
                res.json({
                    success: true,
                    rendered: result
                });
                
            } catch (error) {
                console.error('Render Error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Problem classification endpoint
        this.app.post('/api/classify', async (req, res) => {
            try {
                const { content } = req.body;
                
                const classification = await this.orchestrator.classifyMathProblem({
                    text: content.text || '',
                    latex_styled: content.latex || ''
                });
                
                res.json({
                    success: true,
                    classification: classification
                });
                
            } catch (error) {
                console.error('Classification Error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Statistics endpoint
        this.app.get('/api/stats', (req, res) => {
            const uptime = Math.round((Date.now() - this.serviceStats.startTime) / 1000);
            
            res.json({
                service: {
                    uptime: uptime,
                    totalRequests: this.serviceStats.totalRequests,
                    successfulOCR: this.serviceStats.successfulOCR,
                    failedOCR: this.serviceStats.failedOCR,
                    activeUsers: this.serviceStats.activeUsers.size,
                    successRate: this.serviceStats.totalRequests > 0
                        ? ((this.serviceStats.successfulOCR / this.serviceStats.totalRequests) * 100).toFixed(2) + '%'
                        : '0%'
                },
                orchestrator: this.orchestrator.getStatistics(),
                mathpix: this.orchestrator.mathpixClient.getStatistics()
            });
        });
        
        // Health check endpoint
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            this.serviceStats.activeUsers.add(socket.id);
            
            // Send initial statistics
            socket.emit('stats-update', {
                service: this.serviceStats,
                orchestrator: this.orchestrator.getStatistics()
            });
            
            // Handle real-time OCR requests
            socket.on('ocr-request', async (data) => {
                try {
                    const task = {
                        id: `socket-ocr-${Date.now()}`,
                        type: 'image',
                        data: data.image,
                        educational: data.educational || false
                    };
                    
                    const result = await this.orchestrator.routeTask(task);
                    socket.emit('ocr-result', {
                        success: true,
                        result: result
                    });
                    
                } catch (error) {
                    socket.emit('ocr-result', {
                        success: false,
                        error: error.message
                    });
                }
            });
            
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                this.serviceStats.activeUsers.delete(socket.id);
            });
        });
        
        // Broadcast statistics every 5 seconds
        setInterval(() => {
            this.io.emit('stats-update', {
                service: this.serviceStats,
                orchestrator: this.orchestrator.getStatistics()
            });
        }, 5000);
    }
    
    setupOrchestratorEvents() {
        // Listen to orchestrator events for real-time updates
        this.orchestrator.on('collaboration-started', (data) => {
            this.io.emit('collaboration-event', { type: 'started', ...data });
        });
        
        this.orchestrator.on('collaboration-completed', (data) => {
            this.io.emit('collaboration-event', { type: 'completed', ...data });
        });
        
        this.orchestrator.on('ocr-processed', (data) => {
            this.io.emit('processing-event', { type: 'ocr-complete', ...data });
        });
        
        this.orchestrator.on('batch-update', (progress) => {
            this.io.emit('batch-progress', progress);
        });
    }
    
    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mathpix Integration - Palantir Math v5.0</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        h1 {
            text-align: center;
            color: white;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .card h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5em;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        
        .upload-area {
            border: 3px dashed #667eea;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            background: #f8f9fa;
        }
        
        .upload-area:hover {
            background: #e9ecef;
            border-color: #764ba2;
        }
        
        .upload-area.dragover {
            background: #667eea20;
            border-color: #764ba2;
        }
        
        #fileInput {
            display: none;
        }
        
        .preview-img {
            max-width: 100%;
            max-height: 300px;
            margin: 20px auto;
            display: block;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        
        .result-section {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            min-height: 200px;
        }
        
        .latex-display {
            padding: 15px;
            background: white;
            border-left: 4px solid #667eea;
            margin: 10px 0;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .stat-box {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            color: #666;
            margin-top: 5px;
            font-size: 0.9em;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            transition: transform 0.2s;
            margin: 5px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }
        
        .loading.active {
            display: block;
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .tab-container {
            margin-top: 20px;
        }
        
        .tab-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .tab-btn {
            padding: 10px 20px;
            background: #e9ecef;
            border: none;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .tab-btn.active {
            background: white;
            font-weight: bold;
        }
        
        .tab-content {
            display: none;
            padding: 20px;
            background: white;
            border-radius: 0 8px 8px 8px;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .collaboration-status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-left: 10px;
        }
        
        .status-claude {
            background: #4fc3f7;
            color: white;
        }
        
        .status-qwen {
            background: #81c784;
            color: white;
        }
        
        .status-collab {
            background: linear-gradient(135deg, #4fc3f7 0%, #81c784 100%);
            color: white;
        }
        
        .educational-content {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
        }
        
        .educational-content h3 {
            color: #856404;
            margin-bottom: 10px;
        }
        
        .concept-tag {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            margin: 2px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧮 Mathpix Integration - Palantir Math v5.0</h1>
        
        <div class="main-grid">
            <!-- Upload Section -->
            <div class="card">
                <h2>📤 Upload & Process</h2>
                
                <div class="upload-area" id="uploadArea">
                    <p style="font-size: 1.2em; color: #667eea; margin-bottom: 10px;">
                        Drop image here or click to upload
                    </p>
                    <p style="color: #666;">
                        Supports JPEG, PNG, GIF, PDF (max 10MB)
                    </p>
                    <input type="file" id="fileInput" accept="image/*,application/pdf" />
                </div>
                
                <img id="preview" class="preview-img" style="display: none;" />
                
                <div style="margin-top: 20px;">
                    <label style="display: block; margin-bottom: 10px;">
                        <input type="checkbox" id="educationalMode" />
                        Enable Educational Analysis
                    </label>
                    
                    <button class="btn" id="processBtn" disabled>
                        Process with Claude-Qwen
                    </button>
                    
                    <button class="btn" id="clearBtn">
                        Clear
                    </button>
                </div>
                
                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <p style="margin-top: 10px;">Processing...</p>
                    <p id="processingStatus" style="font-size: 0.9em; color: #666;"></p>
                </div>
            </div>
            
            <!-- Results Section -->
            <div class="card">
                <h2>📊 Results 
                    <span id="processorStatus" class="collaboration-status" style="display: none;"></span>
                </h2>
                
                <div class="tab-container">
                    <div class="tab-buttons">
                        <button class="tab-btn active" data-tab="latex">LaTeX</button>
                        <button class="tab-btn" data-tab="text">Text</button>
                        <button class="tab-btn" data-tab="analysis">Analysis</button>
                        <button class="tab-btn" data-tab="educational">Educational</button>
                    </div>
                    
                    <div class="tab-content active" id="latex-tab">
                        <div id="latexResult" class="latex-display">
                            LaTeX output will appear here...
                        </div>
                        <div id="mathDisplay" style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
                            <!-- MathJax rendered output -->
                        </div>
                    </div>
                    
                    <div class="tab-content" id="text-tab">
                        <div id="textResult" style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            Text output will appear here...
                        </div>
                    </div>
                    
                    <div class="tab-content" id="analysis-tab">
                        <div id="analysisResult">
                            <h4>Classification</h4>
                            <div id="classification" style="margin: 10px 0;"></div>
                            
                            <h4>Concepts</h4>
                            <div id="concepts" style="margin: 10px 0;"></div>
                            
                            <h4>Validation</h4>
                            <div id="validation" style="margin: 10px 0;"></div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="educational-tab">
                        <div id="educationalResult" class="educational-content">
                            Educational content will appear here when enabled...
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Statistics Section -->
        <div class="card">
            <h2>📈 Live Statistics</h2>
            
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-value" id="totalRequests">0</div>
                    <div class="stat-label">Total Requests</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-value" id="successRate">0%</div>
                    <div class="stat-label">Success Rate</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-value" id="avgTime">0ms</div>
                    <div class="stat-label">Avg. Processing</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-value" id="cacheHits">0%</div>
                    <div class="stat-label">Cache Hit Rate</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-value" id="claudeTasks">0</div>
                    <div class="stat-label">Claude Tasks</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-value" id="qwenTasks">0</div>
                    <div class="stat-label">Qwen Tasks</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-value" id="activeUsers">0</div>
                    <div class="stat-label">Active Users</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-value" id="uptime">0s</div>
                    <div class="stat-label">Uptime</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const socket = io();
        let currentFile = null;
        
        // MathJax configuration
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']]
            }
        };
        
        // DOM elements
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const preview = document.getElementById('preview');
        const processBtn = document.getElementById('processBtn');
        const clearBtn = document.getElementById('clearBtn');
        const loading = document.getElementById('loading');
        const processingStatus = document.getElementById('processingStatus');
        const processorStatus = document.getElementById('processorStatus');
        
        // Upload handling
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
        
        function handleFile(file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('File too large. Maximum size is 10MB.');
                return;
            }
            
            currentFile = file;
            processBtn.disabled = false;
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                preview.style.display = 'none';
            }
        }
        
        // Process button
        processBtn.addEventListener('click', async () => {
            if (!currentFile) return;
            
            loading.classList.add('active');
            processBtn.disabled = true;
            processingStatus.textContent = 'Uploading image...';
            
            const formData = new FormData();
            formData.append('image', currentFile);
            formData.append('educational', document.getElementById('educationalMode').checked);
            
            try {
                processingStatus.textContent = 'Processing with Mathpix API...';
                
                const response = await fetch('/api/ocr', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    displayResults(data.result);
                } else {
                    alert('Error: ' + data.error);
                }
                
            } catch (error) {
                alert('Processing failed: ' + error.message);
            } finally {
                loading.classList.remove('active');
                processBtn.disabled = false;
            }
        });
        
        // Clear button
        clearBtn.addEventListener('click', () => {
            currentFile = null;
            preview.style.display = 'none';
            preview.src = '';
            fileInput.value = '';
            processBtn.disabled = true;
            clearResults();
        });
        
        // Display results
        function displayResults(result) {
            // Show processor status
            let processor = 'Unknown';
            let statusClass = '';
            
            if (result.type === 'claude_analysis') {
                processor = 'Claude';
                statusClass = 'status-claude';
            } else if (result.type === 'qwen_processing') {
                processor = 'Qwen';
                statusClass = 'status-qwen';
            } else if (result.metadata?.collaborationType === 'claude-qwen') {
                processor = 'Claude + Qwen';
                statusClass = 'status-collab';
            }
            
            processorStatus.textContent = processor;
            processorStatus.className = 'collaboration-status ' + statusClass;
            processorStatus.style.display = 'inline-block';
            
            // Display LaTeX
            if (result.ocr?.latex || result.result?.latex_styled) {
                const latex = result.ocr?.latex || result.result?.latex_styled;
                document.getElementById('latexResult').textContent = latex;
                
                // Render with MathJax
                document.getElementById('mathDisplay').innerHTML = '$$' + latex + '$$';
                MathJax.typesetPromise();
            }
            
            // Display text
            if (result.ocr?.text || result.result?.text) {
                document.getElementById('textResult').textContent = 
                    result.ocr?.text || result.result?.text;
            }
            
            // Display analysis
            if (result.analysis) {
                const classification = result.analysis.classification || {};
                const concepts = result.analysis.concepts || [];
                const validation = result.analysis.isValid !== undefined ? 
                    (result.analysis.isValid ? '✅ Valid' : '❌ Invalid') : 'Not validated';
                
                document.getElementById('classification').innerHTML = 
                    '<p>Subject: ' + (classification.subject || 'Unknown') + '</p>' +
                    '<p>Difficulty: ' + (classification.difficulty || 'Unknown') + '</p>';
                
                document.getElementById('concepts').innerHTML = 
                    concepts.map(c => '<span class="concept-tag">' + c + '</span>').join('');
                
                document.getElementById('validation').innerHTML = validation;
            }
            
            // Display educational content
            if (result.educational) {
                const edu = result.educational;
                let eduHTML = '<h3>Educational Analysis</h3>';
                
                if (edu.summary) {
                    eduHTML += '<p><strong>Summary:</strong> ' + edu.summary + '</p>';
                }
                
                if (edu.keyPoints && edu.keyPoints.length > 0) {
                    eduHTML += '<p><strong>Key Points:</strong></p><ul>';
                    edu.keyPoints.forEach(point => {
                        eduHTML += '<li>' + point + '</li>';
                    });
                    eduHTML += '</ul>';
                }
                
                if (edu.practiceProblems && edu.practiceProblems.length > 0) {
                    eduHTML += '<p><strong>Practice Problems:</strong></p><ul>';
                    edu.practiceProblems.forEach(problem => {
                        eduHTML += '<li>' + problem + '</li>';
                    });
                    eduHTML += '</ul>';
                }
                
                document.getElementById('educationalResult').innerHTML = eduHTML;
            }
        }
        
        function clearResults() {
            document.getElementById('latexResult').textContent = 'LaTeX output will appear here...';
            document.getElementById('mathDisplay').innerHTML = '';
            document.getElementById('textResult').textContent = 'Text output will appear here...';
            document.getElementById('analysisResult').innerHTML = '';
            document.getElementById('educationalResult').innerHTML = 'Educational content will appear here when enabled...';
            processorStatus.style.display = 'none';
        }
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                
                // Update buttons
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(tabName + '-tab').classList.add('active');
            });
        });
        
        // Socket event handlers
        socket.on('stats-update', (data) => {
            // Update service stats
            if (data.service) {
                document.getElementById('totalRequests').textContent = data.service.totalRequests;
                document.getElementById('successRate').textContent = data.service.successRate || '0%';
                document.getElementById('activeUsers').textContent = data.service.activeUsers;
                document.getElementById('uptime').textContent = data.service.uptime + 's';
            }
            
            // Update orchestrator stats
            if (data.orchestrator) {
                document.getElementById('claudeTasks').textContent = data.orchestrator.claudeTasks;
                document.getElementById('qwenTasks').textContent = data.orchestrator.qwenTasks;
                document.getElementById('avgTime').textContent = data.orchestrator.averageProcessingTime;
                
                if (data.orchestrator.mathpixStats) {
                    document.getElementById('cacheHits').textContent = 
                        data.orchestrator.mathpixStats.cacheHitRate;
                }
            }
        });
        
        socket.on('collaboration-event', (data) => {
            if (data.type === 'started') {
                processingStatus.textContent = 'Claude-Qwen collaboration initiated...';
            } else if (data.type === 'completed') {
                processingStatus.textContent = 'Collaboration completed in ' + data.time + 'ms';
            }
        });
        
        socket.on('processing-event', (data) => {
            if (data.type === 'ocr-complete') {
                processingStatus.textContent = 'OCR completed in ' + data.latency + 'ms';
            }
        });
    </script>
</body>
</html>`;
    }
    
    start() {
        this.server.listen(this.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════════╗
║           MATHPIX INTEGRATION SERVICE - PALANTIR v5.0         ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🌐 Dashboard:     http://localhost:${this.port}                       ║
║  📡 API Base:      http://localhost:${this.port}/api                   ║
║                                                                ║
║  Mathpix API Credentials:                                     ║
║  ✅ App ID:        ${this.orchestrator.mathpixConfig.mathpix.credentials.app_id}         ║
║  ✅ App Key:       ****...${this.orchestrator.mathpixConfig.mathpix.credentials.app_key.slice(-8)}           ║
║                                                                ║
║  Features:                                                     ║
║  ✅ Image OCR (handwritten & printed)                        ║
║  ✅ LaTeX conversion & rendering                             ║
║  ✅ PDF processing                                           ║
║  ✅ Batch processing                                         ║
║  ✅ Educational analysis                                     ║
║  ✅ Claude-Qwen collaboration                                ║
║                                                                ║
║  Endpoints:                                                    ║
║  POST /api/ocr      - Process single image                    ║
║  POST /api/batch    - Process multiple images                 ║
║  POST /api/render   - Render LaTeX to SVG/PNG                 ║
║  POST /api/classify - Classify math problems                  ║
║  GET  /api/stats    - Service statistics                      ║
║  GET  /api/health   - Health check                           ║
║                                                                ║
║  Rate Limits:                                                  ║
║  - 20 requests/minute                                         ║
║  - 1000 requests/month                                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
            `);
        });
    }
}

// Start the service
const service = new MathpixIntegrationService();
service.start();

module.exports = MathpixIntegrationService;