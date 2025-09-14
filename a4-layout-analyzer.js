#!/usr/bin/env node

/**
 * A4 Layout Analyzer for Math Worksheets
 * Detects page break issues and optimizes layout for PDF printing
 */

import puppeteer from 'puppeteer';
import chalk from 'chalk';
import fs from 'fs-extra';

class A4LayoutAnalyzer {
    constructor() {
        this.a4Dimensions = {
            // A4 size in pixels at 96 DPI (CSS pixels)
            width: 794, // 210mm = 794px at 96 DPI
            height: 1123, // 297mm = 1123px at 96 DPI
            printableWidth: 720, // 794 - (20mm + 18mm margins) = 720px
            printableHeight: 967  // 1123 - (20mm + 20mm margins) = 967px
        };
        this.browser = null;
        this.issues = [];
    }

    /**
     * Initialize analyzer with browser
     */
    async initialize() {
        console.log(chalk.cyan('🔍 Initializing A4 Layout Analyzer...'));
        
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--font-render-hinting=none'
            ]
        });
        
        console.log(chalk.green('✅ Browser initialized'));
    }

    /**
     * Analyze HTML file for A4 layout compatibility
     */
    async analyzeLayout(htmlPath) {
        console.log(chalk.yellow(`📄 Analyzing A4 layout: ${htmlPath}`));
        
        const page = await this.browser.newPage();
        
        try {
            // Set A4 page size for accurate analysis
            await page.setViewport({
                width: this.a4Dimensions.width,
                height: this.a4Dimensions.height,
                deviceScaleFactor: 1
            });

            // Load the page
            await page.goto(`file://${htmlPath}`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            // Wait for any dynamic content to load
            await page.waitForTimeout(3000);

            // Emulate print media
            await page.emulateMediaType('print');

            // Get page dimensions and content height
            const pageMetrics = await page.evaluate(() => {
                const body = document.body;
                const html = document.documentElement;
                
                return {
                    documentHeight: Math.max(
                        body.scrollHeight,
                        body.offsetHeight,
                        html.clientHeight,
                        html.scrollHeight,
                        html.offsetHeight
                    ),
                    documentWidth: Math.max(
                        body.scrollWidth,
                        body.offsetWidth,
                        html.clientWidth,
                        html.scrollWidth,
                        html.offsetWidth
                    ),
                    viewportHeight: window.innerHeight,
                    viewportWidth: window.innerWidth
                };
            });

            // Analyze individual elements that might cause page breaks
            const elementAnalysis = await this.analyzeElements(page);
            
            // Calculate pages needed
            const estimatedPages = Math.ceil(pageMetrics.documentHeight / this.a4Dimensions.printableHeight);
            
            // Generate analysis report
            const analysis = {
                dimensions: pageMetrics,
                a4Compatibility: {
                    estimatedPages,
                    fitsInSinglePage: estimatedPages === 1,
                    widthOK: pageMetrics.documentWidth <= this.a4Dimensions.printableWidth,
                    heightOK: pageMetrics.documentHeight <= this.a4Dimensions.printableHeight
                },
                elements: elementAnalysis,
                issues: this.issues,
                recommendations: this.generateRecommendations(pageMetrics, elementAnalysis)
            };

            await this.generateReport(analysis);
            
            return analysis;

        } finally {
            await page.close();
        }
    }

    /**
     * Analyze individual elements for page break issues
     */
    async analyzeElements(page) {
        const elements = await page.evaluate(() => {
            const problematicElements = [];
            
            // Find all major content blocks
            const selectors = [
                '.problem',
                'section',
                'header',
                '.stage-header',
                '.bg-white.rounded-xl.shadow-lg',
                '.visual-element',
                'table'
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((element, index) => {
                    const rect = element.getBoundingClientRect();
                    const style = window.getComputedStyle(element);
                    
                    problematicElements.push({
                        selector: selector,
                        index: index,
                        height: rect.height,
                        width: rect.width,
                        top: rect.top + window.pageYOffset,
                        bottom: rect.bottom + window.pageYOffset,
                        marginTop: parseFloat(style.marginTop) || 0,
                        marginBottom: parseFloat(style.marginBottom) || 0,
                        padding: parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) || 0,
                        breakInside: style.breakInside,
                        pageBreakInside: style.pageBreakInside,
                        className: element.className,
                        id: element.id,
                        tagName: element.tagName
                    });
                });
            });
            
            return problematicElements;
        });

        // Analyze each element for potential issues
        elements.forEach(element => {
            // Check if element is too tall for a single page
            if (element.height > this.a4Dimensions.printableHeight * 0.9) {
                this.issues.push({
                    type: 'element_too_tall',
                    severity: 'high',
                    element: `${element.selector}[${element.index}]`,
                    height: element.height,
                    maxRecommended: this.a4Dimensions.printableHeight * 0.9,
                    description: `Element exceeds 90% of printable page height`
                });
            }

            // Check if element might cause awkward page breaks
            if (element.height > this.a4Dimensions.printableHeight * 0.5 && element.breakInside === 'auto') {
                this.issues.push({
                    type: 'potential_page_break',
                    severity: 'medium',
                    element: `${element.selector}[${element.index}]`,
                    height: element.height,
                    suggestion: 'Add break-inside: avoid or split into smaller sections',
                    description: `Large element without break protection may cause awkward page splits`
                });
            }

            // Check for excessive margins that might push content to next page
            if (element.marginTop + element.marginBottom > 100) {
                this.issues.push({
                    type: 'excessive_margins',
                    severity: 'low',
                    element: `${element.selector}[${element.index}]`,
                    totalMargin: element.marginTop + element.marginBottom,
                    description: `Excessive margins may push content unnecessarily to next page`
                });
            }
        });

        return elements;
    }

    /**
     * Generate recommendations for layout improvements
     */
    generateRecommendations(pageMetrics, elementAnalysis) {
        const recommendations = [];

        // Overall page height recommendations
        if (pageMetrics.documentHeight > this.a4Dimensions.printableHeight) {
            const excessHeight = pageMetrics.documentHeight - this.a4Dimensions.printableHeight;
            recommendations.push({
                type: 'height_reduction',
                priority: 'high',
                description: `Document is ${Math.round(excessHeight)}px too tall for single A4 page`,
                suggestion: 'Reduce padding, margins, or content density'
            });
        }

        // Width recommendations
        if (pageMetrics.documentWidth > this.a4Dimensions.printableWidth) {
            recommendations.push({
                type: 'width_reduction',
                priority: 'medium',
                description: 'Document width exceeds A4 printable area',
                suggestion: 'Reduce container max-width or adjust responsive breakpoints'
            });
        }

        // Element-specific recommendations
        const tallElements = elementAnalysis.filter(el => el.height > 300);
        if (tallElements.length > 3) {
            recommendations.push({
                type: 'element_optimization',
                priority: 'medium',
                description: `${tallElements.length} elements are quite tall (>300px)`,
                suggestion: 'Consider breaking large elements into smaller sections or reducing vertical padding'
            });
        }

        // Problem-specific recommendations for math worksheets
        const problems = elementAnalysis.filter(el => el.className.includes('problem'));
        if (problems.length > 0) {
            const averageProblemHeight = problems.reduce((sum, p) => sum + p.height, 0) / problems.length;
            const problemsPerPage = Math.floor(this.a4Dimensions.printableHeight / averageProblemHeight);
            
            recommendations.push({
                type: 'problem_layout',
                priority: 'medium',
                description: `Average problem height: ${Math.round(averageProblemHeight)}px, ~${problemsPerPage} problems per page`,
                suggestion: problemsPerPage < 2 ? 'Reduce problem height to fit more per page' : 'Good problem density'
            });
        }

        return recommendations;
    }

    /**
     * Generate detailed analysis report
     */
    async generateReport(analysis) {
        console.log(chalk.blue('\n📊 A4 LAYOUT ANALYSIS REPORT'));
        console.log(chalk.blue('=============================='));

        // Document Dimensions
        console.log(chalk.cyan('\n📐 Document Dimensions:'));
        console.log(chalk.gray(`   Width: ${analysis.dimensions.documentWidth}px (A4 printable: ${this.a4Dimensions.printableWidth}px)`));
        console.log(chalk.gray(`   Height: ${analysis.dimensions.documentHeight}px (A4 printable: ${this.a4Dimensions.printableHeight}px)`));
        console.log(chalk.gray(`   Estimated pages: ${analysis.a4Compatibility.estimatedPages}`));

        // Compatibility Status
        console.log(chalk.cyan('\n✅ A4 Compatibility:'));
        const widthStatus = analysis.a4Compatibility.widthOK ? '✅' : '❌';
        const heightStatus = analysis.a4Compatibility.fitsInSinglePage ? '✅' : '❌';
        console.log(chalk.gray(`   ${widthStatus} Width fits A4: ${analysis.a4Compatibility.widthOK}`));
        console.log(chalk.gray(`   ${heightStatus} Fits single page: ${analysis.a4Compatibility.fitsInSinglePage}`));

        // Issues Found
        if (this.issues.length > 0) {
            console.log(chalk.red(`\n⚠️  Issues Found (${this.issues.length}):`));
            this.issues.forEach((issue, index) => {
                const emoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🔵';
                console.log(chalk.gray(`   ${emoji} ${issue.element}: ${issue.description}`));
                if (issue.suggestion) {
                    console.log(chalk.gray(`      💡 ${issue.suggestion}`));
                }
            });
        } else {
            console.log(chalk.green('\n✅ No layout issues detected!'));
        }

        // Recommendations
        if (analysis.recommendations.length > 0) {
            console.log(chalk.yellow(`\n💡 Recommendations (${analysis.recommendations.length}):`));
            analysis.recommendations.forEach((rec, index) => {
                const emoji = rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '⚡' : '💡';
                console.log(chalk.gray(`   ${emoji} ${rec.description}`));
                console.log(chalk.gray(`      → ${rec.suggestion}`));
            });
        }

        // Element Summary
        const problems = analysis.elements.filter(el => el.className.includes('problem'));
        console.log(chalk.cyan(`\n📋 Content Summary:`));
        console.log(chalk.gray(`   Total elements analyzed: ${analysis.elements.length}`));
        console.log(chalk.gray(`   Problems detected: ${problems.length}`));
        if (problems.length > 0) {
            const avgHeight = problems.reduce((sum, p) => sum + p.height, 0) / problems.length;
            console.log(chalk.gray(`   Average problem height: ${Math.round(avgHeight)}px`));
        }

        // Save detailed report
        const reportPath = '/home/palantir/projects/math/a4-layout-report.json';
        await fs.writeFile(reportPath, JSON.stringify(analysis, null, 2));
        console.log(chalk.blue(`\n📄 Detailed report saved: ${reportPath}`));
    }

    /**
     * Generate optimized CSS for A4 layout
     */
    generateOptimizedCSS(analysis) {
        let css = `
/* A4 Layout Optimization - Auto-generated */
@page {
    size: A4;
    margin: 20mm 18mm;
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
}

@media print {
    body {
        font-size: 10pt !important;
        line-height: 1.4 !important;
    }
    
    /* Prevent awkward page breaks */
    .problem, .avoid-break {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
    }
    
    /* Optimize spacing for A4 */
    .mb-8, .mb-6 {
        margin-bottom: 1rem !important;
    }
    
    .p-8 {
        padding: 1rem !important;
    }
    
    .p-6 {
        padding: 0.75rem !important;
    }
`;

        // Add specific optimizations based on analysis
        if (analysis.a4Compatibility.estimatedPages > 1) {
            css += `
    /* Reduce vertical spacing for better page utilization */
    .rounded-xl {
        border-radius: 0.5rem !important;
    }
    
    .shadow-lg {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
    }
`;
        }

        // Add problem-specific optimizations
        const problems = analysis.elements.filter(el => el.className.includes('problem'));
        if (problems.length > 0) {
            const avgHeight = problems.reduce((sum, p) => sum + p.height, 0) / problems.length;
            if (avgHeight > 400) {
                css += `
    /* Compress problem layout */
    [data-problem] {
        margin-bottom: 1rem !important;
        padding: 0.75rem !important;
    }
    
    .visual-element {
        margin: 0.5rem 0 !important;
    }
`;
            }
        }

        css += `
}`;

        return css;
    }

    /**
     * Apply fixes to HTML file
     */
    async applyFixes(htmlPath, outputPath) {
        console.log(chalk.yellow('🔧 Applying A4 layout fixes...'));
        
        let htmlContent = await fs.readFile(htmlPath, 'utf-8');
        const analysis = await this.analyzeLayout(htmlPath);
        
        // Generate optimized CSS
        const optimizedCSS = this.generateOptimizedCSS(analysis);
        
        // Insert optimized CSS
        const styleEndIndex = htmlContent.lastIndexOf('</style>');
        if (styleEndIndex !== -1) {
            htmlContent = htmlContent.substring(0, styleEndIndex) + 
                         optimizedCSS + '\n' +
                         htmlContent.substring(styleEndIndex);
        }

        // Apply specific fixes based on analysis
        if (analysis.a4Compatibility.estimatedPages > 1) {
            // Reduce margins and padding for better space utilization
            htmlContent = htmlContent
                .replace(/mb-8/g, 'mb-4')
                .replace(/mb-6/g, 'mb-3')
                .replace(/p-8/g, 'p-4')
                .replace(/p-6/g, 'p-3');
        }

        // Save fixed version
        await fs.writeFile(outputPath, htmlContent);
        console.log(chalk.green(`✅ Fixed layout saved: ${outputPath}`));
        
        return outputPath;
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log(chalk.yellow('🔧 Browser closed'));
        }
    }
}

export default A4LayoutAnalyzer;