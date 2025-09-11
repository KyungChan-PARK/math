// DocumentImprovementService.js - Claude API 기반 문서 자가개선 서비스
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

class DocumentImprovementService {
  constructor() {
    this.anthropic = null;
    this.isInitialized = false;
    this.improvementQueue = [];
    this.claudeInstances = new Map();
    this.improvementHistory = [];
    this.orchestrationMode = 'sequential'; // 'sequential' or 'parallel'
    this.maxConcurrentInstances = 4;
  }

  async initialize() {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      
      if (apiKey) {
        this.anthropic = new Anthropic({ apiKey });
        this.isInitialized = true;
        logger.info('Document Improvement Service initialized with Claude API');
      } else {
        logger.warn('No Anthropic API key - running in simulation mode');
        this.isInitialized = true;
      }
      
      // 자동 개선 프로세스 시작
      this.startAutoImprovement();
    } catch (error) {
      logger.error('Failed to initialize Document Improvement Service:', error);
      throw error;
    }
  }

  // Claude 인스턴스 생성 및 관리
  async createClaudeInstance(role, task) {
    const instanceId = crypto.randomUUID();
    const instance = {
      id: instanceId,
      role,
      task,
      status: 'idle',
      createdAt: Date.now(),
      responses: []
    };
    
    this.claudeInstances.set(instanceId, instance);
    return instance;
  }

  // Claude API 호출 (역할별)
  async callClaude(prompt, role = 'analyzer', context = null) {
    if (!this.anthropic) {
      // 시뮬레이션 모드
      return this.simulateClaudeResponse(prompt, role);
    }

    try {
      const systemPrompt = this.getSystemPromptForRole(role);
      const messages = [
        {
          role: 'user',
          content: context ? `Context: ${JSON.stringify(context)}\n\n${prompt}` : prompt
        }
      ];

      const response = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        system: systemPrompt,
        messages
      });

      return response.content[0].text;
    } catch (error) {
      logger.error(`Claude API error (${role}):`, error);
      return null;
    }
  }

  // 역할별 시스템 프롬프트
  getSystemPromptForRole(role) {
    const prompts = {
      analyzer: `You are a documentation analyzer. Focus on structure, clarity, completeness, and technical accuracy. Provide specific, actionable feedback.`,
      improver: `You are a content improver. Suggest better wording, clearer explanations, and enhanced examples. Focus on readability and user understanding.`,
      validator: `You are a quality validator. Check for accuracy, consistency, best practices, and potential issues. Ensure all claims are correct.`,
      optimizer: `You are a performance optimizer. Review code examples for efficiency, suggest optimizations, and identify potential bottlenecks.`,
      integrator: `You are a system integrator. Ensure documentation aligns with actual implementation, check cross-references, and validate API contracts.`
    };
    
    return prompts[role] || prompts.analyzer;
  }

  // 문서 분석 오케스트레이션
  async analyzeDocument(documentPath, content = null) {
    try {
      // 문서 내용 읽기
      if (!content) {
        content = await fs.readFile(documentPath, 'utf-8');
      }
      
      const fileName = path.basename(documentPath);
      const fileType = path.extname(documentPath);
      
      logger.info(`Starting analysis for: ${fileName}`);
      
      // Claude 인스턴스 정의
      const instances = [
        { role: 'analyzer', task: 'Analyze structure and completeness' },
        { role: 'improver', task: 'Suggest content improvements' },
        { role: 'validator', task: 'Validate technical accuracy' },
        { role: 'optimizer', task: 'Optimize code examples' },
        { role: 'integrator', task: 'Check system integration' }
      ];
      
      let results;
      
      if (this.orchestrationMode === 'parallel') {
        results = await this.parallelOrchestration(instances, fileName, content);
      } else {
        results = await this.sequentialOrchestration(instances, fileName, content);
      }
      
      // 결과 통합
      const improvements = this.consolidateResults(results);
      
      // 이력 저장
      this.improvementHistory.push({
        documentPath,
        fileName,
        timestamp: Date.now(),
        improvements,
        mode: this.orchestrationMode
      });
      
      return improvements;
    } catch (error) {
      logger.error('Document analysis error:', error);
      throw error;
    }
  }

  // 병렬 오케스트레이션
  async parallelOrchestration(instances, fileName, content) {
    const promises = instances.map(async ({ role, task }) => {
      const instance = await this.createClaudeInstance(role, task);
      instance.status = 'processing';
      
      const prompt = `
        Document: ${fileName}
        Task: ${task}
        
        Content:
        \`\`\`
        ${content.slice(0, 3000)} ${content.length > 3000 ? '...[truncated]' : ''}
        \`\`\`
        
        Provide specific improvements in JSON format:
        {
          "improvements": [
            {
              "type": "suggestion|issue|optimization",
              "priority": "high|medium|low",
              "location": "line number or section",
              "current": "current text or code",
              "suggested": "improved version",
              "reasoning": "why this change is beneficial"
            }
          ],
          "summary": "overall assessment"
        }
      `;
      
      const response = await this.callClaude(prompt, role);
      instance.status = 'completed';
      instance.responses.push(response);
      
      return { role, response };
    });
    
    const results = await Promise.all(promises);
    return results;
  }

  // 순차 오케스트레이션 (이전 결과를 다음에 전달)
  async sequentialOrchestration(instances, fileName, content) {
    const results = [];
    let previousAnalysis = null;
    
    for (const { role, task } of instances) {
      const instance = await this.createClaudeInstance(role, task);
      instance.status = 'processing';
      
      const prompt = `
        Document: ${fileName}
        Task: ${task}
        ${previousAnalysis ? `\nPrevious Analysis:\n${previousAnalysis}\n` : ''}
        
        Content:
        \`\`\`
        ${content.slice(0, 3000)} ${content.length > 3000 ? '...[truncated]' : ''}
        \`\`\`
        
        ${previousAnalysis ? 'Building on the previous analysis, provide' : 'Provide'} specific improvements in JSON format:
        {
          "improvements": [
            {
              "type": "suggestion|issue|optimization",
              "priority": "high|medium|low",
              "location": "line number or section",
              "current": "current text or code",
              "suggested": "improved version",
              "reasoning": "why this change is beneficial"
            }
          ],
          "summary": "overall assessment",
          "builds_on": ${previousAnalysis ? '"previous analysis"' : 'null'}
        }
      `;
      
      const response = await this.callClaude(prompt, role);
      instance.status = 'completed';
      instance.responses.push(response);
      
      results.push({ role, response });
      
      // 다음 분석을 위해 현재 결과 저장
      previousAnalysis = this.extractKeyInsights(response);
    }
    
    return results;
  }

  // 주요 인사이트 추출
  extractKeyInsights(response) {
    if (!response) return null;
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const highPriorityItems = parsed.improvements
          ?.filter(imp => imp.priority === 'high')
          .slice(0, 3)
          .map(imp => `- ${imp.type}: ${imp.reasoning}`)
          .join('\n');
        
        return `Summary: ${parsed.summary}\nHigh Priority Items:\n${highPriorityItems}`;
      }
    } catch (error) {
      // JSON 파싱 실패 시 텍스트 일부 반환
      return response.slice(0, 500);
    }
    
    return response.slice(0, 500);
  }

  // 결과 통합
  consolidateResults(results) {
    const consolidated = {
      improvements: [],
      summaries: {},
      priority_counts: { high: 0, medium: 0, low: 0 },
      type_counts: { suggestion: 0, issue: 0, optimization: 0 }
    };
    
    for (const { role, response } of results) {
      if (!response) continue;
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // 개선사항 추가
          if (parsed.improvements) {
            parsed.improvements.forEach(imp => {
              consolidated.improvements.push({
                ...imp,
                source: role
              });
              
              // 통계 업데이트
              if (imp.priority) consolidated.priority_counts[imp.priority]++;
              if (imp.type) consolidated.type_counts[imp.type]++;
            });
          }
          
          // 요약 저장
          if (parsed.summary) {
            consolidated.summaries[role] = parsed.summary;
          }
        }
      } catch (error) {
        logger.warn(`Failed to parse response from ${role}:`, error);
        // 파싱 실패 시 원본 텍스트 저장
        consolidated.summaries[role] = response.slice(0, 200);
      }
    }
    
    // 중복 제거 및 우선순위 정렬
    consolidated.improvements = this.deduplicateAndSort(consolidated.improvements);
    
    return consolidated;
  }

  // 중복 제거 및 정렬
  deduplicateAndSort(improvements) {
    const seen = new Set();
    const unique = [];
    
    for (const imp of improvements) {
      const key = `${imp.type}-${imp.location}-${imp.suggested}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(imp);
      }
    }
    
    // 우선순위별 정렬
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return unique.sort((a, b) => {
      const aPriority = priorityOrder[a.priority] ?? 3;
      const bPriority = priorityOrder[b.priority] ?? 3;
      return aPriority - bPriority;
    });
  }

  // 자동 개선 프로세스
  async startAutoImprovement() {
    // 주기적으로 문서 검사 및 개선
    setInterval(async () => {
      await this.scanAndImproveDocuments();
    }, 300000); // 5분마다
    
    // 초기 스캔
    await this.scanAndImproveDocuments();
  }

  // 문서 스캔 및 개선
  async scanAndImproveDocuments() {
    try {
      const projectRoot = path.resolve(process.cwd(), '..');
      const documentsToScan = [
        'README.md',
        'IMPLEMENTATION_PLAN_AI_MATH_EDUCATION.md',
        'EXECUTION_GUIDE.md'
      ];
      
      for (const docName of documentsToScan) {
        const docPath = path.join(projectRoot, docName);
        
        try {
          await fs.access(docPath);
          const improvements = await this.analyzeDocument(docPath);
          
          if (improvements.improvements.length > 0) {
            logger.info(`Found ${improvements.improvements.length} improvements for ${docName}`);
            
            // 고우선순위 개선사항이 있으면 알림
            const highPriorityCount = improvements.priority_counts.high;
            if (highPriorityCount > 0) {
              logger.warn(`${highPriorityCount} high-priority improvements needed for ${docName}`);
            }
          }
        } catch (error) {
          logger.debug(`Document not found or error: ${docName}`);
        }
      }
    } catch (error) {
      logger.error('Document scan error:', error);
    }
  }

  // 개선사항 적용
  async applyImprovements(documentPath, improvements) {
    try {
      const content = await fs.readFile(documentPath, 'utf-8');
      let improvedContent = content;
      
      // 개선사항 적용 (안전하게)
      for (const imp of improvements) {
        if (imp.current && imp.suggested && imp.priority === 'high') {
          improvedContent = improvedContent.replace(imp.current, imp.suggested);
        }
      }
      
      // 백업 생성
      const backupPath = `${documentPath}.backup.${Date.now()}`;
      await fs.writeFile(backupPath, content);
      
      // 개선된 내용 저장
      await fs.writeFile(documentPath, improvedContent);
      
      logger.info(`Applied improvements to ${documentPath} (backup: ${backupPath})`);
      return true;
    } catch (error) {
      logger.error('Failed to apply improvements:', error);
      return false;
    }
  }

  // 시뮬레이션 모드 응답
  simulateClaudeResponse(prompt, role) {
    const simulatedResponses = {
      analyzer: JSON.stringify({
        improvements: [
          {
            type: 'suggestion',
            priority: 'high',
            location: 'line 10-15',
            current: 'Basic documentation',
            suggested: 'Enhanced documentation with examples',
            reasoning: 'Improves clarity and usability'
          }
        ],
        summary: 'Document structure is good but needs more examples'
      }),
      improver: JSON.stringify({
        improvements: [
          {
            type: 'suggestion',
            priority: 'medium',
            location: 'Introduction',
            current: 'Technical description',
            suggested: 'User-friendly explanation with context',
            reasoning: 'Better accessibility for new users'
          }
        ],
        summary: 'Content is accurate but could be more engaging'
      }),
      validator: JSON.stringify({
        improvements: [
          {
            type: 'issue',
            priority: 'high',
            location: 'API section',
            current: 'Outdated API endpoint',
            suggested: 'Updated API endpoint with versioning',
            reasoning: 'Ensures compatibility with latest version'
          }
        ],
        summary: 'Technical accuracy needs attention in API documentation'
      })
    };
    
    return simulatedResponses[role] || simulatedResponses.analyzer;
  }

  // API 엔드포인트용 메서드
  async getImprovementStatus() {
    return {
      isInitialized: this.isInitialized,
      mode: this.orchestrationMode,
      activeInstances: this.claudeInstances.size,
      queueLength: this.improvementQueue.length,
      historyLength: this.improvementHistory.length,
      lastRun: this.improvementHistory[this.improvementHistory.length - 1]?.timestamp || null
    };
  }

  async getImprovementHistory(limit = 10) {
    return this.improvementHistory.slice(-limit);
  }

  setOrchestrationMode(mode) {
    if (['sequential', 'parallel'].includes(mode)) {
      this.orchestrationMode = mode;
      logger.info(`Orchestration mode set to: ${mode}`);
      return true;
    }
    return false;
  }
}

export default DocumentImprovementService;
