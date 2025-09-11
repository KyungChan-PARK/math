#!/usr/bin/env node

import SessionRecoverySystem from './session-recovery-system.js';

const recovery = new SessionRecoverySystem();
recovery.autoSaveCheckpoints().then(() => {
    console.log('Session recovery system started');
}).catch(console.error);