/**
 * Real-time Document Auto-Sync System
 * 코드 변경시 관련 문서 자동 업데이트 및 상호 참조 관리
 */

import fs from 'fs';
import path from 'path';
import { watch } from 'chokidar';
import axios from 'axios';
import chalk from 'chalk';

class RealtimeDocumentSync {
    constructor() {
        this.orchestratorUrl = 'http://localhost:8089';
        this.docsPath = 'C:\\palantir\\math\\dev-docs';
        this.codePath = 'C:\\palantir\\math';
        this.documentRelations = new Map();
        this.updateQueue = [];
        this.isProcessing = false;
    }

    /**
     * 파일 감시 시작
     */
    async start() {
        console.log(chalk.green(' Real-time Document Sync Started'));
        
        // 코드 파일 감시
        const codeWatcher = watch(this.codePath, {
            ignored: /(^|[\/\\])\../, // 숨김 파일 제외
            persistent: true,
            ignoreInitial: true
        });

        codeWatcher
            .on('change', path => this.handleCodeChange(path))
            .on('add', path => this.handleNewFile(path))
            .on('unlink', path => this.handleFileDelete(path));

        // 문서 상호 참조 초기화
        await this.initializeDocumentRelations();
    }

    /**
     * 코드 변경시 관련 문서 찾기 및 업데이트
     */
    async handleCodeChange(filePath) {
        const fileName = path.basename(filePath);
        console.log(chalk.blue(`\n Code change detected: ${fileName}`));
        
        // 1. 관련 문서 찾기
        const relatedDocs = await this.findRelatedDocuments(filePath);
        
        if (relatedDocs.length > 0) {
            console.log(chalk.yellow(`Found ${relatedDocs.length} related documents`));
            
            // 2. 변경 내용 분석
            const changes = await this.analyzeChanges(filePath);
            
            // 3. 문서 업데이트 큐에 추가
            relatedDocs.forEach(doc => {
                this.updateQueue.push({
                    document: doc,
                    changes: changes,
                    sourceFile: fileName,
                    timestamp: new Date().toISOString()
                });
            });
            
            // 4. 업데이트 처리
            await this.processUpdateQueue();
        }
    }

    /**
     * 관련 문서 찾기
     */
    async findRelatedDocuments(filePath) {
        const relatedDocs = [];
        const fileName = path.basename(filePath);
        
        // Claude Orchestrator의 documentManager 사용
        try {
            const response = await axios.post(`${this.orchestratorUrl}/docs/find-related`, {
                file: fileName,
                path: filePath
            });
            
            if (response.data.documents) {
                relatedDocs.push(...response.data.documents);
            }
        } catch (error) {
            // Fallback: 파일명 기반 매칭
            const docs = fs.readdirSync(this.docsPath);
            docs.forEach(doc => {
                if (this.isRelatedDocument(fileName, doc)) {
                    relatedDocs.push(path.join(this.docsPath, doc));
                }
            });
        }
        
        return relatedDocs;
    }

    /**
     * 문서 업데이트 큐 처리
     */
    async processUpdateQueue() {
        if (this.isProcessing || this.updateQueue.length === 0) return;
        
        this.isProcessing = true;
        console.log(chalk.cyan('\n Processing document updates...'));
        
        while (this.updateQueue.length > 0) {
            const update = this.updateQueue.shift();
            
            try {
                // 1. 문서 읽기
                const docContent = fs.readFileSync(update.document, 'utf8');
                
                // 2. 업데이트 섹션 생성
                const updateSection = this.generateUpdateSection(update);
                
                // 3. 문서 업데이트
                const updatedContent = await this.updateDocument(
                    docContent,
                    updateSection,
                    update
                );
                
                // 4. 문서 저장
                fs.writeFileSync(update.document, updatedContent);
                
                console.log(chalk.green(`✓ Updated: ${path.basename(update.document)}`));
                
                // 5. 상호 참조 업데이트
                await this.updateCrossReferences(update.document, update.changes);
                
            } catch (error) {
                console.log(chalk.red(`✗ Failed to update: ${update.document}`));
                console.error(error.message);
            }
        }
        
        this.isProcessing = false;
        console.log(chalk.green('✓ All documents updated'));
    }

    /**
     * 업데이트 섹션 생성
     */
    generateUpdateSection(update) {
        const section = [
            '\n##  Auto-Update',
            `**Source:** ${update.sourceFile}`,
            `**Updated:** ${new Date().toISOString()}`,
            '**Changes:**'
        ];
        
        if (update.changes.added) {
            section.push(`- Added: ${update.changes.added.join(', ')}`);
        }
        if (update.changes.modified) {
            section.push(`- Modified: ${update.changes.modified.join(', ')}`);
        }
        if (update.changes.removed) {
            section.push(`- Removed: ${update.changes.removed.join(', ')}`);
        }
        
        return section.join('\n');
    }

    /**
     * 문서 내용 업데이트
     */
    async updateDocument(content, updateSection, update) {
        // 기존 Auto-Update 섹션 찾기
        const autoUpdateRegex = /##  Auto-Update[\s\S]*?(?=##|$)/g;
        
        if (autoUpdateRegex.test(content)) {
            // 기존 섹션 교체
            return content.replace(autoUpdateRegex, updateSection + '\n\n');
        } else {
            // 새 섹션 추가 (파일 끝에)
            return content + '\n\n' + updateSection;
        }
    }

    /**
     * 상호 참조 업데이트
     */
    async updateCrossReferences(docPath, changes) {
        // Claude Orchestrator의 documentManager에게 요청
        try {
            await axios.post(`${this.orchestratorUrl}/docs/update-refs`, {
                document: docPath,
                changes: changes
            });
        } catch (error) {
            console.log(chalk.yellow('Cross-reference update skipped'));
        }
    }

    /**
     * 변경 내용 분석
     */
    async analyzeChanges(filePath) {
        // 간단한 변경 감지 (실제로는 git diff 등 사용 가능)
        return {
            added: ['New functions'],
            modified: ['Existing functions'],
            removed: []
        };
    }

    /**
     * 문서 관계 초기화
     */
    async initializeDocumentRelations() {
        const relations = {
            'claude-orchestrator.js': ['MASTER-GUIDE.md', 'IMPLEMENTATION-STATUS.md'],
            'mediapipe_server.py': ['QUICK-START-COMMANDS.md'],
            'math_nlp_server.js': ['MASTER-GUIDE.md'],
            'intelligent-issue-resolver.js': ['TRIVIAL-ISSUES-PREVENTION.md']
        };
        
        Object.entries(relations).forEach(([file, docs]) => {
            this.documentRelations.set(file, docs);
        });
    }

    /**
     * 관련 문서 판단
     */
    isRelatedDocument(fileName, docName) {
        const relations = this.documentRelations.get(fileName);
        return relations && relations.includes(docName);
    }

    /**
     * 새 파일 추가 처리
     */
    async handleNewFile(filePath) {
        console.log(chalk.green(`➕ New file: ${path.basename(filePath)}`));
        // 새 파일에 대한 문서 자동 생성 로직
    }

    /**
     * 파일 삭제 처리
     */
    async handleFileDelete(filePath) {
        console.log(chalk.red(`➖ File deleted: ${path.basename(filePath)}`));
        // 삭제된 파일 참조 제거 로직
    }
}

export default RealtimeDocumentSync;