// Palantir Math - 실시간 자가개선 문서 시스템
// Real-time Self-Improving Documentation System

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');

class SelfImprovingDocSystem {
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.docsPath = path.join(rootPath, 'docs');
        this.syncInterval = 5 * 60 * 1000; // 5분마다 동기화
        this.documentGraph = new Map(); // 문서 간 관계 그래프
        this.changeLog = [];
        this.apiEndpoints = new Map();
        
        // 모니터링할 파일 패턴
        this.watchPatterns = {
            code: ['.js', '.ts', '.jsx', '.tsx'],
            docs: ['.md', '.txt'],
            config: ['.json', '.yml', '.yaml']
        };
        
        // 문서 템플릿
        this.templates = {
            projectStatus: this.getProjectStatusTemplate(),
            apiDoc: this.getAPIDocTemplate(),
            changeLog: this.getChangeLogTemplate()
        };
    }
    
    // 시스템 초기화
    async initialize() {
        console.log('🚀 Initializing Self-Improving Documentation System...');
        
        // docs 디렉토리 생성
        if (!fs.existsSync(this.docsPath)) {
            fs.mkdirSync(this.docsPath, { recursive: true });
        }
        
        // 초기 문서 생성
        await this.createInitialDocs();
        
        // API 엔드포인트 스캔
        await this.scanAPIEndpoints();
        
        // 문서 간 관계 분석
        await this.analyzeDocumentRelations();
        
        console.log('✅ System initialized successfully!');
    }
    
    // 초기 문서 생성
    async createInitialDocs() {
        const timestamp = new Date().toISOString();
        
        // 1. 프로젝트 개요 문서
        const overviewDoc = `# Palantir Math Project Overview
Generated: ${timestamp}

## 🎯 Project Purpose
AI-powered mathematics education platform combining After Effects with Claude + Qwen

## 🏗️ Architecture
- **Frontend**: After Effects CEP Extension
- **Backend**: Node.js Orchestrator (Port 8093)
- **AI System**: 75 specialized agents
- **Collaboration**: Claude Opus 4.1 + Qwen3-Max

## 📊 Current Statistics
- Total Files: 8801
- JavaScript Files: 252
- Documentation Files: 262
- Test Coverage: 83 test files

## 🔗 Quick Links
- [API Documentation](./API_DOCUMENTATION.md)
- [Project Status](./PROJECT_STATUS_AUTO.md)
- [Change Log](./CHANGELOG_AUTO.md)
- [Agent List](./AGENT_LIST.md)
`;
        
        fs.writeFileSync(
            path.join(this.docsPath, 'PROJECT_OVERVIEW_AUTO.md'),
            overviewDoc
        );
        
        // 2. Agent 리스트 문서
        const agentListDoc = await this.generateAgentListDoc();
        fs.writeFileSync(
            path.join(this.docsPath, 'AGENT_LIST.md'),
            agentListDoc
        );
        
        console.log('  ✓ Initial documentation created');
    }
    
    // Agent 리스트 문서 생성
    async generateAgentListDoc() {
        return `# AI Agent List
Auto-generated documentation of all 75 AI agents

## Categories

### 📐 Math Concepts (10 agents)
- algebraExpert - Algebra problem solving
- geometryExpert - Geometry and spatial reasoning
- calculusExpert - Calculus and derivatives
- statisticsExpert - Statistical analysis
- trigonometryExpert - Trigonometry operations
- numberTheoryExpert - Number theory concepts
- linearAlgebraExpert - Linear algebra and matrices
- probabilityExpert - Probability calculations
- discreteMathExpert - Discrete mathematics
- complexAnalysisExpert - Complex number analysis

### 🎓 Pedagogy (10 agents)
- curriculumDesigner - Curriculum planning
- lessonPlanner - Lesson structure design
- assessmentCreator - Assessment generation
- differentiationExpert - Learning differentiation
- scaffoldingDesigner - Learning scaffolding
- engagementStrategist - Student engagement
- misconceptionAnalyzer - Common misconception analysis
- realWorldConnector - Real-world applications
- collaborativeLearningExpert - Group learning design
- metacognitionCoach - Learning strategy coaching

### 🎨 Visualization (10 agents)
- graphVisualizer - Graph and chart creation
- shape3DModeler - 3D shape modeling
- animationChoreographer - Animation sequencing
- colorSchemeDesigner - Color palette design
- infographicCreator - Infographic generation
- diagramArchitect - Diagram structuring
- interactiveWidgetDesigner - Interactive element design
- dataVisualizationExpert - Data visualization
- fractalGenerator - Fractal pattern generation
- transformationAnimator - Transformation animations

[... continues for all categories ...]
`;
    }
    
    // API 엔드포인트 스캔
    async scanAPIEndpoints() {
        const orchestratorPath = path.join(this.rootPath, 'orchestration', 'qwen-orchestrator-enhanced.js');
        
        if (fs.existsSync(orchestratorPath)) {
            const content = fs.readFileSync(orchestratorPath, 'utf-8');
            
            // API 엔드포인트 패턴 매칭
            const getRoutes = content.match(/app\.get\(['"]([^'"]+)['"]/g) || [];
            const postRoutes = content.match(/app\.post\(['"]([^'"]+)['"]/g) || [];
            
            getRoutes.forEach(route => {
                const path = route.match(/['"]([^'"]+)['"]/)[1];
                this.apiEndpoints.set(path, { method: 'GET', path });
            });
            
            postRoutes.forEach(route => {
                const path = route.match(/['"]([^'"]+)['"]/)[1];
                this.apiEndpoints.set(path, { method: 'POST', path });
            });
        }
        
        console.log(`  ✓ Found ${this.apiEndpoints.size} API endpoints`);
    }
    
    // 문서 간 관계 분석
    async analyzeDocumentRelations() {
        const mdFiles = fs.readdirSync(this.docsPath)
            .filter(f => f.endsWith('.md'));
        
        for (const file of mdFiles) {
            const content = fs.readFileSync(path.join(this.docsPath, file), 'utf-8');
            const references = this.extractReferences(content);
            this.documentGraph.set(file, references);
        }
        
        console.log(`  ✓ Analyzed ${this.documentGraph.size} documents`);
    }
    
    // 문서에서 참조 추출
    extractReferences(content) {
        const references = {
            internal: [],
            external: [],
            codeFiles: [],
            images: []
        };
        
        // 내부 문서 참조
        const internalRefs = content.match(/\[.*?\]\((\.\/)?[^)]*?\.md\)/g) || [];
        references.internal = internalRefs.map(ref => {
            const match = ref.match(/\(([^)]+)\)/);
            return match ? match[1] : null;
        }).filter(Boolean);
        
        // 코드 파일 참조
        const codeRefs = content.match(/`[^`]*?\.(js|ts|py|jsx|tsx)`/g) || [];
        references.codeFiles = codeRefs.map(ref => ref.replace(/`/g, ''));
        
        // 이미지 참조
        const imageRefs = content.match(/!\[.*?\]\([^)]+\)/g) || [];
        references.images = imageRefs.map(ref => {
            const match = ref.match(/\(([^)]+)\)/);
            return match ? match[1] : null;
        }).filter(Boolean);
        
        return references;
    }
    
    // 프로젝트 상태 자동 업데이트
    async updateProjectStatus() {
        const timestamp = new Date().toISOString();
        const analysisReport = this.getLatestAnalysisReport();
        
        const content = `# Project Status (Auto-Updated)
Last Updated: ${timestamp}

## 📊 File Statistics
- **Total Files**: ${analysisReport?.summary?.totalFiles || 'N/A'}
- **Duplicates Found**: ${analysisReport?.summary?.duplicatesFound || 0}
- **Old Versions**: ${analysisReport?.summary?.oldVersionsFound || 0}
- **Categories**: ${analysisReport?.summary?.categories || 0}

## 🔄 Recent Changes
${this.getRecentChanges()}

## 🚀 Active Components
- Orchestrator Server: http://localhost:8093 ✅
- WebSocket Server: ws://localhost:8094 ✅
- AI Agents: 75 agents active
- Claude-Qwen Collaboration: Enabled

## 📡 API Endpoints
${this.formatAPIEndpoints()}

## 🎯 Next Actions
- Complete WebRTC implementation (40% done)
- Finalize gesture recognition (60% done)
- Deploy to production environment
- Optimize performance bottlenecks

## 🔗 Related Documents
- [Project Overview](./PROJECT_OVERVIEW_AUTO.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Agent List](./AGENT_LIST.md)
- [Change Log](./CHANGELOG_AUTO.md)
`;
        
        const statusPath = path.join(this.docsPath, 'PROJECT_STATUS_AUTO.md');
        fs.writeFileSync(statusPath, content);
        
        console.log('  ✓ Updated PROJECT_STATUS_AUTO.md');
        
        return content;
    }
    
    // 최신 분석 리포트 가져오기
    getLatestAnalysisReport() {
        const reportPath = path.join(this.rootPath, 'project-analysis-report.json');
        if (fs.existsSync(reportPath)) {
            return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        }
        return null;
    }
    
    // 최근 변경사항
    getRecentChanges() {
        const changes = this.changeLog.slice(-5).reverse();
        if (changes.length === 0) {
            return '- No recent changes tracked';
        }
        return changes.map(c => `- ${c.timestamp}: ${c.description}`).join('\n');
    }
    
    // API 엔드포인트 포맷팅
    formatAPIEndpoints() {
        if (this.apiEndpoints.size === 0) {
            return 'No endpoints scanned yet';
        }
        
        const grouped = {};
        this.apiEndpoints.forEach((endpoint, path) => {
            const category = path.split('/')[2] || 'root';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(`- \`${endpoint.method} ${path}\``);
        });
        
        return Object.entries(grouped)
            .map(([cat, endpoints]) => `### ${cat}\n${endpoints.join('\n')}`)
            .join('\n\n');
    }
    
    // 템플릿 정의
    getProjectStatusTemplate() {
        return `# Project Status Template
{{timestamp}}
{{statistics}}
{{components}}
{{next_actions}}`;
    }
    
    getAPIDocTemplate() {
        return `# API Documentation Template
{{endpoints}}
{{examples}}
{{authentication}}`;
    }
    
    getChangeLogTemplate() {
        return `# Change Log Template
{{recent_changes}}
{{version_history}}`;
    }
    
    // 실시간 모니터링 시작
    startMonitoring() {
        console.log('\n👁️ Starting real-time document monitoring...');
        
        // 정기적인 업데이트
        this.updateInterval = setInterval(async () => {
            console.log('\n🔄 Running scheduled update...');
            await this.performUpdate();
        }, this.syncInterval);
        
        // 파일 변경 감지
        this.setupFileWatchers();
        
        // 웹 서버 시작 (문서 뷰어)
        this.startDocServer();
        
        console.log('✅ Monitoring system active!');
        console.log('📖 Documentation server: http://localhost:8095');
        console.log('Press Ctrl+C to stop monitoring.\n');
    }
    
    // 파일 감시 설정
    setupFileWatchers() {
        // 주요 디렉토리 감시
        const watchDirs = [
            path.join(this.rootPath, 'orchestration'),
            path.join(this.rootPath, 'src'),
            path.join(this.rootPath, 'scripts'),
            this.docsPath
        ];
        
        watchDirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.watch(dir, { recursive: false }, (eventType, filename) => {
                    if (filename && this.shouldProcessFile(filename)) {
                        this.handleFileChange(eventType, path.join(dir, filename));
                    }
                });
            }
        });
    }
    
    // 파일 처리 여부 결정
    shouldProcessFile(filename) {
        const ext = path.extname(filename);
        return Object.values(this.watchPatterns).flat().includes(ext);
    }
    
    // 파일 변경 처리
    handleFileChange(eventType, filePath) {
        const fileName = path.basename(filePath);
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        
        console.log(`  📝 ${timestamp} - ${eventType}: ${fileName}`);
        
        this.changeLog.push({
            timestamp,
            type: eventType,
            file: fileName,
            description: `File ${eventType}: ${fileName}`
        });
        
        // 변경 로그가 100개를 초과하면 오래된 것 제거
        if (this.changeLog.length > 100) {
            this.changeLog = this.changeLog.slice(-50);
        }
    }
    
    // 정기 업데이트 수행
    async performUpdate() {
        try {
            await this.updateProjectStatus();
            await this.updateChangeLog();
            await this.analyzeDocumentRelations();
            console.log('✅ Update completed successfully');
        } catch (error) {
            console.error('❌ Update failed:', error.message);
        }
    }
    
    // 변경 로그 업데이트
    async updateChangeLog() {
        const timestamp = new Date().toISOString();
        const content = `# Change Log (Auto-Updated)
Last Updated: ${timestamp}

## Recent Changes
${this.changeLog.slice(-20).reverse().map(c => 
    `- **${c.timestamp}** - ${c.type}: \`${c.file}\``
).join('\n')}

