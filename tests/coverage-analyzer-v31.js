/**
 * PALANTIR v3.1 테스트 커버리지 분석
 * 모든 모듈의 테스트 커버리지 확인 및 보고서 생성
 */

const fs = require('fs').promises;
const path = require('path');

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// 커버리지 결과
const coverage = {
    timestamp: new Date().toISOString(),
    modules: {},
    summary: {
        totalFiles: 0,
        testedFiles: 0,
        coverage: 0
    }
};

// 파일 유형별 필터
const fileFilters = {
    javascript: /\.(js|jsx|cjs|mjs)$/,
    python: /\.py$/,
    test: /\.(test|spec)\.(js|py)$/,
    config: /\.(json|md|txt|bat|sh|ps1)$/
};

// 테스트 파일 존재 여부 확인
async function checkTestFile(filePath) {
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath, path.extname(filePath));
    
    const testVariants = [
        `${basename}.test.js`,
        `${basename}.spec.js`,
        `test_${basename}.py`,
        `${basename}_test.py`
    ];
    
    for (const variant of testVariants) {
        const testPath = path.join(dir, variant);
        try {
            await fs.access(testPath);
            return { exists: true, path: testPath };
        } catch {
            // Continue checking
        }
    }
    
    // Check in tests directory
    const testsDir = path.join(dir, 'tests');
    for (const variant of testVariants) {
        const testPath = path.join(testsDir, variant);
        try {
            await fs.access(testPath);
            return { exists: true, path: testPath };
        } catch {
            // Continue checking
        }
    }
    
    return { exists: false, path: null };
}

// 모듈 분석
async function analyzeModule(modulePath, moduleName) {
    console.log(`\n${colors.blue}Analyzing: ${moduleName}${colors.reset}`);
    
    const moduleInfo = {
        name: moduleName,
        files: [],
        totalFiles: 0,
        testedFiles: 0,
        coverage: 0,
        missingTests: []
    };
    
    try {
        const stats = await fs.stat(modulePath);
        
        if (stats.isDirectory()) {
            const files = await fs.readdir(modulePath);
            
            for (const file of files) {
                const filePath = path.join(modulePath, file);
                const fileStats = await fs.stat(filePath);
                
                if (fileStats.isFile()) {
                    // Skip test files, config files
                    if (fileFilters.test.test(file) || fileFilters.config.test(file)) {
                        continue;
                    }
                    
                    // Check JavaScript and Python files
                    if (fileFilters.javascript.test(file) || fileFilters.python.test(file)) {
                        moduleInfo.totalFiles++;
                        
                        const testInfo = await checkTestFile(filePath);
                        
                        const fileData = {
                            name: file,
                            path: filePath,
                            hasTest: testInfo.exists,
                            testPath: testInfo.path
                        };
                        
                        moduleInfo.files.push(fileData);
                        
                        if (testInfo.exists) {
                            moduleInfo.testedFiles++;
                            console.log(`  ${colors.green}✓${colors.reset} ${file} - Test found`);
                        } else {
                            moduleInfo.missingTests.push(file);
                            console.log(`  ${colors.red}✗${colors.reset} ${file} - No test`);
                        }
                    }
                }
            }
            
            if (moduleInfo.totalFiles > 0) {
                moduleInfo.coverage = (moduleInfo.testedFiles / moduleInfo.totalFiles * 100).toFixed(1);
            }
        }
    } catch (error) {
        console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    }
    
    return moduleInfo;
}

