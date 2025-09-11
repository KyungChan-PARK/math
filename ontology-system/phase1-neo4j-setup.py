"""
Phase 1: Neo4j 기반 Ontology 시스템 구축
1인 개발자용 Palantir 스타일 구현
"""

import os
import json
from py2neo import Graph, Node, Relationship
from datetime import datetime

class AEOntologySystem:
    """AE Claude Max를 위한 Ontology 시스템"""
    
    def __init__(self):
        # Neo4j 연결 (Docker: neo4j:7687)
        self.graph = Graph("bolt://localhost:7687", auth=("neo4j", "password"))
        self.dev_docs_path = r"C:\palantir\math\dev-docs"
        
    def initialize_ontology(self):
        """온톨로지 초기 구조 생성"""
        
        # 1. 문서 노드 생성
        documents = [
            {"name": "00-UNIFIED-ARCHITECTURE", "layer": "L0", "type": "Core"},
            {"name": "01-AGENT-GUIDELINES", "layer": "L0", "type": "Core"},
            {"name": "06-VIBE-CODING-METHODOLOGY", "layer": "L1", "type": "Integration"},
            {"name": "08-REALTIME-INTERACTION", "layer": "L1", "type": "Integration"},
            {"name": "11-WEBSOCKET-PERFORMANCE", "layer": "L2", "type": "Migration"},
            {"name": "12-WINDOWS-ML-MIGRATION", "layer": "L2", "type": "Migration"},
            {"name": "13-GESTURE-RECOGNITION", "layer": "L2", "type": "Feature"},
            {"name": "10-PLATFORM-MIGRATION", "layer": "L3", "type": "Strategy"},
        ]
        
        # Cypher 쿼리로 노드 생성
        for doc in documents:
            query = """
            MERGE (d:Document {name: $name})
            SET d.layer = $layer, d.type = $type, d.updated = datetime()
            """
            self.graph.run(query, name=doc["name"], 
                          layer=doc["layer"], type=doc["type"])
        
        # 2. 관계 생성
        relationships = [
            ("00-UNIFIED-ARCHITECTURE", "DEFINES", "06-VIBE-CODING-METHODOLOGY"),
            ("00-UNIFIED-ARCHITECTURE", "DEFINES", "08-REALTIME-INTERACTION"),
            ("06-VIBE-CODING-METHODOLOGY", "USES", "08-REALTIME-INTERACTION"),
            ("08-REALTIME-INTERACTION", "REQUIRES", "11-WEBSOCKET-PERFORMANCE"),
            ("13-GESTURE-RECOGNITION", "DEPENDS_ON", "11-WEBSOCKET-PERFORMANCE"),
        ]
        
        for source, rel_type, target in relationships:
            query = """
            MATCH (a:Document {name: $source})
            MATCH (b:Document {name: $target})
            MERGE (a)-[r:%s]->(b)
            SET r.created = datetime()
            """ % rel_type
            self.graph.run(query, source=source, target=target)
            
    def detect_conflicts(self):
        """포트 충돌 및 의존성 문제 감지"""
        
        # 포트 충돌 검색
        query = """
        MATCH (d:Document)-[:USES_PORT]->(p:Port)
        WITH p.number as port, collect(d.name) as docs
        WHERE size(docs) > 1
        RETURN port, docs
        """
        conflicts = self.graph.run(query).data()
        return conflicts
    
    def track_agent_action(self, agent_name, action_type, details):
        """AI Agent 작업 추적"""
        
        query = """
        CREATE (a:AgentAction {
            agent: $agent,
            type: $action_type,
            details: $details,
            timestamp: datetime()
        })
        """
        self.graph.run(query, agent=agent_name, 
                      action_type=action_type, details=details)
    
    def get_document_dependencies(self, doc_name):
        """문서의 모든 의존성 조회"""
        
        query = """
        MATCH (d:Document {name: $name})-[*]->(dep:Document)
        RETURN DISTINCT dep.name as dependency
        """
        deps = self.graph.run(query, name=doc_name).data()
        return [d['dependency'] for d in deps]

if __name__ == "__main__":
    # Neo4j 초기화
    print(" Initializing Neo4j Ontology System...")
    ontology = AEOntologySystem()
    
    print(" Creating document nodes and relationships...")
    ontology.initialize_ontology()
    
    print(" Detecting conflicts...")
    conflicts = ontology.detect_conflicts()
    if conflicts:
        print(f"️ Found conflicts: {conflicts}")
    
    print("✅ Ontology system initialized successfully!")
