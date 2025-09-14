#!/usr/bin/env node

/**
 * Datastore 모드 테스트
 * Firestore가 Datastore 모드로 생성된 경우 사용
 */

const { Datastore } = require('@google-cloud/datastore');
require('dotenv').config();

async function testDatastore() {
    console.log('🔥 Datastore 연결 테스트\n');

    try {
        const datastore = new Datastore({
            projectId: process.env.GCP_PROJECT_ID || 'math-project-472006',
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });

        // 테스트 엔티티 생성
        const kind = 'TestEntity';
        const key = datastore.key([kind, 'test-' + Date.now()]);

        const entity = {
            key: key,
            data: {
                test: true,
                timestamp: new Date(),
                project: 'math-project-472006',
                message: 'Datastore 모드 테스트 성공!'
            }
        };

        // 저장
        await datastore.save(entity);
        console.log('✅ Datastore 쓰기 성공:', key.path);

        // 읽기
        const [savedEntity] = await datastore.get(key);
        if (savedEntity) {
            console.log('✅ Datastore 읽기 성공:', savedEntity.message);
        }

        // 삭제
        await datastore.delete(key);
        console.log('✅ Datastore 삭제 성공');

        console.log('\n✨ Datastore 모드가 정상 작동합니다!');
        console.log('참고: Firestore Native 모드를 사용하려면 새 데이터베이스 생성이 필요합니다.');

        return true;
    } catch (error) {
        console.error('❌ Datastore 오류:', error.message);
        return false;
    }
}

// Firestore Native 모드로 마이그레이션 안내
async function showMigrationGuide() {
    console.log('\n📋 Firestore Native 모드 마이그레이션 가이드:');
    console.log('1. 새 Firestore 데이터베이스 생성 (Multi-database 기능 사용)');
    console.log('   gcloud firestore databases create --database=firestore-native --location=us-central1');
    console.log('2. 또는 Datastore 모드 계속 사용');
    console.log('   - @google-cloud/datastore 패키지 사용');
    console.log('   - 대부분의 기능 동일하게 작동');
}

async function main() {
    await testDatastore();
    await showMigrationGuide();
}

// datastore 패키지 설치 확인
try {
    require('@google-cloud/datastore');
} catch (e) {
    console.log('패키지 설치 필요: npm install @google-cloud/datastore');
    process.exit(1);
}

main().catch(console.error);