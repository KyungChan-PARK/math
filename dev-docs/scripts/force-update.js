#!/usr/bin/env node
/**
 * Force immediate documentation update
 * Created: 2025-09-03
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const DOC_PATH = 'C:\\palantir\\math\\dev-docs';
const TODAY = '2025-09-03';

async function forceUpdateAllDocs() {
    const files = await readdir(DOC_PATH);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    for (const file of mdFiles) {
        const filePath = path.join(DOC_PATH, file);
        let content = await readFile(filePath, 'utf-8');
        
        // Fix date patterns
        content = content.replace(/2025-01-\d{2}/g, TODAY);
        content = content.replace(/2025-09-02/g, TODAY);
        content = content.replace(/Last Updated: \d{4}-\d{2}-\d{2}/g, `Last Updated: ${TODAY}`);
        content = content.replace(/Updated: \d{4}-\d{2}-\d{2}/g, `Updated: ${TODAY}`);
        
        await writeFile(filePath, content, 'utf-8');
        console.log(`✅ Updated: ${file}`);
    }
}

forceUpdateAllDocs();