// 전체 프로젝트 분석
async function analyzeProject() {
    console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.yellow}   PALANTIR v3.1 Test Coverage Analysis${colors.reset}`);
    console.log(`${colors.yellow}   Started: ${new Date().toLocaleString()}${colors.reset}`);
    console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    
    // 주요 모듈 분석
    const modules = [
        { path: 'C:/palantir/math/src', name: 'Core Sources' },
        { path: 'C:/palantir/math/src/lola-integration', name: 'LOLA Integration' },
        { path: 'C:/palantir/math/ai-agents', name: 'AI Agents' },
        { path: 'C:/palantir/math/server', name: 'Server' },
        { path: 'C:/palantir/math/frontend', name: 'Frontend' },
        { path: 'C:/palantir-project/palantir-api', name: 'PALANTIR API' },
        { path: 'C:/palantir-project/palantir-dashboard', name: 'PALANTIR Dashboard' }
    ];
    
    let totalFiles = 0;
    let totalTested = 0;
    
    for (const module of modules) {
        const moduleInfo = await analyzeModule(module.path, module.name);
        coverage.modules[module.name] = moduleInfo;
        
        totalFiles += moduleInfo.totalFiles;
        totalTested += moduleInfo.testedFiles;
    }
    
    // 전체 통계
    coverage.summary = {
        totalFiles,
        testedFiles: totalTested,
        coverage: totalFiles > 0 ? (totalTested / totalFiles * 100).toFixed(1) : 0
    };
    
    // 보고서 출력
    console.log(`\n${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.yellow}   COVERAGE SUMMARY${colors.reset}`);
    console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    
    console.log(`\n${colors.cyan}Module Coverage:${colors.reset}`);
    
    Object.entries(coverage.modules).forEach(([name, info]) => {
        const coverageColor = info.coverage >= 80 ? colors.green : 
                            info.coverage >= 60 ? colors.yellow : colors.red;
        
        console.log(`\n${name}:`);
        console.log(`  Files: ${info.testedFiles}/${info.totalFiles}`);
        console.log(`  Coverage: ${coverageColor}${info.coverage}%${colors.reset}`);
        
        if (info.missingTests.length > 0 && info.missingTests.length <= 5) {
            console.log(`  Missing tests: ${info.missingTests.join(', ')}`);
        } else if (info.missingTests.length > 5) {
            console.log(`  Missing tests: ${info.missingTests.slice(0, 5).join(', ')} ... and ${info.missingTests.length - 5} more`);
        }
    });
    
    // 전체 통계
    const overallColor = coverage.summary.coverage >= 80 ? colors.green : 
                        coverage.summary.coverage >= 60 ? colors.yellow : colors.red;
    
    console.log(`\n${colors.cyan}Overall Statistics:${colors.reset}`);
    console.log(`  Total Files: ${coverage.summary.totalFiles}`);
    console.log(`  Tested Files: ${coverage.summary.testedFiles}`);
    console.log(`  ${overallColor}Overall Coverage: ${coverage.summary.coverage}%${colors.reset}`);
    
    // 개선 제안
    console.log(`\n${colors.cyan}Improvement Suggestions:${colors.reset}`);
    
    const modulesNeedingWork = Object.entries(coverage.modules)
        .filter(([_, info]) => info.coverage < 80)
        .sort((a, b) => a[1].coverage - b[1].coverage);
    
    if (modulesNeedingWork.length > 0) {
        console.log(`\nModules needing more tests:`);
        modulesNeedingWork.forEach(([name, info]) => {
            const needed = Math.ceil(info.totalFiles * 0.8) - info.testedFiles;
            console.log(`  ${name}: Add ${needed} more test(s) to reach 80% coverage`);
        });
    } else {
        console.log(`  ${colors.green}All modules have good test coverage!${colors.reset}`);
    }
    
    // 테스트 생성 스크립트 제안
    if (coverage.summary.coverage < 100) {
        await generateTestTemplates();
    }
    
    // 보고서 저장
    const reportPath = `C:/palantir/math/tests/coverage-report-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(coverage, null, 2));
    console.log(`\n${colors.blue}Report saved to: ${reportPath}${colors.reset}`);
}

// 테스트 템플릿 생성
async function generateTestTemplates() {
    console.log(`\n${colors.cyan}Generating test templates...${colors.reset}`);
    
    const templates = {
        javascript: `// Test template for MODULE_NAME
const assert = require('assert');
const MODULE = require('./MODULE_FILE');

describe('MODULE_NAME', () => {
    it('should exist', () => {
        assert(MODULE);
    });
    
    // Add your tests here
    it('should perform expected function', () => {
        // Test implementation
    });
});
`,
        python: `"""Test template for MODULE_NAME"""
import unittest
from MODULE_FILE import *

class TestMODULE_NAME(unittest.TestCase):
    def test_exists(self):
        """Test module exists"""
        self.assertIsNotNone(MODULE)
    
    # Add your tests here
    def test_functionality(self):
        """Test expected functionality"""
        pass

if __name__ == '__main__':
    unittest.main()
`
    };
    
    let templatesGenerated = 0;
    
    // Generate templates for missing tests
    for (const [moduleName, moduleInfo] of Object.entries(coverage.modules)) {
        if (moduleInfo.missingTests.length > 0 && templatesGenerated < 5) {
            for (const file of moduleInfo.missingTests.slice(0, 2)) {
                const ext = path.extname(file);
                const basename = path.basename(file, ext);
                
                if (ext === '.js' || ext === '.jsx') {
                    const testFile = `test_${basename}.js`;
                    const testPath = `C:/palantir/math/tests/generated/${testFile}`;
                    const template = templates.javascript
                        .replace(/MODULE_NAME/g, basename)
                        .replace(/MODULE_FILE/g, file);
                    
                    try {
                        await fs.mkdir('C:/palantir/math/tests/generated', { recursive: true });
                        await fs.writeFile(testPath, template);
                        console.log(`  Generated: ${testFile}`);
                        templatesGenerated++;
                    } catch (error) {
                        // Ignore errors
                    }
                }
                
                if (templatesGenerated >= 5) break;
            }
        }
    }
    
    if (templatesGenerated > 0) {
        console.log(`  ${colors.green}Generated ${templatesGenerated} test templates${colors.reset}`);
    }
}

// 실행
analyzeProject().catch(error => {
    console.error(`${colors.red}Analysis failed: ${error.message}${colors.reset}`);
    process.exit(1);
});
