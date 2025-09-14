const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function initCollections() {
    // 문제 컬렉션
    await db.collection('problems').doc('init').set({
        created: new Date(),
        unit: 'algebra2_unit2',
        status: 'pending_review'
    });
    
    // 학생 프로파일
    await db.collection('students').doc('init').set({
        created: new Date(),
        grade: 10,
        preferences: {}
    });
    
    // 교사 리뷰
    await db.collection('reviews').doc('init').set({
        created: new Date(),
        teacherId: 'teacher1',
        status: 'pending'
    });
    
    console.log('✅ Firestore collections initialized');
}

initCollections().catch(console.error);
