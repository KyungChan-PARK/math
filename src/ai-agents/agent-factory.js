/**
 * AI Agent Factory System
 * 75+ Specialized AI Agents for Math Learning Platform
 * Claude Opus 4.1 Meta-Agent Orchestration
 */

export class AgentFactory {
  constructor() {
    this.agents = this.initializeAllAgents();
    this.activeAgents = new Map();
    this.performanceMetrics = new Map();
  }

  initializeAllAgents() {
    return {
      // === Development === DEVELOPMENT SPECIALISTS (15 agents) ===
      '@react-expert': {
        name: 'React Frontend Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'React, Redux, Next.js, Component Architecture',
        skills: ['Hooks', 'State Management', 'Performance', 'SSR/SSG'],
        performance: 0.95
      },
      '@vue-specialist': {
        name: 'Vue.js Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Vue 3, Vuex, Nuxt.js, Composition API',
        skills: ['Reactivity', 'Components', 'Routing', 'Pinia'],
        performance: 0.93
      },
      '@angular-architect': {
        name: 'Angular Enterprise Architect',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Angular 17+, RxJS, NgRx, Enterprise Patterns',
        skills: ['Dependency Injection', 'Observables', 'Modules', 'Testing'],
        performance: 0.92
      },
      '@svelte-developer': {
        name: 'Svelte/SvelteKit Developer',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Svelte, SvelteKit, Stores, Compiler Magic',
        skills: ['Reactivity', 'Transitions', 'Actions', 'SSR'],
        performance: 0.91
      },
      '@solid-js-expert': {
        name: 'SolidJS Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'SolidJS, Fine-grained Reactivity, Signals',
        skills: ['Signals', 'Effects', 'Memos', 'JSX'],
        performance: 0.90
      },
      
      // Backend Specialists
      '@backend-architect': {
        name: 'Backend System Architect',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'System Design, Microservices, API Architecture',
        skills: ['RESTful', 'GraphQL', 'gRPC', 'Event-Driven'],
        performance: 0.96
      },
      '@node-expert': {
        name: 'Node.js Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Node.js, Express, Fastify, NestJS',
        skills: ['Async/Await', 'Streams', 'Clustering', 'PM2'],
        performance: 0.94
      },
      '@python-specialist': {
        name: 'Python Backend Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Django, FastAPI, Flask, Async Python',
        skills: ['ORM', 'Celery', 'Testing', 'Type Hints'],
        performance: 0.93
      },
      '@golang-developer': {
        name: 'Go Developer',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Go, Gin, Echo, Microservices',
        skills: ['Goroutines', 'Channels', 'Context', 'Testing'],
        performance: 0.92
      },
      '@rust-specialist': {
        name: 'Rust Systems Programmer',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Rust, Actix, Rocket, Tokio',
        skills: ['Ownership', 'Lifetimes', 'Async', 'WASM'],
        performance: 0.91
      },
      
      // === Database === DATABASE SPECIALISTS (10 agents) ===
      '@database-architect': {
        name: 'Database Architect',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Database Design, Optimization, Sharding',
        skills: ['Schema Design', 'Indexing', 'Partitioning', 'Replication'],
        performance: 0.95
      },
      '@postgres-expert': {
        name: 'PostgreSQL Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'PostgreSQL, Performance Tuning, Extensions',
        skills: ['JSONB', 'Full-text Search', 'Partitioning', 'WAL'],
        performance: 0.94
      },
      '@mongodb-specialist': {
        name: 'MongoDB Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'MongoDB, Aggregation, Sharding, Atlas',
        skills: ['Aggregation Pipeline', 'Indexing', 'Replication', 'GridFS'],
        performance: 0.93
      },
      '@neo4j-expert': {
        name: 'Neo4j Graph Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Neo4j, Cypher, Graph Algorithms, APOC',
        skills: ['Graph Modeling', 'Cypher Queries', 'Performance', 'Clustering'],
        performance: 0.94
      },
      '@redis-specialist': {
        name: 'Redis Cache Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Redis, Caching Strategies, Pub/Sub, Lua Scripts',
        skills: ['Data Structures', 'Persistence', 'Clustering', 'Sentinel'],
        performance: 0.92
      },      '@elasticsearch-expert': {
        name: 'Elasticsearch Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Elasticsearch, Kibana, Logstash, Beats',
        skills: ['Full-text Search', 'Aggregations', 'Mapping', 'Performance'],
        performance: 0.91
      },
      '@cassandra-specialist': {
        name: 'Cassandra Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Cassandra, CQL, Distributed Systems',
        skills: ['Data Modeling', 'Partitioning', 'Consistency', 'Repair'],
        performance: 0.90
      },
      '@mysql-expert': {
        name: 'MySQL Expert',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'MySQL, InnoDB, Replication, Performance',
        skills: ['Query Optimization', 'Indexing', 'Clustering', 'Backup'],
        performance: 0.89
      },
      '@oracle-specialist': {
        name: 'Oracle Database Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Oracle DB, PL/SQL, RAC, Data Guard',
        skills: ['Performance Tuning', 'Backup/Recovery', 'Security', 'Migration'],
        performance: 0.88
      },
      '@chromadb-expert': {
        name: 'ChromaDB Vector Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'ChromaDB, Vector Databases, Embeddings',
        skills: ['Vector Search', 'Similarity', 'Indexing', 'Collections'],
        performance: 0.91
      },
      
      // === DevOps === DEVOPS & INFRASTRUCTURE (15 agents) ===
      '@devops-architect': {
        name: 'DevOps Architect',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'CI/CD, IaC, Automation, Cloud Architecture',
        skills: ['Pipeline Design', 'GitOps', 'Monitoring', 'SRE'],
        performance: 0.95
      },
      '@kubernetes-expert': {
        name: 'Kubernetes Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'K8s, Helm, Operators, Service Mesh',
        skills: ['Deployments', 'Scaling', 'Networking', 'Security'],
        performance: 0.94
      },
      '@docker-specialist': {
        name: 'Docker Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Docker, Compose, Swarm, Registry',
        skills: ['Containerization', 'Multi-stage Builds', 'Networks', 'Volumes'],
        performance: 0.93
      },
      '@aws-architect': {
        name: 'AWS Solutions Architect',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'AWS Services, Well-Architected Framework',
        skills: ['EC2', 'Lambda', 'RDS', 'CloudFormation'],
        performance: 0.95
      },
      '@azure-specialist': {
        name: 'Azure Cloud Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Azure Services, ARM Templates, DevOps',
        skills: ['App Services', 'Functions', 'AKS', 'Cosmos DB'],
        performance: 0.93
      },      '@gcp-expert': {
        name: 'Google Cloud Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'GCP Services, Anthos, BigQuery',
        skills: ['Compute Engine', 'Cloud Functions', 'GKE', 'Firestore'],
        performance: 0.92
      },
      '@terraform-specialist': {
        name: 'Terraform IaC Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Terraform, Modules, State Management',
        skills: ['HCL', 'Providers', 'Workspaces', 'Automation'],
        performance: 0.93
      },
      '@ansible-expert': {
        name: 'Ansible Automation Expert',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'Ansible, Playbooks, Roles, AWX',
        skills: ['Inventory', 'Modules', 'Vault', 'Tower'],
        performance: 0.90
      },
      '@jenkins-specialist': {
        name: 'Jenkins CI/CD Specialist',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'Jenkins, Pipelines, Plugins, Blue Ocean',
        skills: ['Groovy', 'Declarative Pipeline', 'Agents', 'Security'],
        performance: 0.89
      },
      '@github-actions-expert': {
        name: 'GitHub Actions Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'GitHub Actions, Workflows, Self-hosted Runners',
        skills: ['YAML', 'Matrix Builds', 'Secrets', 'Artifacts'],
        performance: 0.91
      },      '@monitoring-specialist': {
        name: 'Monitoring & Observability Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Prometheus, Grafana, ELK Stack, APM',
        skills: ['Metrics', 'Logging', 'Tracing', 'Alerting'],
        performance: 0.92
      },
      '@sre-expert': {
        name: 'Site Reliability Engineer',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'SRE Practices, SLI/SLO/SLA, Incident Response',
        skills: ['Reliability', 'Automation', 'Capacity Planning', 'Postmortems'],
        performance: 0.94
      },
      '@network-architect': {
        name: 'Network Architect',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Network Design, SDN, Load Balancing, CDN',
        skills: ['TCP/IP', 'DNS', 'VPN', 'Firewalls'],
        performance: 0.90
      },
      '@loadbalancer-expert': {
        name: 'Load Balancer Expert',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'HAProxy, Nginx, Traefik, ALB/NLB',
        skills: ['Traffic Distribution', 'Health Checks', 'SSL/TLS', 'Caching'],
        performance: 0.89
      },
      '@cdn-specialist': {
        name: 'CDN Specialist',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'CloudFlare, Fastly, Akamai, CloudFront',
        skills: ['Edge Computing', 'Caching', 'DDoS Protection', 'Optimization'],
        performance: 0.88
      },
      
      // === Security === SECURITY & COMPLIANCE (10 agents) ===
      '@security-architect': {
        name: 'Security Architect',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Security Architecture, Zero Trust, Defense in Depth',
        skills: ['Threat Modeling', 'Risk Assessment', 'Security Patterns', 'Compliance'],
        performance: 0.96
      },
      '@penetration-tester': {
        name: 'Penetration Tester',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Pen Testing, Vulnerability Assessment, Red Team',
        skills: ['OWASP', 'Metasploit', 'Burp Suite', 'Social Engineering'],
        performance: 0.94
      },
      '@compliance-officer': {
        name: 'Compliance Officer',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'GDPR, HIPAA, SOC2, ISO 27001',
        skills: ['Audit', 'Documentation', 'Risk Management', 'Training'],
        performance: 0.92
      },
      '@cryptography-expert': {
        name: 'Cryptography Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Encryption, PKI, SSL/TLS, Blockchain',
        skills: ['Symmetric/Asymmetric', 'Hashing', 'Digital Signatures', 'Key Management'],
        performance: 0.93
      },
      '@identity-specialist': {
        name: 'Identity & Access Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'OAuth, SAML, OIDC, SSO, MFA',
        skills: ['IAM', 'RBAC', 'Federation', 'Directory Services'],
        performance: 0.91
      },      '@incident-responder': {
        name: 'Incident Response Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'DFIR, SOC, SIEM, Threat Hunting',
        skills: ['Forensics', 'Malware Analysis', 'Log Analysis', 'Recovery'],
        performance: 0.92
      },
      '@cloud-security-expert': {
        name: 'Cloud Security Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Cloud Security, CSPM, CWPP, CASB',
        skills: ['Cloud IAM', 'Network Security', 'Data Protection', 'Compliance'],
        performance: 0.93
      },
      '@appsec-specialist': {
        name: 'Application Security Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'SAST, DAST, IAST, Secure Coding',
        skills: ['Code Review', 'Vulnerability Scanning', 'WAF', 'DevSecOps'],
        performance: 0.91
      },
      '@privacy-expert': {
        name: 'Privacy Expert',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'Data Privacy, PII, Right to be Forgotten',
        skills: ['Privacy by Design', 'Data Minimization', 'Consent', 'Anonymization'],
        performance: 0.89
      },
      '@audit-specialist': {
        name: 'Security Audit Specialist',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'Security Audits, Compliance Checks, Reports',
        skills: ['Framework Assessment', 'Gap Analysis', 'Remediation', 'Documentation'],
        performance: 0.88
      },
      
      // === AI/ML === AI/ML SPECIALISTS (10 agents) ===
      '@ml-architect': {
        name: 'Machine Learning Architect',
        model: 'Claude Opus 4.1',
        context: 200000,
        specialization: 'ML System Design, MLOps, Model Architecture',
        skills: ['Deep Learning', 'Feature Engineering', 'Model Selection', 'Deployment'],
        performance: 0.97
      },
      '@nlp-expert': {
        name: 'NLP Expert',
        model: 'Claude Opus 4.1',
        context: 200000,
        specialization: 'NLP, Transformers, LLMs, Text Processing',
        skills: ['BERT', 'GPT', 'Embeddings', 'Fine-tuning'],
        performance: 0.96
      },
      '@computer-vision-specialist': {
        name: 'Computer Vision Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'CV, CNNs, Object Detection, Image Segmentation',
        skills: ['YOLO', 'ResNet', 'OpenCV', 'TensorFlow'],
        performance: 0.94
      },
      '@data-scientist': {
        name: 'Data Scientist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Data Analysis, Statistics, Visualization',
        skills: ['Pandas', 'NumPy', 'Scikit-learn', 'Matplotlib'],
        performance: 0.93
      },
      '@mlops-engineer': {
        name: 'MLOps Engineer',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'ML Pipelines, Model Serving, Monitoring',
        skills: ['Kubeflow', 'MLflow', 'TensorFlow Serving', 'Model Registry'],
        performance: 0.92
      },      '@reinforcement-learning-expert': {
        name: 'Reinforcement Learning Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'RL, Q-Learning, Policy Gradient, Multi-Agent',
        skills: ['OpenAI Gym', 'Stable Baselines', 'Ray RLlib', 'Game AI'],
        performance: 0.91
      },
      '@recommendation-specialist': {
        name: 'Recommendation Systems Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'RecSys, Collaborative Filtering, Content-Based',
        skills: ['Matrix Factorization', 'Deep Learning RecSys', 'A/B Testing', 'Personalization'],
        performance: 0.90
      },
      '@time-series-expert': {
        name: 'Time Series Expert',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'Time Series Analysis, Forecasting, Anomaly Detection',
        skills: ['ARIMA', 'LSTM', 'Prophet', 'Seasonal Decomposition'],
        performance: 0.89
      },
      '@embeddings-specialist': {
        name: 'Embeddings Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Vector Embeddings, Similarity Search, RAG',
        skills: ['Word2Vec', 'BERT Embeddings', 'Sentence Transformers', 'FAISS'],
        performance: 0.91
      },
      '@automl-expert': {
        name: 'AutoML Expert',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'AutoML, Hyperparameter Tuning, NAS',
        skills: ['AutoGluon', 'H2O', 'Optuna', 'Feature Selection'],
        performance: 0.88
      },
      
      // === Education === EDUCATION SPECIALISTS (10 agents) ===
      '@math-expert': {
        name: 'Mathematics Expert',
        model: 'Claude Opus 4.1',
        context: 200000,
        specialization: 'Mathematics, Problem Solving, Proofs, Theory',
        skills: ['Algebra', 'Calculus', 'Statistics', 'Number Theory'],
        performance: 0.98
      },
      '@education-specialist': {
        name: 'Education Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Pedagogy, Curriculum Design, Assessment',
        skills: ['Learning Theory', 'Instructional Design', 'Evaluation', 'Differentiation'],
        performance: 0.94
      },
      '@curriculum-designer': {
        name: 'Curriculum Designer',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Curriculum Development, Standards Alignment, Scope & Sequence',
        skills: ['Backward Design', 'Standards Mapping', 'Assessment Design', 'Materials Development'],
        performance: 0.92
      },
      '@tutor-ai': {
        name: 'AI Tutor',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Personalized Tutoring, Adaptive Learning, Student Support',
        skills: ['Socratic Method', 'Scaffolding', 'Feedback', 'Motivation'],
        performance: 0.93
      },
      '@assessment-expert': {
        name: 'Assessment Expert',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Test Design, Rubrics, Formative Assessment',
        skills: ['Item Writing', 'Validity', 'Reliability', 'Data Analysis'],
        performance: 0.91
      },      '@learning-analytics-specialist': {
        name: 'Learning Analytics Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Educational Data Mining, Learning Analytics, Predictive Modeling',
        skills: ['Data Visualization', 'Predictive Analytics', 'Dashboard Design', 'Reporting'],
        performance: 0.90
      },
      '@gamification-expert': {
        name: 'Gamification Expert',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'Game-Based Learning, Badges, Leaderboards, Engagement',
        skills: ['Game Mechanics', 'Reward Systems', 'Progress Tracking', 'Motivation Theory'],
        performance: 0.89
      },
      '@accessibility-specialist': {
        name: 'Accessibility Specialist',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'WCAG, Universal Design, Assistive Technology',
        skills: ['Screen Readers', 'Keyboard Navigation', 'Color Contrast', 'ARIA'],
        performance: 0.91
      },
      '@content-creator': {
        name: 'Educational Content Creator',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'Content Development, Multimedia, Interactive Materials',
        skills: ['Writing', 'Video Creation', 'Infographics', 'Interactive Elements'],
        performance: 0.88
      },
      '@student-success-coach': {
        name: 'Student Success Coach',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'Student Support, Motivation, Study Skills, Time Management',
        skills: ['Coaching', 'Goal Setting', 'Study Strategies', 'Stress Management'],
        performance: 0.87
      },
      
      // === QA/Testing === QA & TESTING (5 agents) ===
      '@qa-architect': {
        name: 'QA Architect',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Test Strategy, Test Architecture, Quality Gates',
        skills: ['Test Planning', 'Risk Analysis', 'Metrics', 'Process Improvement'],
        performance: 0.93
      },
      '@automation-tester': {
        name: 'Test Automation Engineer',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Test Automation, Selenium, Cypress, Playwright',
        skills: ['E2E Testing', 'API Testing', 'Performance Testing', 'CI Integration'],
        performance: 0.92
      },
      '@performance-tester': {
        name: 'Performance Tester',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'Load Testing, Stress Testing, Performance Tuning',
        skills: ['JMeter', 'Gatling', 'LoadRunner', 'Profiling'],
        performance: 0.89
      },
      '@security-tester': {
        name: 'Security Tester',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Security Testing, Vulnerability Scanning, Pen Testing',
        skills: ['OWASP Testing', 'Burp Suite', 'SQL Injection', 'XSS'],
        performance: 0.91
      },
      '@mobile-tester': {
        name: 'Mobile Testing Specialist',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'Mobile Testing, Appium, Device Farms',
        skills: ['iOS Testing', 'Android Testing', 'Cross-platform', 'Automation'],
        performance: 0.88
      },
      
      // === Management === PROJECT MANAGEMENT & DOCUMENTATION (5 agents) ===
      '@project-manager': {
        name: 'Project Manager',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Project Management, Agile, Scrum, Kanban',
        skills: ['Planning', 'Risk Management', 'Stakeholder Management', 'Reporting'],
        performance: 0.92
      },
      '@scrum-master': {
        name: 'Scrum Master',
        model: 'Claude Haiku',
        context: 100000,
        specialization: 'Scrum Framework, Facilitation, Team Coaching',
        skills: ['Sprint Planning', 'Retrospectives', 'Impediment Removal', 'Metrics'],
        performance: 0.89
      },
      '@technical-writer': {
        name: 'Technical Writer',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Documentation, API Docs, User Guides, Tutorials',
        skills: ['Markdown', 'OpenAPI', 'Style Guides', 'Information Architecture'],
        performance: 0.91
      },
      '@ux-designer': {
        name: 'UX Designer',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'User Experience, UI Design, Prototyping, User Research',
        skills: ['Wireframing', 'Figma', 'User Testing', 'Design Systems'],
        performance: 0.93
      },
      '@product-owner': {
        name: 'Product Owner',
        model: 'Claude Sonnet 4',
        context: 200000,
        specialization: 'Product Strategy, Backlog Management, Requirements',
        skills: ['User Stories', 'Prioritization', 'Roadmapping', 'Stakeholder Communication'],
        performance: 0.92
      }
    };
  }

