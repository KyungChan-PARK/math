/**
 * Live Tool Demo - Real-time demonstration of all tools
 */

import { spawn } from 'child_process';
import readline from 'readline';

console.log(`
╔════════════════════════════════════════════════════╗
║      Claude Opus 4.1 - Live Tool Demonstration    ║
║      Real examples of all available tools         ║
╚════════════════════════════════════════════════════╝

Available Demonstrations:
1. 📁 Filesystem Tools Demo
2. 🔍 Search Tools Demo  
3. 💻 Process Tools Demo
4. 📝 Edit Tools Demo
5. 🎯 Combined Workflow Demo

`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function filesystemDemo() {
  console.log('\n📁 FILESYSTEM TOOLS DEMO\n');
  console.log('=' . repeat(50));
  
  console.log(`
Example 1: Reading a file
-------------------------
Filesystem:read_file({
  path: "C:\\\\palantir\\\\math\\\\package.json"
})

Example 2: Creating directory tree
----------------------------------
Filesystem:directory_tree({
  path: "C:\\\\palantir\\\\math\\\\src"
})

Example 3: Searching for files
-------------------------------
Filesystem:search_files({
  path: "C:\\\\palantir\\\\math",
  pattern: "test",
  excludePatterns: ["node_modules"]
})
  `);
}

async function searchDemo() {
  console.log('\n🔍 SEARCH TOOLS DEMO\n');
  console.log('=' . repeat(50));
  
  console.log(`
Example 1: Start content search
--------------------------------
terminal:start_search({
  path: "C:\\\\palantir\\\\math",
  pattern: "TODO",
  searchType: "content",
  filePattern: "*.js",
  contextLines: 3
})

Example 2: Get search results
------------------------------
terminal:get_more_search_results({
  sessionId: "search_1_xxxxx",
  offset: 0,
  length: 100  
})

Example 3: List active searches
--------------------------------
terminal:list_searches()
  `);
}

async function processDemo() {
  console.log('\n💻 PROCESS TOOLS DEMO\n');
  console.log('=' . repeat(50));
  
  console.log(`
Example 1: Start Python REPL
-----------------------------
terminal:start_process({
  command: "python3 -i",
  timeout_ms: 5000
})

Example 2: Interact with process
---------------------------------
terminal:interact_with_process({
  pid: 12345,
  input: "import pandas as pd\\ndf = pd.read_csv('data.csv')",
  timeout_ms: 5000
})

Example 3: List running processes
----------------------------------
terminal:list_processes()
  `);
}

async function editDemo() {
  console.log('\n📝 EDIT TOOLS DEMO\n');
  console.log('=' . repeat(50));
  
  console.log(`
Example 1: Precise code edit
-----------------------------
terminal:edit_block({
  file_path: "script.js",
  old_string: "const x = 5;",
  new_string: "const x = 10;",
  expected_replacements: 1
})

Example 2: Multiple edits
--------------------------
Filesystem:edit_file({
  path: "config.js",
  edits: [
    {
      oldText: "debug: false",
      newText: "debug: true"
    },
    {
      oldText: "port: 3000",
      newText: "port: 8080"
    }
  ]
})
  `);
}

async function combinedDemo() {
  console.log('\n🎯 COMBINED WORKFLOW DEMO\n');
  console.log('=' . repeat(50));
  
  console.log(`
Real-world Workflow: Finding and fixing all TODOs
--------------------------------------------------

Step 1: Search for TODOs
\`\`\`javascript
const search = terminal:start_search({
  path: "C:\\\\palantir\\\\math",
  pattern: "TODO",
  searchType: "content",
  filePattern: "*.js"
})
\`\`\`

Step 2: Get results
\`\`\`javascript
const results = terminal:get_more_search_results({
  sessionId: search.sessionId
})
\`\`\`

Step 3: Fix each TODO
\`\`\`javascript
for (const result of results) {
  terminal:edit_block({
    file_path: result.file,
    old_string: result.line,
    new_string: "// FIXED: " + result.line
  })
}
\`\`\`

Step 4: Verify changes
\`\`\`javascript
terminal:start_process({
  command: "git diff",
  timeout_ms: 5000
})
\`\`\`
  `);
}

rl.question('Select demo (1-5): ', async (answer) => {
  switch(answer) {
    case '1':
      await filesystemDemo();
      break;
    case '2':
      await searchDemo();
      break;
    case '3':
      await processDemo();
      break;
    case '4':
      await editDemo();
      break;
    case '5':
      await combinedDemo();
      break;
    default:
      console.log('Invalid selection');
  }
  
  console.log('\n✅ Demo complete!');
  console.log('📖 Full documentation: COMPLETE_TOOLS_GUIDE.md');
  rl.close();
});