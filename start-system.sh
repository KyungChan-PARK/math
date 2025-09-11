#!/bin/bash
# start-system.sh - 전체 시스템 시작 스크립트

echo " 지능형 수학 교육 시스템 시작..."

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# MongoDB 확인
echo -e "${YELLOW}MongoDB 상태 확인...${NC}"
if pgrep -x "mongod" > /dev/null
then
    echo -e "${GREEN}✓ MongoDB가 실행 중입니다${NC}"
else
    echo -e "${RED}✗ MongoDB가 실행되고 있지 않습니다${NC}"
    echo "MongoDB를 시작하려면: mongod --dbpath /path/to/data"
    exit 1
fi

# Neo4j 확인 (선택사항)
echo -e "${YELLOW}Neo4j 상태 확인...${NC}"
if curl -s http://localhost:7474 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Neo4j가 실행 중입니다${NC}"
else
    echo -e "${YELLOW} Neo4j가 실행되고 있지 않습니다 (선택사항)${NC}"
fi

# 백엔드 시작
echo -e "${YELLOW}백엔드 서버 시작...${NC}"
cd backend
npm install > /dev/null 2>&1
npm start &
BACKEND_PID=$!
echo -e "${GREEN}✓ 백엔드 서버 시작됨 (PID: $BACKEND_PID)${NC}"

# 백엔드가 준비될 때까지 대기
echo "백엔드 초기화 대기 중..."
sleep 5

# 프론트엔드 시작
echo -e "${YELLOW}프론트엔드 시작...${NC}"
cd ../frontend
npm install > /dev/null 2>&1
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}✓ 프론트엔드 시작됨 (PID: $FRONTEND_PID)${NC}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}시스템이 성공적으로 시작되었습니다!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo " 프론트엔드: http://localhost:3000"
echo "️  백엔드 API: http://localhost:8086"
echo " WebSocket: ws://localhost:8086/ws"
echo ""
echo "종료하려면 Ctrl+C를 누르세요"

# 종료 시그널 처리
trap "echo '시스템 종료 중...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# 프로세스 유지
wait
