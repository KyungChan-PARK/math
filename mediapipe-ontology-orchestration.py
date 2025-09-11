"""
MediaPipe-Ontology-Orchestration Connector
연결성 검증 및 통합 시스템 구현
Created: 2025-01-27
Author: Claude Opus 4.1 - AE Claude Max v3.4.0
"""

import asyncio
from py2neo import Graph, Node, Relationship
import json
from dataclasses import dataclass
from typing import Dict, List, Optional
import websockets

@dataclass 
class MediaPipeOntologyConnector:
    """MediaPipe 제스처를 Neo4j Ontology와 연결"""
    
    def __init__(self):
        # Neo4j 연결
        self.graph = Graph("bolt://localhost:7687", auth=("neo4j", "aeclaudemax"))
        
        # 제스처-개념 매핑 테이블
        self.gesture_concept_mapping = {
            "PINCH": {
                "concept": "Scale",
                "math_objects": ["Triangle", "Circle", "Rectangle", "Function"],
                "parameters": ["size", "radius", "width", "height"]
            },
            "SPREAD": {
                "concept": "Angle",
                "math_objects": ["Triangle", "Arc", "Sector"],
                "parameters": ["degrees", "radians", "rotation"]
            },
            "GRAB": {
                "concept": "Translation",
                "math_objects": ["Point", "Shape", "Graph"],
                "parameters": ["x", "y", "position"]
            },
            "POINT": {
                "concept": "Selection",
                "math_objects": ["Vertex", "Point", "Intersection"],
                "parameters": ["coordinates", "index"]
            },
            "DRAW": {
                "concept": "Creation",
                "math_objects": ["Line", "Curve", "Path"],
                "parameters": ["start", "end", "control_points"]
            }
        }
        
        self.init_ontology()
    
    def init_ontology(self):
        """Ontology에 제스처 노드 추가"""
        try:
            # 제스처 패턴 노드 생성
            for gesture, mapping in self.gesture_concept_mapping.items():
                # 제스처 노드
                gesture_node = Node(
                    "MathGesture",
                    name=gesture,
                    concept=mapping["concept"],
                    created_at="2025-01-27"
                )
                self.graph.merge(gesture_node, "MathGesture", "name")
                
                # 수학 개념과 연결
                for obj in mapping["math_objects"]:
                    math_node = Node("MathObject", name=obj)
                    self.graph.merge(math_node, "MathObject", "name")
                    
                    rel = Relationship(
                        gesture_node, 
                        "CONTROLS", 
                        math_node,
                        parameters=mapping["parameters"]
                    )
                    self.graph.merge(rel)
                    
            print("✅ Gesture Ontology initialized in Neo4j")
            
        except Exception as e:
            print(f"❌ Ontology init failed: {e}")
    
    def query_gesture_action(self, gesture_type: str) -> Dict:
        """제스처에 대한 액션 쿼리"""
        query = """
        MATCH (g:MathGesture {name: $gesture})-[r:CONTROLS]->(m:MathObject)
        RETURN g.concept as concept, 
               collect(m.name) as objects,
               r.parameters as parameters
        """
        result = self.graph.run(query, gesture=gesture_type).data()
        return result[0] if result else {}
    
    def suggest_next_gesture(self, current_gesture: str) -> List[str]:
        """현재 제스처 다음에 올 수 있는 제스처 제안"""
        query = """
        MATCH (g1:MathGesture {name: $current})-[:FOLLOWED_BY]->(g2:MathGesture)
        RETURN g2.name as next_gesture, count(*) as frequency
        ORDER BY frequency DESC
        LIMIT 3
        """
        results = self.graph.run(query, current=current_gesture).data()
        return [r["next_gesture"] for r in results]
    
    def learn_gesture_pattern(self, gesture_sequence: List[str]):
        """제스처 시퀀스 패턴 학습"""
        for i in range(len(gesture_sequence) - 1):
            current = gesture_sequence[i]
            next_gesture = gesture_sequence[i + 1]
            
            # FOLLOWED_BY 관계 생성 또는 업데이트
            query = """
            MATCH (g1:MathGesture {name: $current})
            MATCH (g2:MathGesture {name: $next})
            MERGE (g1)-[r:FOLLOWED_BY]->(g2)
            ON CREATE SET r.count = 1
            ON MATCH SET r.count = r.count + 1
            """
            self.graph.run(query, current=current, next=next_gesture)