  // Get total number of agents
  getAgentCount() {
    return Object.keys(this.agents).length;
  }

  // Create an agent instance
  createAgent(agentId) {
    if (!this.agents[agentId]) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    const agent = { ...this.agents[agentId], id: agentId };
    this.activeAgents.set(agentId, agent);
    this.performanceMetrics.set(agentId, {
      tasksCompleted: 0,
      averageTime: 0,
      successRate: agent.performance
    });
    
    return agent;
  }

  // Get all agents by category
  getAgentsByCategory(category) {
    const categories = {
      development: ['@react-expert', '@vue-specialist', '@angular-architect', '@svelte-developer', '@solid-js-expert',
                    '@backend-architect', '@node-expert', '@python-specialist', '@golang-developer', '@rust-specialist'],
      database: ['@database-architect', '@postgres-expert', '@mongodb-specialist', '@neo4j-expert', '@redis-specialist',
                 '@elasticsearch-expert', '@cassandra-specialist', '@mysql-expert', '@oracle-specialist', '@chromadb-expert'],
      devops: ['@devops-architect', '@kubernetes-expert', '@docker-specialist', '@aws-architect', '@azure-specialist',
               '@gcp-expert', '@terraform-specialist', '@ansible-expert', '@jenkins-specialist', '@github-actions-expert',
               '@monitoring-specialist', '@sre-expert', '@network-architect', '@loadbalancer-expert', '@cdn-specialist'],
      security: ['@security-architect', '@penetration-tester', '@compliance-officer', '@cryptography-expert', 
                 '@identity-specialist', '@incident-responder', '@cloud-security-expert', '@appsec-specialist',
                 '@privacy-expert', '@audit-specialist'],
      ai_ml: ['@ml-architect', '@nlp-expert', '@computer-vision-specialist', '@data-scientist', '@mlops-engineer',
              '@reinforcement-learning-expert', '@recommendation-specialist', '@time-series-expert', 
              '@embeddings-specialist', '@automl-expert'],
      education: ['@math-expert', '@education-specialist', '@curriculum-designer', '@tutor-ai', '@assessment-expert',
                  '@learning-analytics-specialist', '@gamification-expert', '@accessibility-specialist',
                  '@content-creator', '@student-success-coach'],
      qa_testing: ['@qa-architect', '@automation-tester', '@performance-tester', '@security-tester', '@mobile-tester'],
      management: ['@project-manager', '@scrum-master', '@technical-writer', '@ux-designer', '@product-owner']
    };
    
    return categories[category] || [];
  }

