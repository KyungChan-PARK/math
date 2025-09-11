# Trivial Issue Prevention System v2.0

## Overview
Automatic prevention and resolution system for recurring development issues in the Math Education System.

## Features

### 1. Korean Character Handling
- Automatically detects Korean text in code/logs
- Converts common Korean words to English
- Prevents encoding errors in non-UTF8 systems

**Mapping:**
- 성공 → success
- 실패 → failed  
- 완료 → complete
- 오류 → error
- 시작 → start
- 종료 → end
- 테스트 → test
- 서버 → server
- 연결 → connection
- 통합 → integration

### 2. Emoji Removal
- Automatically removes all emojis from production code
- Keeps code clean and ASCII-compatible

### 3. ES Module Fixes
- Converts `export class` to `export default class`
- Fixes `module.exports` to `export default`

### 4. PowerShell Command Fixes
- Replaces `&&` with `;` for PowerShell compatibility
- Adds `cd` commands when needed

### 5. Path Management
- Warns about relative paths
- Suggests absolute paths

## Usage

### Automatic Integration
```javascript
// Add to your main server file
import '../../auto-prevention.js';
```

### Manual Usage
```javascript
import TrivialIssuePrevention from './trivial-issue-prevention-v2.js';

const prevention = new TrivialIssuePrevention();

// Clean text for memory storage
const cleaned = prevention.prepareForMemory(data);

// Validate command before execution
const safeCommand = prevention.preCommandValidation(command);

// Fix code before writing
const fixedCode = prevention.preWriteValidation(filePath, code);
```

## Files
- `trivial-issue-prevention-v2.js` - Main system (v2.0)
- `auto-prevention.js` - Global integration hooks
- `.trivial_issues.json` - Issue tracking database
- `.prevention_patterns.json` - Fix patterns database

## Statistics
Run `node trivial-issue-prevention-v2.js` to see current statistics.

## Monitoring
The system automatically:
- Catches uncaught exceptions
- Logs recurring issues
- Suggests solutions
- Applies auto-fixes

## Express/Koa Middleware
```javascript
app.use(prevention.middleware());
```

This middleware automatically cleans request/response data.

## Version History
- v2.0 (2025-09-06): Added Korean/emoji handling
- v1.0 (2025-09-04): Initial system with ES module, PowerShell fixes
