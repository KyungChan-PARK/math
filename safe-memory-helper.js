// Safe Memory Storage Helper
// Use this wrapper to prevent encoding issues when saving to memory

import { cleanForMemory } from './auto-prevention.js';

/**
 * Safely add observations to memory
 * Automatically cleans Korean characters and emojis
 */
export function safeMemoryAdd(observations) {
    const cleaned = observations.map(obs => {
        if (typeof obs === 'object' && obs.contents) {
            return {
                ...obs,
                contents: cleanForMemory(obs.contents)
            };
        }
        return cleanForMemory(obs);
    });
    
    // Use the actual memory:add_observations here
    // This is a wrapper that ensures clean data
    return cleaned;
}

/**
 * Example usage:
 * 
 * Instead of:
 * memory:add_observations([{
 *     entityName: "ChromaDB_Status",
 *     contents: ["ChromaDB 통합 완료 "]
 * }])
 * 
 * Use:
 * const safeObs = safeMemoryAdd([{
 *     entityName: "ChromaDB_Status", 
 *     contents: ["ChromaDB 통합 완료 "]
 * }]);
 * 
 * Result will be:
 * [{
 *     entityName: "ChromaDB_Status",
 *     contents: ["ChromaDB integration complete "]
 * }]
 */

console.log('Safe Memory Helper loaded - Use safeMemoryAdd() for encoding-safe storage');

export default safeMemoryAdd;