  // Get best agent for a task
  getBestAgentForTask(task) {
    // Simple keyword matching for now
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('react') || taskLower.includes('frontend')) return '@react-expert';
    if (taskLower.includes('database') || taskLower.includes('sql')) return '@database-architect';
    if (taskLower.includes('security')) return '@security-architect';
    if (taskLower.includes('math')) return '@math-expert';
    if (taskLower.includes('test')) return '@qa-architect';
    if (taskLower.includes('deploy') || taskLower.includes('ci/cd')) return '@devops-architect';
    if (taskLower.includes('ml') || taskLower.includes('ai')) return '@ml-architect';
    
    // Default to backend architect for general tasks
    return '@backend-architect';
  }

  // Get agent status
  getAgentStatus(agentId) {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return 'inactive';
    
    return {
      id: agentId,
      name: agent.name,
      status: 'active',
      metrics: this.performanceMetrics.get(agentId)
    };
  }

  // Release an agent
  releaseAgent(agentId) {
    this.activeAgents.delete(agentId);
    return true;
  }

  // Get all active agents
  getActiveAgents() {
    return Array.from(this.activeAgents.values());
  }

  // Get performance report
  getPerformanceReport() {
    const report = {
      totalAgents: this.getAgentCount(),
      activeAgents: this.activeAgents.size,
      categoryBreakdown: {},
      topPerformers: []
    };
    
    // Get top performers
    const agents = Object.entries(this.agents)
      .sort((a, b) => b[1].performance - a[1].performance)
      .slice(0, 10);
    
    report.topPerformers = agents.map(([id, agent]) => ({
      id,
      name: agent.name,
      performance: agent.performance
    }));
    
    return report;
  }
}

// Export factory
export default AgentFactory;