class MediaPipeOrchestrationHub:
    """Orchestration Hub와 MediaPipe 연결"""
    
    def __init__(self):
        self.hub_url = "ws://localhost:8085"
        self.spokes = {
            "nlp": "ws://localhost:8083",
            "gesture": "ws://localhost:8088",  
            "websocket": "ws://localhost:8085",
            "ml": "ws://localhost:8090"
        }
        self.ontology_connector = MediaPipeOntologyConnector()
        
    async def route_gesture_command(self, gesture_data: Dict):
        """제스처 명령을 적절한 spoke로 라우팅"""
        
        # 1. Ontology에서 액션 정보 조회
        action_info = self.ontology_connector.query_gesture_action(
            gesture_data["gesture"]
        )
        
        # 2. 제약 검증
        if not self.validate_constraints(gesture_data, action_info):
            return {"status": "rejected", "reason": "constraint violation"}
        
        # 3. 적절한 Spoke로 라우팅
        target_spoke = self.determine_target_spoke(action_info)
        
        # 4. 명령 전송
        async with websockets.connect(self.spokes[target_spoke]) as ws:
            command = self.build_command(gesture_data, action_info)
            await ws.send(json.dumps(command))
            response = await ws.recv()
            
        # 5. 학습
        if gesture_data.get("previous_gesture"):
            self.ontology_connector.learn_gesture_pattern([
                gesture_data["previous_gesture"],
                gesture_data["gesture"]
            ])
            
        return json.loads(response)
    
    def validate_constraints(self, gesture_data: Dict, action_info: Dict) -> bool:
        """제약 조건 검증"""
        constraints = {
            "PINCH": lambda d: 0.1 <= d.get("value", 1) <= 3.0,
            "SPREAD": lambda d: 0 <= d.get("angle", 0) <= 180,
            "GRAB": lambda d: d.get("action") == "move",
            "POINT": lambda d: d.get("position") is not None,
            "DRAW": lambda d: d.get("trajectory") is not None
        }
        
        gesture = gesture_data.get("gesture")
        if gesture in constraints:
            return constraints[gesture](gesture_data)
        return True
    
    def determine_target_spoke(self, action_info: Dict) -> str:
        """액션에 따른 타겟 spoke 결정"""
        concept = action_info.get("concept", "")
        
        routing_map = {
            "Scale": "websocket",
            "Angle": "websocket", 
            "Translation": "websocket",
            "Selection": "nlp",
            "Creation": "ml"
        }
        
        return routing_map.get(concept, "websocket")
    
    def build_command(self, gesture_data: Dict, action_info: Dict) -> Dict:
        """After Effects 명령 생성"""
        return {
            "type": "gesture_command",
            "gesture": gesture_data["gesture"],
            "concept": action_info.get("concept"),
            "objects": action_info.get("objects", []),
            "parameters": action_info.get("parameters", []),
            "value": gesture_data.get("value"),
            "timestamp": gesture_data.get("timestamp")
        }


class IntegratedMediaPipeSystem:
    """통합 MediaPipe-Ontology-Orchestration 시스템"""
    
    def __init__(self):
        self.ontology_connector = MediaPipeOntologyConnector()
        self.orchestration_hub = MediaPipeOrchestrationHub()
        self.performance_metrics = {
            "ontology_queries": [],
            "routing_latency": [],
            "constraint_checks": []
        }
        
    async def process_gesture(self, gesture_data: Dict):
        """제스처 처리 파이프라인"""
        import time
        
        # 1. Ontology 쿼리
        start = time.time()
        action = self.ontology_connector.query_gesture_action(
            gesture_data["gesture"]
        )
        self.performance_metrics["ontology_queries"].append(
            (time.time() - start) * 1000
        )
        
        # 2. Orchestration 라우팅  
        start = time.time()
        result = await self.orchestration_hub.route_gesture_command(gesture_data)
        self.performance_metrics["routing_latency"].append(
            (time.time() - start) * 1000
        )
        
        return result
    
    def get_system_status(self) -> Dict:
        """시스템 상태 반환"""
        import numpy as np
        
        status = {
            "ontology": "connected" if self.ontology_connector.graph else "disconnected",
            "orchestration": "active",
            "performance": {
                "avg_ontology_query_ms": np.mean(self.performance_metrics["ontology_queries"][-100:]) if self.performance_metrics["ontology_queries"] else 0,
                "avg_routing_ms": np.mean(self.performance_metrics["routing_latency"][-100:]) if self.performance_metrics["routing_latency"] else 0
            }
        }
        
        # 연결성 체크
        isolated_components = self.check_isolation()
        if isolated_components:
            status["warnings"] = f"Isolated components found: {isolated_components}"
        else:
            status["connectivity"] = "✅ All components connected"
            
        return status
    
    def check_isolation(self) -> List[str]:
        """고립된 컴포넌트 체크"""
        query = """
        MATCH (n)
        WHERE NOT (n)--()
        RETURN n.name as isolated_node
        """
        results = self.ontology_connector.graph.run(query).data()
        return [r["isolated_node"] for r in results if r["isolated_node"]]


# 테스트 코드
async def test_integration():
    """통합 테스트"""
    system = IntegratedMediaPipeSystem()
    
    # 테스트 제스처 시퀀스
    test_gestures = [
        {"gesture": "PINCH", "value": 1.5, "timestamp": "2025-01-27T10:00:00"},
        {"gesture": "GRAB", "action": "move", "timestamp": "2025-01-27T10:00:01"},
        {"gesture": "SPREAD", "angle": 45, "timestamp": "2025-01-27T10:00:02"}
    ]
    
    for gesture in test_gestures:
        result = await system.process_gesture(gesture)
        print(f"Processed {gesture['gesture']}: {result}")
    
    # 시스템 상태
    print("\n System Status:")
    print(json.dumps(system.get_system_status(), indent=2))
    
    # 고립 체크
    isolated = system.check_isolation()
    if isolated:
        print(f"️ Isolated components: {isolated}")
    else:
        print("✅ No isolated components - all connected!")


if __name__ == "__main__":
    asyncio.run(test_integration())
