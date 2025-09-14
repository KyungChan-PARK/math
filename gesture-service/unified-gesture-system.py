#!/usr/bin/env python3
"""
Unified Gesture Recognition System
통합된 제스처 인식 시스템 - Claude-Qwen-Gemini 협업 최적화
Created: 2025-09-12
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

# MediaPipe imports
try:
    import mediapipe as mp
    import cv2
    import numpy as np
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    print("Warning: MediaPipe not installed")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GestureType(Enum):
    """지원되는 제스처 타입"""
    SWIPE_LEFT = "swipe_left"
    SWIPE_RIGHT = "swipe_right"
    SWIPE_UP = "swipe_up"
    SWIPE_DOWN = "swipe_down"
    PINCH = "pinch"
    SPREAD = "spread"
    CIRCLE = "circle"
    TAP = "tap"
    MATH_SYMBOL = "math_symbol"


@dataclass
class Gesture:
    """제스처 데이터 클래스"""
    type: GestureType
    confidence: float
    timestamp: float
    landmarks: Optional[List[Tuple[float, float, float]]] = None
    metadata: Optional[Dict[str, Any]] = None


class UnifiedGestureSystem:
    """통합 제스처 시스템 - 모든 제스처 기능 통합"""
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.is_initialized = False
        
        if MEDIAPIPE_AVAILABLE:
            self._init_mediapipe()
        
        # 제스처 히스토리 (성능 최적화)
        self.gesture_history: List[Gesture] = []
        self.max_history = 50
        
        logger.info("Unified Gesture System initialized")
    
    def _default_config(self) -> Dict:
        """기본 설정"""
        return {
            "detection_confidence": 0.7,
            "tracking_confidence": 0.5,
            "max_hands": 2,
            "model_complexity": 1,
            "enable_math_gestures": True,
            "enable_realtime": True,
            "fps_limit": 30
        }
    
    def _init_mediapipe(self):
        """MediaPipe 초기화"""
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=self.config["max_hands"],
            min_detection_confidence=self.config["detection_confidence"],
            min_tracking_confidence=self.config["tracking_confidence"],
            model_complexity=self.config["model_complexity"]
        )
        self.is_initialized = True
    
    def detect_gesture(self, frame: np.ndarray) -> Optional[Gesture]:
        """프레임에서 제스처 감지"""
        if not self.is_initialized:
            return None
        
        # BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                gesture = self._analyze_landmarks(hand_landmarks)
                if gesture:
                    self._add_to_history(gesture)
                    return gesture
        
        return None
    
    def _analyze_landmarks(self, landmarks) -> Optional[Gesture]:
        """랜드마크 분석하여 제스처 인식"""
        # 간단한 제스처 인식 로직
        # 실제 구현에서는 더 복잡한 알고리즘 사용
        
        points = [(lm.x, lm.y, lm.z) for lm in landmarks.landmark]
        
        # 예시: 간단한 스와이프 감지
        if self._is_swipe(points):
            return Gesture(
                type=GestureType.SWIPE_RIGHT,
                confidence=0.85,
                timestamp=asyncio.get_event_loop().time(),
                landmarks=points
            )
        
        return None
    
    def _is_swipe(self, points: List[Tuple[float, float, float]]) -> bool:
        """스와이프 제스처 감지"""
        # 간단한 구현 예시
        if len(points) < 21:  # Hand landmarks
            return False
        
        # 손가락 끝 위치 확인
        index_tip = points[8]
        middle_tip = points[12]
        
        # 수평 이동 감지
        if abs(index_tip[0] - middle_tip[0]) > 0.1:
            return True
        
        return False
    
    def _add_to_history(self, gesture: Gesture):
        """제스처 히스토리 추가"""
        self.gesture_history.append(gesture)
        if len(self.gesture_history) > self.max_history:
            self.gesture_history.pop(0)
    
    async def start_realtime_detection(self, camera_index: int = 0):
        """실시간 제스처 감지 시작"""
        if not MEDIAPIPE_AVAILABLE:
            logger.error("MediaPipe not available")
            return
        
        cap = cv2.VideoCapture(camera_index)
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    continue
                
                gesture = self.detect_gesture(frame)
                if gesture:
                    logger.info(f"Detected: {gesture.type.value}")
                
                # FPS 제한
                await asyncio.sleep(1.0 / self.config["fps_limit"])
                
        except KeyboardInterrupt:
            logger.info("Stopping realtime detection")
        finally:
            cap.release()
    
    def get_statistics(self) -> Dict:
        """제스처 통계 반환"""
        if not self.gesture_history:
            return {"total": 0, "types": {}}
        
        stats = {
            "total": len(self.gesture_history),
            "types": {},
            "avg_confidence": 0
        }
        
        for gesture in self.gesture_history:
            gesture_type = gesture.type.value
            stats["types"][gesture_type] = stats["types"].get(gesture_type, 0) + 1
            stats["avg_confidence"] += gesture.confidence
        
        stats["avg_confidence"] /= len(self.gesture_history)
        
        return stats
    
    def cleanup(self):
        """리소스 정리"""
        if self.is_initialized and hasattr(self, 'hands'):
            self.hands.close()
        self.gesture_history.clear()
        logger.info("Cleanup completed")


# 테스트 함수
def test_unified_system():
    """통합 시스템 테스트"""
    system = UnifiedGestureSystem()
    
    # 통계 확인
    stats = system.get_statistics()
    print(f"System stats: {stats}")
    
    # 정리
    system.cleanup()
    print("Test completed successfully!")


if __name__ == "__main__":
    # 테스트 실행
    test_unified_system()
    
    # 실시간 감지 실행 (선택적)
    # asyncio.run(system.start_realtime_detection())
