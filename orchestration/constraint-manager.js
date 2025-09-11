/**
 * Constraint-based Orchestration System
 * Palantir Apollo 스타일 구현
 */

import EventEmitter from 'events';

export class ConstraintManager extends EventEmitter {
  constructor() {
    super();
    this.constraints = {
      dependency: [],
      schema: [],
      environment: [],
      service: []
    };
    this.initializeConstraints();
  }

  initializeConstraints() {
    // 의존성 제약
    this.addConstraint('dependency', {
      name: 'neo4j_availability',
      check: async () => this.checkNeo4jConnection(),
      critical: true,
      message: 'Neo4j must be running before ontology operations'
    });

    this.addConstraint('dependency', {
      name: 'websocket_before_realtime',
      check: async (state) => {
        return !state.realtime || state.websocket_ready;
      },
      critical: true,
      message: 'WebSocket must be initialized before realtime features'
    });

    // 스키마 제약
    this.addConstraint('schema', {
      name: 'migration_order',
      check: async (state) => {
        // CEP-UXP 마이그레이션은 WebSocket 최적화 후 진행
        if (state.cep_uxp_progress > 60 && state.websocket_progress < 80) {
          return false;
        }
        return true;
      },
      message: 'CEP-UXP migration requires WebSocket optimization > 80%'
    });

    // 환경 제약
    this.addConstraint('environment', {
      name: 'port_availability',
      check: async () => this.checkPortAvailability([8080, 8081, 7687]),
      critical: false,
      message: 'Required ports must be available'
    });
  }

  addConstraint(type, constraint) {
    this.constraints[type].push(constraint);
  }

  async validateDeployment(targetState, currentState = {}) {
    const results = {
      valid: true,
      violations: [],
      warnings: []
    };

    // 모든 제약 조건 검증
    for (const [type, constraints] of Object.entries(this.constraints)) {
      for (const constraint of constraints) {
        try {
          const isValid = await constraint.check(targetState, currentState);
          
          if (!isValid) {
            if (constraint.critical) {
              results.valid = false;
              results.violations.push({
                type,
                name: constraint.name,
                message: constraint.message
              });
            } else {
              results.warnings.push({
                type,
                name: constraint.name,
                message: constraint.message
              });
            }
          }
        } catch (error) {
          results.warnings.push({
            type,
            name: constraint.name,
            message: `Check failed: ${error.message}`
          });
        }
      }
    }

    this.emit('validationComplete', results);
    return results;
  }

  async checkNeo4jConnection() {
    try {
      const neo4j = await import('neo4j-driver');
      const driver = neo4j.default.driver(
        'bolt://localhost:7687',
        neo4j.default.auth.basic('neo4j', 'aemax2025')
      );
      const session = driver.session();
      await session.run('RETURN 1');
      await session.close();
      await driver.close();
      return true;
    } catch {
      return false;
    }
  }

  async checkPortAvailability(ports) {
    const net = await import('net');
    
    for (const port of ports) {
      const isAvailable = await new Promise(resolve => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => {
          server.close();
          resolve(true);
        });
        server.listen(port);
      });
      
      if (!isAvailable) return false;
    }
    return true;
  }
}

export default ConstraintManager;
