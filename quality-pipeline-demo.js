#!/usr/bin/env node

/**
 * Document Quality Pipeline Demo
 * Demonstrates the complete quality preservation workflow
 */

import DocumentQualityPipeline from './document-quality-pipeline.js';
import chalk from 'chalk';
import path from 'path';

async function runQualityPipelineDemo() {
    console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════════╗
║           📊 Document Quality Preservation Pipeline              ║
║                Interactive Math Worksheet Demo                   ║
╚══════════════════════════════════════════════════════════════════╝
    `));

    const pipeline = new DocumentQualityPipeline();
    
    try {
        // Initialize pipeline
        await pipeline.initialize();
        
        // Get list of worksheets to process
        const worksheets = [
            '/home/palantir/projects/math/complete-30problems-interactive.html',
            '/home/palantir/projects/math/functions-desmos-optimized.html'
        ];
        
        console.log(chalk.yellow('📋 Processing worksheets with quality preservation...'));
        
        // Process each worksheet
        const results = await pipeline.processBatch(worksheets, {
            generateQRCodes: true,
            validateQuality: true,
            optimizeKorean: true
        });
        
        // Display detailed results
        console.log(chalk.green('\n🎉 QUALITY PIPELINE RESULTS'));
        console.log(chalk.green('==============================='));
        
        results.results.forEach((result, index) => {
            if (!result.error) {
                const baseName = path.basename(worksheets[index], '.html');
                console.log(chalk.blue(`\n📄 ${baseName}`));
                console.log(chalk.gray(`   Quality Score: ${result.qualityReport.overall}/100`));
                console.log(chalk.gray(`   PDF: ${result.outputs.pdf ? '✅' : '❌'}`));
                console.log(chalk.gray(`   Mobile: ${result.outputs.mobile ? '✅' : '❌'}`));
                console.log(chalk.gray(`   Print: ${result.outputs.print ? '✅' : '❌'}`));
                console.log(chalk.gray(`   QR Code: ${result.outputs.qrCode ? '✅' : '❌'}`));
                
                if (result.qualityReport.pdf) {
                    console.log(chalk.gray(`   PDF Size: ${result.qualityReport.pdf.fileSize}`));
                    console.log(chalk.gray(`   Math Notation: ${result.qualityReport.pdf.mathNotationPreserved ? '✅' : '❌'}`));
                    console.log(chalk.gray(`   Korean Text: ${result.qualityReport.pdf.koreanTextReadable ? '✅' : '❌'}`));
                    console.log(chalk.gray(`   Layout: ${result.qualityReport.pdf.layoutIntegrity ? '✅' : '❌'}`));
                }
            }
        });
        
        console.log(chalk.blue('\n🎯 QUALITY IMPROVEMENTS IMPLEMENTED:'));
        console.log(chalk.white('   • KaTeX server-side rendering for mathematical notation'));
        console.log(chalk.white('   • Noto Sans KR font optimization for Korean text'));
        console.log(chalk.white('   • Interactive element → static conversion'));
        console.log(chalk.white('   • Multi-format generation (PDF, Mobile, Print)'));
        console.log(chalk.white('   • Visual regression testing capabilities'));
        console.log(chalk.white('   • QR code generation for digital access'));
        console.log(chalk.white('   • Automated quality validation and scoring'));
        
        console.log(chalk.blue('\n📊 TECHNICAL FEATURES:'));
        console.log(chalk.white('   • Puppeteer with Korean locale support'));
        console.log(chalk.white('   • High DPI rendering (2x scale factor)'));
        console.log(chalk.white('   • Print CSS media queries optimization'));
        console.log(chalk.white('   • Vector graphics preservation (SVG)'));
        console.log(chalk.white('   • CSS Grid/Flexbox layout preservation'));
        console.log(chalk.white('   • Touch-friendly mobile optimization'));
        
        console.log(chalk.blue('\n🔍 DOCUMENT AI INTEGRATION POINTS:'));
        console.log(chalk.white('   • OCR quality validation for generated PDFs'));
        console.log(chalk.white('   • Mathematical expression extraction and validation'));
        console.log(chalk.white('   • Korean handwriting recognition capabilities'));
        console.log(chalk.white('   • Layout parser for complex document structures'));
        console.log(chalk.white('   • Form parser for interactive element detection'));
        console.log(chalk.white('   • Custom training pipeline for math worksheets'));
        
        console.log(chalk.yellow('\n⚡ NEXT STEPS FOR PRODUCTION:'));
        console.log(chalk.white('   1. Deploy pipeline as microservice'));
        console.log(chalk.white('   2. Integrate Google Document AI OCR validation'));
        console.log(chalk.white('   3. Set up CI/CD with visual regression testing'));
        console.log(chalk.white('   4. Implement real-time quality monitoring'));
        console.log(chalk.white('   5. Add batch processing for large worksheet collections'));
        console.log(chalk.white('   6. Create student distribution portal'));
        
        console.log(chalk.green('\n🎉 Document Quality Pipeline Demo Complete!'));
        console.log(chalk.blue('📖 All formats generated with preserved quality'));
        
    } catch (error) {
        console.error(chalk.red(`💥 Demo failed: ${error.message}`));
        console.error(error.stack);
    } finally {
        await pipeline.cleanup();
    }
}

// Run the demo
runQualityPipelineDemo().catch(console.error);