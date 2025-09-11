/**
 * Real-time Document Sync System Starter
 * 문서 자동 동기화 시스템 활성화
 */

import RealtimeDocumentSync from './orchestration/realtime-doc-sync.js';
import fs from 'fs';
import path from 'path';

console.log('=== Real-time Document Sync System ===\n');

// 시스템 초기화
const docSync = new RealtimeDocumentSync();

// 상태 확인
console.log('Checking system status...');

// AUTO_SYNC_STATUS.json 업데이트
const projectRoot = 'C:\\palantir\\math';
const statusFile = path.join(projectRoot, 'AUTO_SYNC_STATUS.json');
const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));

status.document_sync = {
    active: true,
    startedAt: new Date().toISOString(),
    watchedFiles: 0,
    documentsUpdated: 0,
    lastSync: null
};

fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));

// 시스템 시작
console.log('Starting document sync system...');
docSync.start().then(() => {
    console.log('Document sync system is running');
    
    // 5초마다 상태 업데이트
    setInterval(() => {
        const currentStatus = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        currentStatus.document_sync.lastSync = new Date().toISOString();
        fs.writeFileSync(statusFile, JSON.stringify(currentStatus, null, 2));
    }, 5000);
}).catch(error => {
    console.error('Failed to start document sync:', error);
});

// 종료 시그널 처리
process.on('SIGINT', () => {
    console.log('\nShutting down document sync...');
    const currentStatus = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    currentStatus.document_sync.active = false;
    currentStatus.document_sync.stoppedAt = new Date().toISOString();
    fs.writeFileSync(statusFile, JSON.stringify(currentStatus, null, 2));
    process.exit(0);
});