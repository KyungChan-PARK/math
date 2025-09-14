/**
 * Firestore/Datastore 통합 래퍼
 * Datastore 모드를 Firestore처럼 사용할 수 있게 해주는 래퍼
 */

const { Datastore } = require('@google-cloud/datastore');

class FirestoreWrapper {
    constructor(projectId) {
        this.datastore = new Datastore({
            projectId: projectId || process.env.GCP_PROJECT_ID || 'math-project-472006',
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
    }

    // Firestore 스타일의 collection 메서드
    collection(collectionName) {
        return new CollectionWrapper(this.datastore, collectionName);
    }
}

class CollectionWrapper {
    constructor(datastore, collectionName) {
        this.datastore = datastore;
        this.kind = collectionName;
    }

    // 문서 추가 (Firestore의 add와 유사)
    async add(data) {
        const key = this.datastore.key([this.kind]);
        const entity = {
            key: key,
            data: {
                ...data,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        };

        await this.datastore.save(entity);

        return {
            id: key.path[1] || key.id,
            get: async () => {
                const [result] = await this.datastore.get(key);
                return {
                    exists: !!result,
                    data: () => result
                };
            },
            delete: async () => {
                await this.datastore.delete(key);
            }
        };
    }

    // 문서 참조 (Firestore의 doc와 유사)
    doc(docId) {
        return new DocumentWrapper(this.datastore, this.kind, docId);
    }

    // 쿼리 실행 (Firestore의 get와 유사)
    async get() {
        const query = this.datastore.createQuery(this.kind);
        const [entities] = await this.datastore.runQuery(query);

        return {
            docs: entities.map(entity => ({
                id: entity[this.datastore.KEY].id || entity[this.datastore.KEY].name,
                data: () => entity,
                ref: new DocumentWrapper(
                    this.datastore,
                    this.kind,
                    entity[this.datastore.KEY].id || entity[this.datastore.KEY].name
                )
            })),
            empty: entities.length === 0,
            size: entities.length
        };
    }

    // where 조건 추가
    where(field, operator, value) {
        const query = this.datastore.createQuery(this.kind);

        // 연산자 매핑
        const operatorMap = {
            '==': '=',
            '===': '=',
            '>': '>',
            '>=': '>=',
            '<': '<',
            '<=': '<='
        };

        query.filter(field, operatorMap[operator] || operator, value);

        return {
            get: async () => {
                const [entities] = await this.datastore.runQuery(query);
                return {
                    docs: entities.map(entity => ({
                        id: entity[this.datastore.KEY].id || entity[this.datastore.KEY].name,
                        data: () => entity
                    })),
                    empty: entities.length === 0,
                    size: entities.length
                };
            }
        };
    }
}

class DocumentWrapper {
    constructor(datastore, kind, docId) {
        this.datastore = datastore;
        this.kind = kind;
        this.docId = docId;
        this.key = datastore.key([kind, docId]);
    }

    // 문서 설정 (Firestore의 set와 유사)
    async set(data, options = {}) {
        const entity = {
            key: this.key,
            data: {
                ...data,
                updatedAt: new Date()
            }
        };

        if (!options.merge) {
            entity.data.createdAt = entity.data.createdAt || new Date();
        }

        await this.datastore.save(entity);
        return this;
    }

    // 문서 가져오기 (Firestore의 get와 유사)
    async get() {
        const [entity] = await this.datastore.get(this.key);

        return {
            exists: !!entity,
            id: this.docId,
            data: () => entity || null,
            ref: this
        };
    }

    // 문서 업데이트 (Firestore의 update와 유사)
    async update(data) {
        const [current] = await this.datastore.get(this.key);

        if (!current) {
            throw new Error(`Document ${this.docId} does not exist`);
        }

        const entity = {
            key: this.key,
            data: {
                ...current,
                ...data,
                updatedAt: new Date()
            }
        };

        await this.datastore.save(entity);
        return this;
    }

    // 문서 삭제 (Firestore의 delete와 유사)
    async delete() {
        await this.datastore.delete(this.key);
    }
}

// 사용 예제
function getFirestore(projectId) {
    return new FirestoreWrapper(projectId);
}

module.exports = {
    FirestoreWrapper,
    getFirestore
};