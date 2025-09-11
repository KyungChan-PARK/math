/**
 * SMART-DOC Quick Test
 * 1분 이내 문서 수정 시뮬레이션
 */

import fs from 'fs/promises';
import path from 'path';

class QuickDocFixer {
    constructor() {
        this.startTime = null;
        this.endTime = null;
    }

    async fixAllDocs() {
        this.startTime = Date.now();
        console.log(' Starting Quick Fix...\n');

        const docs = [
            'UNIFIED_DOCUMENTATION.md',
            'README.md', 
            'QUICK_START.md',
            'API_REFERENCE.md'
        ];

        const standards = {
            date: '2025-09-08',
            nextReview: '2025-09-09',
            ports: {
                frontend: 3000,
                backend: 8086,
                websocket: 8089,
                monitoring: 8081
            }
        };

        let totalIssues = 0;
        let totalFixed = 0;

        for (const doc of docs) {
            const filePath = path.join('C:\\palantir\\math', doc);
            
            try {
                // Read
                let content = await fs.readFile(filePath, 'utf-8');
                let issues = 0;

                // Fix wrong dates
                const wrongDates = content.match(/2025-01-\d{2}/g);
                if (wrongDates) {
                    issues += wrongDates.length;
                    content = content.replace(/2025-01-\d{2}/g, standards.date);
                }

                // Fix next review dates
                content = content.replace(
                    /Next Review:.*?2025-\d{2}-\d{2}/g,
                    `Next Review: ${standards.nextReview}`
                );

                // Write if changed
                if (issues > 0) {
                    await fs.writeFile(filePath, content);
                    console.log(`✅ ${doc}: Fixed ${issues} issues`);
                    totalFixed += issues;
                }

                totalIssues += issues;

            } catch (error) {
                console.error(`❌ ${doc}: ${error.message}`);
            }
        }

        this.endTime = Date.now();
        const duration = this.endTime - this.startTime;

        console.log('\n' + '='.repeat(50));
        console.log(' QUICK FIX RESULTS');
        console.log('='.repeat(50));
        console.log(`⏱️ Total Time: ${duration}ms (${(duration/1000).toFixed(2)}s)`);
        console.log(` Documents: ${docs.length}`);
        console.log(` Issues Found: ${totalIssues}`);
        console.log(`✅ Issues Fixed: ${totalFixed}`);
        console.log(` Performance: ${duration < 1000 ? '✅ < 1 second!' : '️ Needs optimization'}`);
        console.log('='.repeat(50));

        return {
            duration,
            issues: totalIssues,
            fixed: totalFixed,
            success: duration < 1000
        };
    }
}

// Run test
const fixer = new QuickDocFixer();
fixer.fixAllDocs().catch(console.error);