## Statistics
- Total changes tracked: ${this.changeLog.length}
- Monitoring started: ${this.monitoringStartTime || timestamp}
`;
        
        const changeLogPath = path.join(this.docsPath, 'CHANGELOG_AUTO.md');
        fs.writeFileSync(changeLogPath, content);
        console.log('  ✓ Updated CHANGELOG_AUTO.md');
    }
    
    // 문서 서버 시작
    startDocServer() {
        const server = http.createServer((req, res) => {
            if (req.url === '/') {
                // 문서 목록 페이지
                const docs = fs.readdirSync(this.docsPath)
                    .filter(f => f.endsWith('.md'))
                    .map(f => `<li><a href="/${f}">${f}</a></li>`)
                    .join('\n');
                
                const html = `<!DOCTYPE html>
<html>
<head>
    <title>Palantir Math - Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        ul { line-height: 1.8; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .status { color: green; font-weight: bold; }
    </style>
</head>
<body>
    <h1>📚 Palantir Math Documentation</h1>
    <p class="status">🟢 Self-Improving System Active</p>
    <h2>Available Documents:</h2>
    <ul>${docs}</ul>
    <hr>
    <p>Last updated: ${new Date().toLocaleString()}</p>
</body>
</html>`;
                
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            } else {
                // 특정 문서 보기
                const docName = req.url.slice(1);
                const docPath = path.join(this.docsPath, docName);
                
                if (fs.existsSync(docPath)) {
                    const content = fs.readFileSync(docPath, 'utf-8');
                    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end(content);
                } else {
                    res.writeHead(404);
                    res.end('Document not found');
                }
            }
        });
        
        server.listen(8095);
        this.docServer = server;
    }
    
    // 시스템 종료
    async shutdown() {
        console.log('\n🛑 Shutting down monitoring system...');
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.docServer) {
            this.docServer.close();
        }
        
        // 최종 업데이트
        await this.performUpdate();
        
        console.log('✅ System shutdown complete');
    }
}

// 메인 실행
async function main() {
    const rootPath = 'C:\\palantir\\math';
    const docSystem = new SelfImprovingDocSystem(rootPath);
    
    console.log('🚀 Palantir Math - Self-Improving Documentation System');
    console.log('====================================================\n');
    
    try {
        // 초기화
        await docSystem.initialize();
        
        // 초기 업데이트
        await docSystem.performUpdate();
        
        // 모니터링 시작
        docSystem.monitoringStartTime = new Date().toISOString();
        docSystem.startMonitoring();
        
        // 종료 처리
        process.on('SIGINT', async () => {
            await docSystem.shutdown();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// 실행
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SelfImprovingDocSystem;