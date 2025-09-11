"""
MediaPipe Math Gestures - 수학 교육용 제스처 인식 시스템
Created: 2025-01-27
Author: AE Claude Max v3.4.0
"""

import mediapipe as mp
import cv2
import numpy as np
import asyncio
import websockets
import json
from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional
from enum import Enum
import time

# 수학 제스처 타입 정의
class MathGestureType(Enum):
    PINCH = "pinch"        # 크기 조절
    SPREAD = "spread"      # 각도 조절
    GRAB = "grab"          # 도형 이동
    POINT = "point"        # 꼭짓점 선택
    DRAW = "draw"          # 도형 그리기
    ROTATE = "rotate"      # 회전
    ERASE = "erase"        # 지우기
    NONE = "none"          # 제스처 없음

@dataclass
class MathGesture:
    """수학 교육용 제스처 정의 및 감지"""
    
    # 임계값 설정
    PINCH_MIN_DISTANCE = 0.02  # 최소 거리 (정규화)
    PINCH_MAX_DISTANCE = 0.15  # 최대 거리 (정규화)
    GRAB_THRESHOLD = 0.08       # 주먹 감지 임계값
    POINT_CONFIDENCE = 0.8      # 포인팅 신뢰도
    
    def __init__(self):
        self.gesture_history = []
        self.last_gesture_time = 0
        
    def detect_pinch(self, landmarks) -> Tuple[bool, float]:
        """엄지와 검지 사이 거리로 크기 조절 비율 계산"""
        thumb_tip = np.array([landmarks[4].x, landmarks[4].y, landmarks[4].z])
        index_tip = np.array([landmarks[8].x, landmarks[8].y, landmarks[8].z])
        
        distance = np.linalg.norm(thumb_tip - index_tip)
        
        if distance < self.PINCH_MAX_DISTANCE:
            # 거리를 0-1 스케일로 정규화
            scale = (distance - self.PINCH_MIN_DISTANCE) / (self.PINCH_MAX_DISTANCE - self.PINCH_MIN_DISTANCE)
            scale = np.clip(scale, 0.1, 2.0)  # 0.1x ~ 2x 크기 조절
            return True, scale
        return False, 1.0
    
    def detect_spread(self, landmarks) -> Tuple[bool, float]:
        """손가락 벌림으로 각도 계산 (0-180도)"""
        # 손가락 끝 좌표 추출
        finger_tips = [
            np.array([landmarks[i].x, landmarks[i].y]) 
            for i in [4, 8, 12, 16, 20]
        ]
        
        # 손바닥 중심
        palm_center = np.array([landmarks[0].x, landmarks[0].y])
        
        # 각 손가락과 손바닥 중심 사이 각도 계산
        angles = []
        for i in range(len(finger_tips) - 1):
            v1 = finger_tips[i] - palm_center
            v2 = finger_tips[i+1] - palm_center
            angle = np.arccos(np.clip(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)), -1, 1))
            angles.append(np.degrees(angle))
        
        avg_angle = np.mean(angles)
        if avg_angle > 20:  # 20도 이상 벌어지면 감지
            return True, avg_angle
        return False, 0
    
    def detect_grab(self, landmarks) -> bool:
        """주먹 쥐기 감지"""
        palm_center = np.array([landmarks[0].x, landmarks[0].y, landmarks[0].z])
        
        # 손가락 끝과 손바닥 중심 사이 평균 거리
        finger_tips_indices = [4, 8, 12, 16, 20]
        distances = []
        for i in finger_tips_indices:
            tip = np.array([landmarks[i].x, landmarks[i].y, landmarks[i].z])
            distances.append(np.linalg.norm(tip - palm_center))
        
        avg_distance = np.mean(distances)
        return avg_distance < self.GRAB_THRESHOLD
    
    def detect_point(self, landmarks) -> Tuple[bool, np.ndarray]:
        """검지 포인팅 감지 및 위치 반환"""
        index_tip = np.array([landmarks[8].x, landmarks[8].y])
        index_mcp = np.array([landmarks[5].x, landmarks[5].y])
        
        # 검지가 펴져있는지 확인
        index_extended = landmarks[8].y < landmarks[6].y
        
        # 다른 손가락들이 접혀있는지 확인
        other_fingers_folded = all([
            landmarks[12].y > landmarks[10].y,  # 중지
            landmarks[16].y > landmarks[14].y,  # 약지
            landmarks[20].y > landmarks[18].y   # 새끼
        ])
        
        if index_extended and other_fingers_folded:
            return True, index_tip
        return False, None
    
    def detect_draw(self, landmarks, prev_landmarks=None) -> Tuple[bool, Optional[List]]:
        """검지로 그리기 감지 및 궤적 반환"""
        index_tip = np.array([landmarks[8].x, landmarks[8].y])
        
        # 검지가 펴져있고 움직이고 있는지 확인
        index_extended = landmarks[8].y < landmarks[6].y
        
        if index_extended and prev_landmarks is not None:
            prev_tip = np.array([prev_landmarks[8].x, prev_landmarks[8].y])
            movement = np.linalg.norm(index_tip - prev_tip)
            
            if movement > 0.01:  # 최소 움직임 감지
                return True, [prev_tip.tolist(), index_tip.tolist()]
        
        return False, None

