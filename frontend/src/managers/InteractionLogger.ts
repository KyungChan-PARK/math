// InteractionLogger.ts - Logs user interactions for AI learning
import { v4 as uuidv4 } from 'uuid';

export interface InteractionLog {
  log_id: string;
  session_id: string;
  timestamp: number;
  user_id: string;
  event_type: 'USER_GESTURE' | 'AGENT_ACTION' | 'SYSTEM_EVENT';
  user_action?: {
    gesture_type: string;
    raw_touch_data?: any[];
    parameters: any;
  };
  scene_state_before: any;
  scene_state_after: any;
  agent_state?: any;
}

class InteractionLogger {
  private sessionId: string;
  private userId: string;
  private logs: InteractionLog[] = [];
  private wsConnection: WebSocket | null = null;
  private batchSize = 10;
  private batchTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.sessionId = uuidv4();
    this.userId = this.initializeUserId();
    this.initializeWebSocket();
  }
  
  private initializeUserId(): string {
    // Get or create user ID from localStorage
    let userId = localStorage.getItem('math_education_user_id');
    if (!userId) {
      userId = uuidv4();
      localStorage.setItem('math_education_user_id', userId);
    }
    return userId;
  }
  
  private initializeWebSocket(): void {
    try {
      // Connect to backend WebSocket server
      this.wsConnection = new WebSocket('ws://localhost:8085');
      
      this.wsConnection.onopen = () => {
        console.log('Connected to interaction logging server');
        this.sendPendingLogs();
      };
      
      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.wsConnection.onclose = () => {
        console.log('Disconnected from logging server');
        // Try to reconnect after 5 seconds
        setTimeout(() => this.initializeWebSocket(), 5000);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }
  
  public logInteraction(data: Partial<InteractionLog>): void {
    const log: InteractionLog = {
      log_id: uuidv4(),
      session_id: this.sessionId,
      timestamp: Date.now(),
      user_id: this.userId,
      event_type: data.event_type || 'USER_GESTURE',
      user_action: data.user_action,
      scene_state_before: data.scene_state_before || {},
      scene_state_after: data.scene_state_after || {},
      agent_state: data.agent_state
    };
    
    this.logs.push(log);
    
    // Send logs in batches
    if (this.logs.length >= this.batchSize) {
      this.sendLogs();
    } else {
      // Set timer to send logs after a delay
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }
      this.batchTimer = setTimeout(() => this.sendLogs(), 2000);
    }
    
    // Also store locally for offline support
    this.storeLocally(log);
  }
  
  private sendLogs(): void {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not ready, storing logs locally');
      return;
    }
    
    if (this.logs.length === 0) return;
    
    const logsToSend = [...this.logs];
    this.logs = [];
    
    try {
      this.wsConnection.send(JSON.stringify({
        type: 'INTERACTION_LOGS',
        data: logsToSend
      }));
      
      console.log(`Sent ${logsToSend.length} interaction logs`);
    } catch (error) {
      console.error('Failed to send logs:', error);
      // Re-add logs to queue
      this.logs.unshift(...logsToSend);
    }
  }
  
  private sendPendingLogs(): void {
    // Send any logs that were queued while disconnected
    const storedLogs = this.getStoredLogs();
    if (storedLogs.length > 0) {
      try {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
          this.wsConnection.send(JSON.stringify({
            type: 'INTERACTION_LOGS',
            data: storedLogs
          }));
          
          // Clear stored logs after successful send
          localStorage.removeItem('math_education_pending_logs');
          console.log(`Sent ${storedLogs.length} pending logs`);
        }
      } catch (error) {
        console.error('Failed to send pending logs:', error);
      }
    }
  }
  
  private storeLocally(log: InteractionLog): void {
    try {
      const storedLogs = this.getStoredLogs();
      storedLogs.push(log);
      
      // Keep only last 100 logs to prevent storage overflow
      if (storedLogs.length > 100) {
        storedLogs.splice(0, storedLogs.length - 100);
      }
      
      localStorage.setItem('math_education_pending_logs', JSON.stringify(storedLogs));
    } catch (error) {
      console.error('Failed to store log locally:', error);
    }
  }
  
  private getStoredLogs(): InteractionLog[] {
    try {
      const stored = localStorage.getItem('math_education_pending_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve stored logs:', error);
      return [];
    }
  }
  
  public getSessionId(): string {
    return this.sessionId;
  }
  
  public getUserId(): string {
    return this.userId;
  }
  
  public getLogCount(): number {
    return this.logs.length + this.getStoredLogs().length;
  }
  
  public exportLogs(): InteractionLog[] {
    return [...this.logs, ...this.getStoredLogs()];
  }
  
  public clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('math_education_pending_logs');
  }
  
  public destroy(): void {
    // Send any remaining logs
    if (this.logs.length > 0) {
      this.sendLogs();
    }
    
    // Close WebSocket connection
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    
    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }
}

export default InteractionLogger;
