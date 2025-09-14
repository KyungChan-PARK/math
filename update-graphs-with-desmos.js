#!/usr/bin/env node

/**
 * Replace manual SVG graphs with Desmos API generated graphs
 * Fix PDF rendering issues for coordinate plane graphs
 */

import DesmosGraphGenerator from './desmos-graph-generator.js';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

async function updateGraphsWithDesmos() {
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║                🎯 Desmos API Graph Replacement                ║
║              Fixing PDF Rendering Issues                      ║
╚═══════════════════════════════════════════════════════════════╝
`));

    const htmlFilePath = '/home/palantir/projects/math/functions(~250913).html';
    const outputFilePath = '/home/palantir/projects/math/functions-desmos-optimized.html';
    
    try {
        // Generate graphs using Desmos API
        console.log(chalk.yellow('📊 Generating graphs with Desmos API...'));
        const generator = new DesmosGraphGenerator();
        const graphResults = await generator.generateAllGraphs();
        
        if (graphResults.errors.length > 0) {
            console.log(chalk.red('❌ Some graphs failed to generate:'));
            graphResults.errors.forEach(error => console.log(chalk.red(`   • ${error}`)));
        }
        
        // Read the original HTML file
        console.log(chalk.yellow('📖 Reading original HTML file...'));
        let htmlContent = await fs.readFile(htmlFilePath, 'utf-8');
        
        // Replace Problem 13 graph
        if (graphResults.problem13) {
            console.log(chalk.blue('🔄 Replacing Problem 13 graph...'));
            const problem13Config = {
                description: '시간에 따른 자동차의 총 이동거리',
                coordinates: '(1시간, 80km), (3시간, 160km), (5시간, 240km)'
            };
            
            const base64Data = fs.readFileSync(graphResults.problem13, { encoding: 'base64' });
            const newGraph13 = `
                <div class="visual-element">
                    <div style="border: 2px solid #ddd; width: 320px; height: 220px; margin: 20px auto; border-radius: 8px; overflow: hidden; background: white;">
                        <img src="data:image/png;base64,${base64Data}" 
                             alt="Problem 13 Graph - Car Distance over Time" 
                             style="width: 100%; height: 100%; object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact;"
                             class="desmos-graph-image" />
                    </div>
                    
                    <div style="margin: 15px 0; text-align: center; background: #fff3e0; padding: 10px; border-radius: 6px;">
                        <strong>그래프 정보:</strong> ${problem13Config.description}<br>
                        <strong>좌표점:</strong> ${problem13Config.coordinates}
                    </div>
                </div>`;
            
            // Find and replace the existing SVG graph
            const problem13Pattern = /<div class="visual-element">[\s\S]*?<\/svg>[\s\S]*?<\/div>[\s\S]*?<\/div>/;
            htmlContent = htmlContent.replace(problem13Pattern, newGraph13);
        }
        
        // Replace Problem 14 graph
        if (graphResults.problem14) {
            console.log(chalk.blue('🔄 Replacing Problem 14 graph...'));
            const problem14Config = {
                description: '하루 동안의 기온 변화',
                coordinates: '(6시, 10°C), (12시, 25°C), (18시, 15°C)'
            };
            
            const base64Data = fs.readFileSync(graphResults.problem14, { encoding: 'base64' });
            const newGraph14 = `
                <div class="visual-element">
                    <div style="border: 2px solid #ddd; width: 320px; height: 220px; margin: 20px auto; border-radius: 8px; overflow: hidden; background: white;">
                        <img src="data:image/png;base64,${base64Data}" 
                             alt="Problem 14 Graph - Temperature Change" 
                             style="width: 100%; height: 100%; object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact;"
                             class="desmos-graph-image" />
                    </div>
                    
                    <div style="margin: 15px 0; text-align: center; background: #fff3e0; padding: 10px; border-radius: 6px;">
                        <strong>그래프 정보:</strong> ${problem14Config.description}<br>
                        <strong>좌표점:</strong> ${problem14Config.coordinates}
                    </div>
                </div>`;
            
            // Find and replace the second visual-element (Problem 14)
            const sections = htmlContent.split('<div class="visual-element">');
            if (sections.length >= 3) {
                // Find the end of the second visual-element section
                const secondSection = sections[2];
                const endIndex = secondSection.indexOf('</div>\n                </div>') + '</div>\n                </div>'.length;
                const originalGraph14 = '<div class="visual-element">' + secondSection.substring(0, endIndex);
                htmlContent = htmlContent.replace(originalGraph14, newGraph14);
            }
        }
        
        // Add CSS optimizations for Desmos graphs
        const desmosCSS = `
        /* Desmos Graph PDF Optimization */
        .desmos-graph-image {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
        }
        
        @media print {
            .desmos-graph-image {
                break-inside: avoid;
                page-break-inside: avoid;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .visual-element {
                break-inside: avoid;
                page-break-inside: avoid;
            }
        }`;
        
        // Insert CSS before closing </style> tag
        htmlContent = htmlContent.replace('</style>', desmosCSS + '\n        </style>');
        
        // Save the updated HTML file
        console.log(chalk.yellow('💾 Saving updated HTML file...'));
        await fs.writeFile(outputFilePath, htmlContent, 'utf-8');
        
        console.log(chalk.green(`✅ Successfully updated HTML file: ${outputFilePath}`));
        
        // Generate summary report
        console.log(chalk.blue('\n📊 DESMOS INTEGRATION REPORT'));
        console.log(chalk.blue('==============================='));
        console.log(chalk.gray(`Original file: ${path.basename(htmlFilePath)}`));
        console.log(chalk.gray(`Updated file: ${path.basename(outputFilePath)}`));
        console.log(chalk.gray(`Graphs replaced: ${Object.keys(graphResults).filter(k => k !== 'errors' && graphResults[k]).length}`));
        console.log(chalk.gray(`Errors: ${graphResults.errors.length}`));
        
        if (graphResults.problem13) {
            console.log(chalk.green(`✅ Problem 13: Linear function (car distance)`));
        }
        if (graphResults.problem14) {
            console.log(chalk.green(`✅ Problem 14: Piecewise function (temperature)`));
        }
        
        console.log(chalk.yellow('\n🎯 PDF RENDERING IMPROVEMENTS:'));
        console.log(chalk.white('   • Replaced manual SVG with high-quality PNG images'));
        console.log(chalk.white('   • Added print-color-adjust: exact for consistent PDF output'));
        console.log(chalk.white('   • Embedded base64 images for offline PDF generation'));
        console.log(chalk.white('   • Optimized for A4 page layout and printing'));
        
        console.log(chalk.green('\n🎉 Desmos graph integration completed successfully!'));
        console.log(chalk.blue(`📄 Test PDF generation with: ${outputFilePath}`));
        
    } catch (error) {
        console.error(chalk.red(`💥 Failed to update graphs: ${error.message}`));
        console.error(chalk.red(error.stack));
        process.exit(1);
    }
}

// Execute the update
updateGraphsWithDesmos();