class MediaPipeMathController:
    """MediaPipe를 사용한 수학 제스처 컨트롤러"""
    
    def __init__(self, websocket_url="ws://localhost:8085"):
        # MediaPipe 초기화
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
        
        # 제스처 감지기
        self.gesture_detector = MathGesture()
        
        # WebSocket 설정
        self.websocket_url = websocket_url
        self.ws_connection = None
        
        # 이전 프레임 랜드마크 저장
        self.prev_landmarks = None
        
        # 성능 메트릭
        self.metrics = {
            "gesture_latency": [],
            "recognition_accuracy": [],
            "fps": 0
        }
        
    async def connect_websocket(self):
        """WebSocket 연결 설정"""
        try:
            self.ws_connection = await websockets.connect(self.websocket_url)
            print(f"✅ WebSocket connected to {self.websocket_url}")
        except Exception as e:
            print(f"❌ WebSocket connection failed: {e}")
            
    async def send_command(self, command: Dict):
        """After Effects로 명령 전송"""
        if self.ws_connection:
            try:
                await self.ws_connection.send(json.dumps(command))
            except Exception as e:
                print(f"❌ Failed to send command: {e}")
    
    def process_frame(self, frame) -> List[Dict]:
        """프레임 처리 및 제스처 인식"""
        start_time = time.time()
        
        # BGR을 RGB로 변환
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        commands = []
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # 랜드마크 그리기 (선택적)
                self.mp_drawing.draw_landmarks(
                    frame, hand_landmarks, self.mp_hands.HAND_CONNECTIONS)
                
                # 제스처 인식
                gesture_commands = self.extract_math_commands(hand_landmarks.landmark)
                commands.extend(gesture_commands)
                
                # 이전 랜드마크 저장
                self.prev_landmarks = hand_landmarks.landmark
        
        # 성능 메트릭 업데이트
        latency = (time.time() - start_time) * 1000  # ms
        self.metrics["gesture_latency"].append(latency)
        
        return commands
    
    def extract_math_commands(self, landmarks) -> List[Dict]:
        """랜드마크에서 수학 명령 추출"""
        commands = []
        
        # PINCH - 크기 조절
        is_pinch, scale = self.gesture_detector.detect_pinch(landmarks)
        if is_pinch:
            commands.append({
                "action": "scale",
                "value": scale,
                "gesture": MathGestureType.PINCH.value
            })
        
        # GRAB - 도형 이동
        if self.gesture_detector.detect_grab(landmarks):
            commands.append({
                "action": "move",
                "gesture": MathGestureType.GRAB.value
            })
        
        # POINT - 꼭짓점 선택
        is_point, position = self.gesture_detector.detect_point(landmarks)
        if is_point:
            commands.append({
                "action": "select",
                "position": position.tolist() if position is not None else None,
                "gesture": MathGestureType.POINT.value
            })
        
        # SPREAD - 각도 조절
        is_spread, angle = self.gesture_detector.detect_spread(landmarks)
        if is_spread:
            commands.append({
                "action": "rotate",
                "angle": angle,
                "gesture": MathGestureType.SPREAD.value
            })
        
        # DRAW - 그리기
        if self.prev_landmarks:
            is_draw, trajectory = self.gesture_detector.detect_draw(landmarks, self.prev_landmarks)
            if is_draw:
                commands.append({
                    "action": "draw",
                    "trajectory": trajectory,
                    "gesture": MathGestureType.DRAW.value
                })
        
        return commands
    
    def get_performance_metrics(self) -> Dict:
        """성능 메트릭 반환"""
        if self.metrics["gesture_latency"]:
            avg_latency = np.mean(self.metrics["gesture_latency"][-100:])  # 최근 100개 평균
        else:
            avg_latency = 0
            
        return {
            "average_latency_ms": avg_latency,
            "target_latency_ms": 50,
            "status": "✅ Good" if avg_latency < 50 else "️ Needs Optimization"
        }
    
    async def run(self):
        """메인 실행 루프"""
        # WebSocket 연결
        await self.connect_websocket()
        
        # 카메라 초기화
        cap = cv2.VideoCapture(0)
        
        print(" Math Gesture Recognition Started")
        print("Press 'q' to quit")
        
        frame_count = 0
        start_time = time.time()
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    continue
                
                # 프레임 처리
                commands = self.process_frame(frame)
                
                # 명령 전송
                for cmd in commands:
                    await self.send_command(cmd)
                    print(f" Sent: {cmd}")
                
                # FPS 계산
                frame_count += 1
                if frame_count % 30 == 0:
                    elapsed = time.time() - start_time
                    self.metrics["fps"] = frame_count / elapsed
                    print(f" FPS: {self.metrics['fps']:.2f}")
                
                # 성능 메트릭 표시
                if frame_count % 100 == 0:
                    metrics = self.get_performance_metrics()
                    print(f" Performance: {metrics}")
                
                # 화면 표시
                cv2.imshow('Math Gesture Recognition', frame)
                
                # 종료 조건
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                    
        finally:
            cap.release()
            cv2.destroyAllWindows()
            if self.ws_connection:
                await self.ws_connection.close()
            print(" Gesture recognition stopped")

# 테스트 실행
if __name__ == "__main__":
    controller = MediaPipeMathController()
    asyncio.run(controller.run())
