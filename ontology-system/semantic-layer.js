/**
 * Semantic Layer - Palantir Ontology 스타일
 * After Effects 객체와 의미적 관계 관리
 */

import neo4j from 'neo4j-driver';

export class SemanticLayer {
  constructor(driver) {
    this.driver = driver;
    this.objectTypes = new Map();
    this.actionTypes = new Map();
    this.defineAEObjectTypes();
  }

  defineAEObjectTypes() {
    // After Effects 핵심 객체 타입 정의
    this.objectTypes.set('Composition', {
      properties: ['name', 'width', 'height', 'frameRate', 'duration'],
      constraints: {
        width: { min: 1, max: 32768 },
        height: { min: 1, max: 32768 },
        frameRate: { min: 1, max: 120 }
      }
    });

    this.objectTypes.set('Layer', {
      properties: ['name', 'type', 'startTime', 'duration', 'opacity'],
      constraints: {
        opacity: { min: 0, max: 100 },
        startTime: { min: 0 }
      }
    });

    this.objectTypes.set('Effect', {
      properties: ['name', 'type', 'enabled', 'parameters'],
      constraints: {
        enabled: { type: 'boolean' }
      }
    });

    // Action Types 정의 (Palantir 스타일)
    this.defineActionTypes();
  }

  defineActionTypes() {
    // After Effects 작업을 위한 Action Types
    this.actionTypes.set('CREATE_COMPOSITION', {
      parameters: ['name', 'width', 'height', 'frameRate', 'duration'],
      validation: async (params) => this.validateComposition(params),
      execute: async (params) => this.createComposition(params)
    });

    this.actionTypes.set('ADD_LAYER', {
      parameters: ['compId', 'layerType', 'name'],
      validation: async (params) => this.validateLayer(params),
      execute: async (params) => this.addLayer(params)
    });

    this.actionTypes.set('APPLY_EFFECT', {
      parameters: ['layerId', 'effectName', 'parameters'],
      validation: async (params) => this.validateEffect(params),
      execute: async (params) => this.applyEffect(params)
    });
  }

  async validateComposition(params) {
    const constraints = this.objectTypes.get('Composition').constraints;
    const errors = [];

    if (params.width < constraints.width.min || params.width > constraints.width.max) {
      errors.push(`Width must be between ${constraints.width.min} and ${constraints.width.max}`);
    }

    if (params.frameRate < constraints.frameRate.min || params.frameRate > constraints.frameRate.max) {
      errors.push(`Frame rate must be between ${constraints.frameRate.min} and ${constraints.frameRate.max}`);
    }

    return { valid: errors.length === 0, errors };
  }

  async createComposition(params) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `CREATE (c:Composition {
          id: randomUUID(),
          name: $name,
          width: $width,
          height: $height,
          frameRate: $frameRate,
          duration: $duration,
          created: datetime()
        }) RETURN c`,
        params
      );
      return result.records[0].get('c').properties;
    } finally {
      await session.close();
    }
  }

  async queryBySemantics(naturalLanguageQuery) {
    // 자연어 쿼리를 Cypher로 변환
    // 예: "1920x1080 컴포지션 찾기" → "MATCH (c:Composition {width: 1920, height: 1080})"
    // 실제 구현에서는 NLP 엔진과 통합
    const cypherQuery = this.translateToCypher(naturalLanguageQuery);
    const session = this.driver.session();
    
    try {
      const result = await session.run(cypherQuery);
      return result.records.map(r => r.toObject());
    } finally {
      await session.close();
    }
  }

  translateToCypher(query) {
    // 간단한 패턴 매칭 (실제는 더 복잡한 NLP 필요)
    if (query.includes('1920x1080')) {
      return 'MATCH (c:Composition {width: 1920, height: 1080}) RETURN c';
    }
    return 'MATCH (n) RETURN n LIMIT 10';
  }
}

export default SemanticLayer;
