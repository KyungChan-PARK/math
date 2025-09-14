// 75+ AI Agents Complete Implementation for Math Education System
// 비용 최적화된 모델 할당 전략 적용

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 루트의 .env 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 모델 선택 가이드 (비용 최적화)
const MODELS = {
    HAIKU: 'claude-3-haiku-20240307',      // $0.25/$1.25 per MTok - 단순 작업
    SONNET: 'claude-3-5-sonnet-20241022',  // $3/$15 per MTok - 중간 복잡도
    OPUS: 'claude-3-opus-20240229'         // $15/$75 per MTok - 고난도 작업
};

export class MathEducationAgentSystem {
    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
        
        this.agents = this.initializeAllAgents();
        console.log(chalk.green(`✅ Initialized ${Object.keys(this.agents).length} AI Agents`));
    }
    
    initializeAllAgents() {
        return {
            // ========== 1. 수학 개념 전문가 (10개) ==========
            algebraExpert: {
                role: "대수학 전문가",
                model: MODELS.SONNET,
                category: "math_concepts",
                systemPrompt: "대수 방정식, 함수, 그래프를 설명하고 시각화 코드를 생성하는 전문가입니다."
            },
            
            geometryExpert: {
                role: "기하학 전문가",
                model: MODELS.SONNET,
                category: "math_concepts",
                systemPrompt: "도형, 각도, 좌표계를 다루며 정확한 기하학적 구조를 생성합니다."
            },
            
            calculusExpert: {
                role: "미적분 전문가",
                model: MODELS.OPUS, // 복잡한 개념이므로 OPUS 사용
                category: "math_concepts",
                systemPrompt: "미분, 적분, 극한 개념을 시각적으로 설명하고 애니메이션을 설계합니다."
            },
            
            statisticsExpert: {
                role: "통계학 전문가",
                model: MODELS.SONNET,
                category: "math_concepts",
                systemPrompt: "데이터 분석, 확률, 분포를 시각화하고 해석합니다."
            },
            
            trigonometryExpert: {
                role: "삼각법 전문가",
                model: MODELS.SONNET,
                category: "math_concepts",
                systemPrompt: "삼각함수, 단위원, 주기성을 시각적으로 표현합니다."
            },
            
            numberTheoryExpert: {
                role: "정수론 전문가",
                model: MODELS.HAIKU, // 상대적으로 단순
                category: "math_concepts",
                systemPrompt: "소수, 약수, 배수 등 정수의 성질을 설명합니다."
            },
            
            linearAlgebraExpert: {
                role: "선형대수 전문가",
                model: MODELS.OPUS, // 행렬, 벡터 공간 등 복잡
                category: "math_concepts",
                systemPrompt: "벡터, 행렬, 변환을 3D로 시각화합니다."
            },
            
            probabilityExpert: {
                role: "확률론 전문가",
                model: MODELS.SONNET,
                category: "math_concepts",
                systemPrompt: "확률 분포, 기댓값, 조건부 확률을 시각화합니다."
            },
            
            discreteMathExpert: {
                role: "이산수학 전문가",
                model: MODELS.SONNET,
                category: "math_concepts",
                systemPrompt: "그래프 이론, 조합론, 논리를 다룹니다."
            },
            
            complexAnalysisExpert: {
                role: "복소해석 전문가",
                model: MODELS.OPUS, // 고급 수학
                category: "math_concepts",
                systemPrompt: "복소수, 복소함수, 등각사상을 시각화합니다."
            },
            
            // ========== 2. 교육 방법론 전문가 (10개) ==========
            curriculumDesigner: {
                role: "교육과정 설계자",
                model: MODELS.SONNET,
                category: "pedagogy",
                systemPrompt: "학년별, 수준별 맞춤 교육과정을 설계합니다."
            },
            
            lessonPlanner: {
                role: "수업 계획 전문가",
                model: MODELS.HAIKU,
                category: "pedagogy",
                systemPrompt: "45분 수업을 위한 구조화된 계획을 생성합니다."
            },
            
            assessmentCreator: {
                role: "평가 문항 개발자",
                model: MODELS.SONNET,
                category: "pedagogy",
                systemPrompt: "수준별 평가 문항과 루브릭을 생성합니다."
            },
            
            differentiationExpert: {
                role: "수준별 학습 전문가",
                model: MODELS.SONNET,
                category: "pedagogy",
                systemPrompt: "학생 개인별 맞춤 학습 경로를 설계합니다."
            },
            
            scaffoldingDesigner: {
                role: "스캐폴딩 설계자",
                model: MODELS.HAIKU,
                category: "pedagogy",
                systemPrompt: "단계적 학습 지원 구조를 설계합니다."
            },
            
            engagementStrategist: {
                role: "참여 전략가",
                model: MODELS.HAIKU,
                category: "pedagogy",
                systemPrompt: "학생 참여를 높이는 활동과 게임을 설계합니다."
            },
            
            misconceptionAnalyzer: {
                role: "오개념 분석가",
                model: MODELS.SONNET,
                category: "pedagogy",
                systemPrompt: "일반적인 수학 오개념을 식별하고 교정합니다."
            },
            
            realWorldConnector: {
                role: "실생활 연결 전문가",
                model: MODELS.HAIKU,
                category: "pedagogy",
                systemPrompt: "수학 개념과 실생활 응용을 연결합니다."
            },
            
            collaborativeLearningExpert: {
                role: "협동학습 전문가",
                model: MODELS.HAIKU,
                category: "pedagogy",
                systemPrompt: "그룹 활동과 토론 기반 학습을 설계합니다."
            },
            
            metacognitionCoach: {
                role: "메타인지 코치",
                model: MODELS.SONNET,
                category: "pedagogy",
                systemPrompt: "학생의 사고 과정을 분석하고 개선합니다."
            },
            
            // ========== 3. 시각화 전문가 (10개) ==========
            graphVisualizer: {
                role: "그래프 시각화 전문가",
                model: MODELS.SONNET,
                category: "visualization",
                systemPrompt: "함수 그래프를 After Effects로 애니메이션화합니다."
            },
            
            shape3DModeler: {
                role: "3D 도형 모델러",
                model: MODELS.SONNET,
                category: "visualization",
                systemPrompt: "3차원 도형과 회전체를 생성합니다."
            },
            
            animationChoreographer: {
                role: "애니메이션 안무가",
                model: MODELS.SONNET,
                category: "visualization",
                systemPrompt: "수학 개념의 동적 변화를 애니메이션으로 표현합니다."
            },
            
            colorSchemeDesigner: {
                role: "색상 체계 디자이너",
                model: MODELS.HAIKU,
                category: "visualization",
                systemPrompt: "교육적 효과를 높이는 색상 팔레트를 선택합니다."
            },
            
            infographicCreator: {
                role: "인포그래픽 제작자",
                model: MODELS.HAIKU,
                category: "visualization",
                systemPrompt: "복잡한 데이터를 간단한 인포그래픽으로 변환합니다."
            },
            
            diagramArchitect: {
                role: "다이어그램 설계자",
                model: MODELS.HAIKU,
                category: "visualization",
                systemPrompt: "플로우차트, 벤다이어그램, 트리 구조를 생성합니다."
            },
            
            interactiveWidgetDesigner: {
                role: "인터랙티브 위젯 디자이너",
                model: MODELS.SONNET,
                category: "visualization",
                systemPrompt: "슬라이더, 버튼 등 상호작용 요소를 설계합니다."
            },
            
            dataVisualizationExpert: {
                role: "데이터 시각화 전문가",
                model: MODELS.SONNET,
                category: "visualization",
                systemPrompt: "차트, 히트맵, 산점도를 생성합니다."
            },
            
            fractalGenerator: {
                role: "프랙탈 생성기",
                model: MODELS.SONNET,
                category: "visualization",
                systemPrompt: "만델브로트, 줄리아 집합 등 프랙탈을 생성합니다."
            },
            
            transformationAnimator: {
                role: "변환 애니메이터",
                model: MODELS.SONNET,
                category: "visualization",
                systemPrompt: "평행이동, 회전, 대칭 변환을 애니메이션화합니다."
            },
            
            // ========== 4. 상호작용 전문가 (10개) ==========
            gestureInterpreter: {
                role: "제스처 해석기",
                model: MODELS.HAIKU,
                category: "interaction",
                systemPrompt: "MediaPipe 데이터를 수학적 의도로 변환합니다."
            },
            
            voiceCommandProcessor: {
                role: "음성 명령 처리기",
                model: MODELS.HAIKU,
                category: "interaction",
                systemPrompt: "자연어 수학 명령을 파싱합니다."
            },
            
            touchPatternAnalyzer: {
                role: "터치 패턴 분석기",
                model: MODELS.HAIKU,
                category: "interaction",
                systemPrompt: "멀티터치 제스처를 해석합니다."
            },
            
            penPressureInterpreter: {
                role: "펜 압력 해석기",
                model: MODELS.HAIKU,
                category: "interaction",
                systemPrompt: "S Pen 압력을 선 굵기와 강조로 변환합니다."
            },
            
            dragDropCoordinator: {
                role: "드래그앤드롭 조정자",
                model: MODELS.HAIKU,
                category: "interaction",
                systemPrompt: "객체 이동과 배치를 관리합니다."
            },
            
            multiUserSynchronizer: {
                role: "다중 사용자 동기화기",
                model: MODELS.SONNET,
                category: "interaction",
                systemPrompt: "여러 학생의 동시 상호작용을 조정합니다."
            },
            
            feedbackGenerator: {
                role: "피드백 생성기",
                model: MODELS.HAIKU,
                category: "interaction",
                systemPrompt: "실시간 시각적, 청각적 피드백을 생성합니다."
            },
            
            undoRedoManager: {
                role: "실행취소/재실행 관리자",
                model: MODELS.HAIKU,
                category: "interaction",
                systemPrompt: "작업 히스토리를 관리하고 복원합니다."
            },
            
            shortcutOptimizer: {
                role: "단축키 최적화기",
                model: MODELS.HAIKU,
                category: "interaction",
                systemPrompt: "자주 사용하는 작업의 단축키를 제안합니다."
            },
            
            accessibilityAdapter: {
                role: "접근성 어댑터",
                model: MODELS.SONNET,
                category: "interaction",
                systemPrompt: "시각, 청각 장애 학생을 위한 대체 상호작용을 제공합니다."
            },
            
            // ========== 5. 평가 및 피드백 (10개) ==========
            progressTracker: {
                role: "진도 추적기",
                model: MODELS.HAIKU,
                category: "assessment",
                systemPrompt: "학생의 학습 진행 상황을 추적합니다."
            },
            
            errorPatternDetector: {
                role: "오류 패턴 감지기",
                model: MODELS.SONNET,
                category: "assessment",
                systemPrompt: "반복되는 실수 패턴을 식별합니다."
            },
            
            hintGenerator: {
                role: "힌트 생성기",
                model: MODELS.HAIKU,
                category: "assessment",
                systemPrompt: "단계적 힌트를 제공합니다."
            },
            
            solutionExplainer: {
                role: "해법 설명자",
                model: MODELS.SONNET,
                category: "assessment",
                systemPrompt: "문제 해결 과정을 단계별로 설명합니다."
            },
            
            rubricApplier: {
                role: "루브릭 적용기",
                model: MODELS.HAIKU,
                category: "assessment",
                systemPrompt: "평가 기준에 따라 점수를 산정합니다."
            },
            
            feedbackPersonalizer: {
                role: "피드백 개인화기",
                model: MODELS.SONNET,
                category: "assessment",
                systemPrompt: "학생 개인에 맞춤화된 피드백을 생성합니다."
            },
            
            masteryLevelAssessor: {
                role: "숙달도 평가자",
                model: MODELS.HAIKU,
                category: "assessment",
                systemPrompt: "개념별 숙달 수준을 평가합니다."
            },
            
            improvementSuggester: {
                role: "개선 제안자",
                model: MODELS.SONNET,
                category: "assessment",
                systemPrompt: "학습 개선을 위한 구체적 제안을 합니다."
            },
            
            portfolioAnalyzer: {
                role: "포트폴리오 분석기",
                model: MODELS.SONNET,
                category: "assessment",
                systemPrompt: "학생의 전체 작업을 종합 평가합니다."
            },
            
            peerReviewFacilitator: {
                role: "동료평가 촉진자",
                model: MODELS.HAIKU,
                category: "assessment",
                systemPrompt: "학생 간 상호 평가를 안내합니다."
            },
            
            // ========== 6. 기술 지원 (10개) ==========
            extendScriptGenerator: {
                role: "ExtendScript 생성기",
                model: MODELS.SONNET,
                category: "technical",
                systemPrompt: "After Effects용 ExtendScript 코드를 생성합니다."
            },
            
            debugAssistant: {
                role: "디버그 도우미",
                model: MODELS.SONNET,
                category: "technical",
                systemPrompt: "코드 오류를 찾아 수정합니다."
            },
            
            performanceOptimizer: {
                role: "성능 최적화기",
                model: MODELS.SONNET,
                category: "technical",
                systemPrompt: "시스템 성능 병목을 분석하고 개선합니다."
            },
            
            apiIntegrator: {
                role: "API 통합 전문가",
                model: MODELS.HAIKU,
                category: "technical",
                systemPrompt: "외부 서비스와 API를 연결합니다."
            },
            
            databaseQueryOptimizer: {
                role: "DB 쿼리 최적화기",
                model: MODELS.SONNET,
                category: "technical",
                systemPrompt: "MongoDB, Neo4j 쿼리를 최적화합니다."
            },
            
            cacheManager: {
                role: "캐시 관리자",
                model: MODELS.HAIKU,
                category: "technical",
                systemPrompt: "효율적인 캐싱 전략을 구현합니다."
            },
            
            securityAuditor: {
                role: "보안 감사관",
                model: MODELS.SONNET,
                category: "technical",
                systemPrompt: "보안 취약점을 찾고 수정합니다."
            },
            
            backupCoordinator: {
                role: "백업 조정자",
                model: MODELS.HAIKU,
                category: "technical",
                systemPrompt: "자동 백업과 복구를 관리합니다."
            },
            
            versionController: {
                role: "버전 관리자",
                model: MODELS.HAIKU,
                category: "technical",
                systemPrompt: "코드와 콘텐츠 버전을 관리합니다."
            },
            
            deploymentAutomator: {
                role: "배포 자동화기",
                model: MODELS.SONNET,
                category: "technical",
                systemPrompt: "CI/CD 파이프라인을 구성합니다."
            },
            
            // ========== 7. 콘텐츠 생성 (10개) ==========
            problemGenerator: {
                role: "문제 생성기",
                model: MODELS.SONNET,
                category: "content",
                systemPrompt: "수준별 수학 문제를 생성합니다."
            },
            
            exampleCreator: {
                role: "예제 생성기",
                model: MODELS.HAIKU,
                category: "content",
                systemPrompt: "개념 설명을 위한 예제를 만듭니다."
            },
            
            worksheetDesigner: {
                role: "워크시트 디자이너",
                model: MODELS.HAIKU,
                category: "content",
                systemPrompt: "인쇄 가능한 연습 문제지를 생성합니다."
            },
            
            videoScriptWriter: {
                role: "비디오 대본 작성자",
                model: MODELS.SONNET,
                category: "content",
                systemPrompt: "교육 비디오용 대본을 작성합니다."
            },
            
            quizBuilder: {
                role: "퀴즈 제작자",
                model: MODELS.HAIKU,
                category: "content",
                systemPrompt: "상호작용 퀴즈를 생성합니다."
            },
            
            flashcardMaker: {
                role: "플래시카드 제작자",
                model: MODELS.HAIKU,
                category: "content",
                systemPrompt: "암기용 플래시카드를 생성합니다."
            },
            
            gameDesigner: {
                role: "교육 게임 디자이너",
                model: MODELS.SONNET,
                category: "content",
                systemPrompt: "수학 학습 게임을 설계합니다."
            },
            
            storyProblemWriter: {
                role: "서술형 문제 작성자",
                model: MODELS.SONNET,
                category: "content",
                systemPrompt: "실생활 맥락의 서술형 문제를 만듭니다."
            },
            
            referenceGuideCompiler: {
                role: "참고 자료 편집자",
                model: MODELS.HAIKU,
                category: "content",
                systemPrompt: "공식, 정리 등 참고 자료를 정리합니다."
            },
            
            glossaryBuilder: {
                role: "용어집 제작자",
                model: MODELS.HAIKU,
                category: "content",
                systemPrompt: "수학 용어 사전을 구축합니다."
            },
            
            // ========== 8. 데이터 분석 (5개) ==========
            learningAnalyticsExpert: {
                role: "학습 분석 전문가",
                model: MODELS.SONNET,
                category: "analytics",
                systemPrompt: "학습 데이터를 분석하여 인사이트를 도출합니다."
            },
            
            usagePatternAnalyzer: {
                role: "사용 패턴 분석기",
                model: MODELS.HAIKU,
                category: "analytics",
                systemPrompt: "시스템 사용 패턴을 추적합니다."
            },
            
            predictiveModeler: {
                role: "예측 모델러",
                model: MODELS.SONNET,
                category: "analytics",
                systemPrompt: "학습 성과를 예측하는 모델을 구축합니다."
            },
            
            reportGenerator: {
                role: "보고서 생성기",
                model: MODELS.HAIKU,
                category: "analytics",
                systemPrompt: "분석 결과를 보고서로 작성합니다."
            },
            
            dashboardDesigner: {
                role: "대시보드 디자이너",
                model: MODELS.HAIKU,
                category: "analytics",
                systemPrompt: "실시간 모니터링 대시보드를 설계합니다."
            }
        };
    }
    
    // 에이전트 호출 메서드
    async callAgent(agentName, task, options = {}) {
        const agent = this.agents[agentName];
        if (!agent) {
            throw new Error(`Agent ${agentName} not found`);
        }
        
        try {
            const response = await this.anthropic.messages.create({
                model: agent.model,
                max_tokens: options.maxTokens || 1000,
                system: agent.systemPrompt,
                messages: [{
                    role: 'user',
                    content: task
                }]
            });
            
            return {
                agent: agentName,
                role: agent.role,
                category: agent.category,
                model: agent.model,
                response: response.content[0].text,
                usage: response.usage
            };
        } catch (error) {
            console.error(chalk.red(`Error calling ${agentName}:`, error.message));
            throw error;
        }
    }
    
    // 카테고리별 에이전트 목록
    getAgentsByCategory(category) {
        return Object.entries(this.agents)
            .filter(([_, agent]) => agent.category === category)
            .map(([name, agent]) => ({
                name,
                ...agent
            }));
    }
    
    // 복잡도에 따른 최적 에이전트 선택
    selectOptimalAgent(task, complexity = 'medium') {
        const complexityToModel = {
            low: MODELS.HAIKU,
            medium: MODELS.SONNET,
            high: MODELS.OPUS
        };
        
        const targetModel = complexityToModel[complexity];
        
        // 해당 모델을 사용하는 에이전트 중 적합한 것 선택
        const candidates = Object.entries(this.agents)
            .filter(([_, agent]) => agent.model === targetModel)
            .map(([name, _]) => name);
        
        // 작업 키워드 기반 매칭
        if (task.includes('그래프')) return 'graphVisualizer';
        if (task.includes('삼각형')) return 'geometryExpert';
        if (task.includes('미분') || task.includes('적분')) return 'calculusExpert';
        if (task.includes('제스처')) return 'gestureInterpreter';
        if (task.includes('평가')) return 'assessmentCreator';
        
        // 기본값
        return candidates[0] || 'algebraExpert';
    }
    
    // 병렬 실행
    async parallelExecution(tasks) {
        const promises = tasks.map(task => 
            this.callAgent(task.agent, task.prompt || task.task, task.options)
        );
        return Promise.all(promises);
    }
    
    // 워크플로우 실행
    async executeWorkflow(workflow) {
        const results = [];
        let previousResult = null;
        
        for (const step of workflow) {
            const prompt = previousResult 
                ? `${step.prompt}\n\nPrevious result: ${previousResult}`
                : step.prompt;
                
            const result = await this.callAgent(step.agent, prompt, step.options);
            results.push(result);
            previousResult = result.response;
        }
        
        return results;
    }
    
    // 통계 정보
    getStatistics() {
        const stats = {
            totalAgents: Object.keys(this.agents).length,
            byCategory: {},
            byModel: {}
        };
        
        Object.values(this.agents).forEach(agent => {
            // 카테고리별
            if (!stats.byCategory[agent.category]) {
                stats.byCategory[agent.category] = 0;
            }
            stats.byCategory[agent.category]++;
            
            // 모델별
            if (!stats.byModel[agent.model]) {
                stats.byModel[agent.model] = 0;
            }
            stats.byModel[agent.model]++;
        });
        
        return stats;
    }
}

// Export for use
export default MathEducationAgentSystem;