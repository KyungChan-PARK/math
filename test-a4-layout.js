#!/usr/bin/env node

import A4LayoutAnalyzer from './a4-layout-analyzer.js';
import chalk from 'chalk';
import path from 'path';

async function testA4Layout() {
    const analyzer = new A4LayoutAnalyzer();
    
    try {
        await analyzer.initialize();
        
        const worksheetPath = path.resolve('/home/palantir/projects/math/test-10problems-ratio-to-linear.html');
        
        console.log(chalk.cyan('🔍 Testing A4 layout compatibility for 10-problem worksheet...'));
        
        // Analyze the current layout
        const analysis = await analyzer.analyzeLayout(worksheetPath);
        
        // Apply fixes if needed
        if (!analysis.a4Compatibility.fitsInSinglePage || analysis.issues.length > 0) {
            console.log(chalk.yellow('⚠️ Issues found - applying A4 optimization fixes...'));
            
            const fixedPath = path.resolve('/home/palantir/projects/math/test-10problems-ratio-to-linear-a4-optimized.html');
            await analyzer.applyFixes(worksheetPath, fixedPath);
            
            // Re-analyze the fixed version
            console.log(chalk.blue('\n🔄 Re-analyzing optimized version...'));
            const fixedAnalysis = await analyzer.analyzeLayout(fixedPath);
            
            console.log(chalk.green('✅ A4 optimization complete!'));
            console.log(chalk.gray(`Original height: ${analysis.dimensions.documentHeight}px`));
            console.log(chalk.gray(`Optimized height: ${fixedAnalysis.dimensions.documentHeight}px`));
            console.log(chalk.gray(`Pages: ${analysis.a4Compatibility.estimatedPages} → ${fixedAnalysis.a4Compatibility.estimatedPages}`));
        } else {
            console.log(chalk.green('✅ Worksheet already fits A4 layout perfectly!'));
        }
        
    } catch (error) {
        console.error(chalk.red(`💥 Error: ${error.message}`));
    } finally {
        await analyzer.cleanup();
    }
}

testA4Layout().catch(console.error);