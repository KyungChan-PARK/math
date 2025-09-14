# Claude Code Opus 4.1 Development Guide

## Core Tools

### Task
```javascript
await Task({
  subagent_type: 'general-purpose',
  description: 'Analyze codebase',
  prompt: 'Find all React components and analyze their dependencies'
});
```

### Bash
```javascript
// Single command
await Bash({ command: 'npm install' });

// Background process
await Bash({ 
  command: 'npm run dev',
  run_in_background: true,
  timeout: 600000
});

// Parallel execution
const [status, diff, log] = await Promise.all([
  Bash({ command: 'git status' }),
  Bash({ command: 'git diff' }),
  Bash({ command: 'git log --oneline -5' })
]);
```

### File Operations
```javascript
// Read
await Read({ file_path: '/mnt/c/palantir/math/file.js' });

// Write
await Write({ 
  file_path: '/mnt/c/palantir/math/new.js',
  content: 'const app = express();'
});

// MultiEdit (preferred)
await MultiEdit({
  file_path: '/mnt/c/palantir/math/app.js',
  edits: [
    { old_string: 'old1', new_string: 'new1' },
    { old_string: 'old2', new_string: 'new2', replace_all: true }
  ]
});
```

### Search
```javascript
// File patterns
await Glob({ pattern: '**/*.js' });
await Glob({ pattern: 'src/**/*.test.ts', path: '/mnt/c/palantir/math' });

// Content search
await Grep({ 
  pattern: 'TODO',
  output_mode: 'files_with_matches'
});

await Grep({
  pattern: 'function.*export',
  output_mode: 'content',
  '-n': true,
  '-B': 2,
  '-A': 2
});
```

### Task Management
```javascript
await TodoWrite({
  todos: [
    {
      content: 'Implement feature',
      activeForm: 'Implementing feature',
      status: 'in_progress'
    },
    {
      content: 'Write tests',
      activeForm: 'Writing tests',
      status: 'pending'
    }
  ]
});
```

## Project Workflow

### 1. Session Start
```javascript
// Initialize
await TodoWrite({ todos: [...projectTasks] });
await Read({ file_path: '/mnt/c/palantir/math/PROJECT_STATUS.md' });

// Check services (parallel)
const [health, stats] = await Promise.all([
  Bash({ command: 'curl -s http://localhost:8093/api/health' }),
  Bash({ command: 'curl -s http://localhost:8093/api/stats' })
]);
```

### 2. Development
```javascript
// Analyze structure
const components = await Glob({ pattern: 'src/**/*.{jsx,tsx}' });
const tests = await Glob({ pattern: '**/*.test.js' });

// Find patterns
const exports = await Grep({
  pattern: 'export (default|function|class)',
  type: 'js'
});

// Modify code
await Read({ file_path: '/mnt/c/palantir/math/app.js' });
await MultiEdit({
  file_path: '/mnt/c/palantir/math/app.js',
  edits: [...modifications]
});

// Verify
await Bash({ command: 'npm run lint' });
await Bash({ command: 'npm test' });
```

### 3. Git Operations
```javascript
// Status check (parallel)
const [status, diff] = await Promise.all([
  Bash({ command: 'git status' }),
  Bash({ command: 'git diff' })
]);

// Commit
await Bash({ command: 'git add .' });
await Bash({ 
  command: `git commit -m "$(cat <<'EOF'
feat: Add new feature

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"` 
});
```

## Performance Tips

### ✅ DO
```javascript
// Parallel reads
const [f1, f2, f3] = await Promise.all([
  Read({ file_path: 'file1.js' }),
  Read({ file_path: 'file2.js' }),
  Read({ file_path: 'file3.js' })
]);

// Use specialized tools
await Grep({ pattern: 'TODO', type: 'js' });

// Single MultiEdit
await MultiEdit({ file_path: 'app.js', edits: [...allEdits] });
```

### ❌ DON'T
```javascript
// Sequential reads (slow)
const f1 = await Read({ file_path: 'file1.js' });
const f2 = await Read({ file_path: 'file2.js' });

// Shell grep (slow)
await Bash({ command: 'find . -name "*.js" | xargs grep "TODO"' });

// Multiple Edit calls (inefficient)
await Edit({ file_path: 'app.js', old_string: 'a', new_string: 'b' });
await Edit({ file_path: 'app.js', old_string: 'c', new_string: 'd' });
```

## Current System

- **Model**: Claude Opus 4.1 (claude-opus-4-1-20250805)
- **Context**: 200K tokens
- **Qwen API**: Port 8093 (HTTP), 8094 (WebSocket)
- **Cache**: 85.71% hit rate
- **Path prefix**: /mnt/c/palantir/math/

## Key Files

- `/mnt/c/palantir/math/PROJECT_STATUS.md` - Project status
- `/mnt/c/palantir/math/orchestration/qwen-orchestrator-optimized.js` - Orchestrator
- `/mnt/c/palantir/math/optimized-qwen-client.js` - API client
- `/mnt/c/palantir/math/claude-code-opus41-tools-guide.md` - Tools reference

## Common Tasks

```javascript
// Start orchestrator
await Bash({ 
  command: 'node /mnt/c/palantir/math/orchestration/qwen-orchestrator-optimized.js',
  run_in_background: true
});

// Check port usage
await Bash({ command: 'lsof -i:8093' });

// Clear cache
await Bash({ command: 'curl -X POST http://localhost:8093/api/cache/clear' });

// Run tests
await Bash({ command: 'cd /mnt/c/palantir/math && npm test' });
```

---
**Environment**: Claude Code on WSL2
**Updated**: 2025-09-11