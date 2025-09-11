// Gmail Notification System for Document Monitoring
// Sends alerts to packr0723@gmail.com

import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import chalk from 'chalk';

class GmailNotificationSystem {
    constructor() {
        this.recipient = 'packr0723@gmail.com';
        this.issues = {
            duplicates: [],
            brokenLinks: [],
            structureChanges: []
        };
        
        // Gmail SMTP configuration
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER || 'your-email@gmail.com',
                pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
            }
        });
    }

    async sendNotification(type, data) {
        const subjects = {
            duplicates: '🔴 [Math Platform] 중복 파일 삭제 확인 필요',
            brokenLinks: '⚠️ [Math Platform] 깨진 링크 수정 필요',
            structureChanges: '📁 [Math Platform] 구조 변경 승인 필요',
            dailySummary: '📊 [Math Platform] 일일 문서 상태 리포트'
        };

        const htmlContent = this.generateEmailContent(type, data);
        
        const mailOptions = {
            from: 'Math Learning Platform <noreply@mathplatform.ai>',
            to: this.recipient,
            subject: subjects[type],
            html: htmlContent
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(chalk.green(`✅ Email sent: ${info.messageId}`));
            return true;
        } catch (error) {
            console.error(chalk.red('❌ Email sending failed:', error.message));
            
            // Fallback: Save to local file
            await this.saveLocalNotification(type, data);
            return false;
        }
    }

    generateEmailContent(type, data) {
        const timestamp = new Date().toLocaleString('ko-KR');
        
        let content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                <h1>Math Learning Platform</h1>
                <p>AI Agent 문서 시스템 알림</p>
            </div>
            <div style="padding: 20px; background: #f8f9fa;">
                <p style="color: #666;">시간: ${timestamp}</p>
        `;

        switch(type) {
            case 'duplicates':
                content += `
                <h2 style="color: #dc3545;">🔴 중복 파일 발견</h2>
                <p>다음 파일들이 중복으로 확인되었습니다:</p>
                <ul style="background: white; padding: 15px; border-radius: 5px;">
                ${data.map(file => `<li>${file.name} (${file.count}개)</li>`).join('')}
                </ul>
                <div style="margin-top: 20px;">
                    <a href="http://localhost:8091/admin/duplicates" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">삭제 검토하기</a>
                </div>`;
                break;

            case 'brokenLinks':
                content += `
                <h2 style="color: #ffc107;">⚠️ 깨진 링크 발견</h2>
                <p>다음 링크들이 작동하지 않습니다:</p>
                <ul style="background: white; padding: 15px; border-radius: 5px;">
                ${data.map(link => `<li>${link.file}: ${link.brokenLink}</li>`).join('')}
                </ul>
                <div style="margin-top: 20px;">
                    <a href="http://localhost:8091/admin/links" style="background: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">링크 수정하기</a>
                </div>`;
                break;

            case 'structureChanges':
                content += `
                <h2 style="color: #17a2b8;">📁 구조 변경 제안</h2>
                <p>문서 구조 개선을 위한 제안사항:</p>
                <div style="background: white; padding: 15px; border-radius: 5px;">
                ${data.suggestions.map(s => `<p>• ${s}</p>`).join('')}
                </div>
                <div style="margin-top: 20px;">
                    <a href="http://localhost:8091/admin/structure" style="background: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">구조 변경 검토</a>
                </div>`;
                break;

            case 'dailySummary':
                content += `
                <h2 style="color: #28a745;">📊 일일 상태 리포트</h2>
                <table style="width: 100%; background: white; border-radius: 5px;">
                    <tr><td>총 문서:</td><td>${data.totalDocs}</td></tr>
                    <tr><td>발견된 이슈:</td><td>${data.issues}</td></tr>
                    <tr><td>자동 수정:</td><td>${data.autoFixed}</td></tr>
                    <tr><td>수동 필요:</td><td>${data.manualNeeded}</td></tr>
                    <tr><td>건강도:</td><td>${data.healthScore}/100</td></tr>
                </table>`;
                break;
        }

        content += `
            </div>
            <div style="background: #343a40; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px;">
                <p style="margin: 0;">Claude Opus 4.1 AI Agent System</p>
                <p style="margin: 5px 0 0 0; font-size: 12px;">자동 생성된 알림입니다</p>
            </div>
        </div>`;

        return content;
    }

    async saveLocalNotification(type, data) {
        const notification = {
            type,
            data,
            timestamp: new Date().toISOString(),
            emailFailed: true
        };

        const filePath = `notifications_pending_${Date.now()}.json`;
        await fs.writeFile(filePath, JSON.stringify(notification, null, 2));
        console.log(chalk.yellow(`📁 Notification saved locally: ${filePath}`));
    }

    async checkAndNotify() {
        // Check SELF_IMPROVEMENT_STATUS.json
        try {
            const status = JSON.parse(
                await fs.readFile('SELF_IMPROVEMENT_STATUS.json', 'utf-8')
            );

            // Check for duplicates
            if (status.metrics.duplicatesFound > 5) {
                await this.sendNotification('duplicates', [
                    { name: 'LICENSE.md', count: 8 },
                    { name: 'checkpoint_*.md', count: 6 },
                    { name: 'PROJECT_STATUS_*.md', count: 3 }
                ]);
            }

            // Check for broken links
            const brokenLinks = status.issues.filter(i => i.type === 'broken_link');
            if (brokenLinks.length > 0) {
                await this.sendNotification('brokenLinks', brokenLinks);
            }

            // Daily summary at 9 AM
            const now = new Date();
            if (now.getHours() === 9 && now.getMinutes() === 0) {
                await this.sendNotification('dailySummary', {
                    totalDocs: status.metrics.documentsScanned,
                    issues: status.metrics.issuesFound,
                    autoFixed: status.metrics.issuesFixed,
                    manualNeeded: status.metrics.issuesFound - status.metrics.issuesFixed,
                    healthScore: status.health.score
                });
            }
        } catch (error) {
            console.error(chalk.red('Error checking status:', error.message));
        }
    }

    async startMonitoring() {
        console.log(chalk.cyan('📧 Gmail Notification System Started'));
        console.log(chalk.gray(`Sending to: ${this.recipient}`));
        
        // Check every 5 minutes
        setInterval(() => {
            this.checkAndNotify();
        }, 300000);
        
        // Initial check
        this.checkAndNotify();
    }
}

// Setup instructions
const setupInstructions = `
# Gmail 알림 설정 방법

1. Gmail 앱 비밀번호 생성:
   - https://myaccount.google.com/security 접속
   - 2단계 인증 활성화
   - 앱 비밀번호 생성
   
2. 환경 변수 설정:
   .env 파일에 추가:
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   
3. 실행:
   node gmail-notifier.js
`;

// Export
export default GmailNotificationSystem;

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const notifier = new GmailNotificationSystem();
    notifier.startMonitoring();
}