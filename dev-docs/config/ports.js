// config/ports.js - 표준 포트 설정
export default {
    // WebSocket 서버
    NATURAL_LANGUAGE_PORT: 8080,  // 메인 자연어 처리
    GESTURE_SERVICE_PORT: 8081,   // 제스처 인식 전용
    
    // CEP 통신
    CEP_BRIDGE_PORT: 9000,        // After Effects 브리지
    
    // 개발 서버
    DEV_SERVER_PORT: 3000,        // 개발 웹서버
    HOT_RELOAD_PORT: 3001,        // Hot reload
    
    // 대체 포트 (충돌시)
    FALLBACK_PORTS: {
        NATURAL_LANGUAGE: [8080, 8085, 8090],
        GESTURE_SERVICE: [8081, 8082, 8086],
        CEP_BRIDGE: [9000, 9001, 9002]
    },
    
    // 프로토콜 설정
    PROTOCOLS: {
        NATURAL_LANGUAGE: 'µWebSockets',
        GESTURE_SERVICE: 'µWebSockets',
        CEP_BRIDGE: 'TCP'
    }
};
