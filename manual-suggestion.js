// LOLA Intent Learning - Manual Suggestion Retrieval
// Run this in browser console (F12) while on lola-math-intent.html

async function getSuggestion() {
    try {
        // Get current status
        const statusResponse = await fetch('http://localhost:8092/status');
        const status = await statusResponse.json();
        console.log('Current Status:', status);
        
        // Force analysis by submitting empty attempt with high attempt count
        const attemptData = {
            points: [[0.5, 0.5], [0.5, 0.5]],  // Dummy points
            velocity: [0],
            pressure: [1, 1],
            context: 'geometry',
            dimension: 2
        };
        
        // Submit and get suggestion
        const attemptResponse = await fetch('http://localhost:8092/attempt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attemptData)
        });
        
        const result = await attemptResponse.json();
        console.log('Analysis Result:', result);
        
        if (result.suggestion) {
            // Display suggestion
            mathSystem.showSuggestion(result.suggestion);
            document.getElementById('suggestion-status').textContent = 'Optimized result ready!';
            document.getElementById('suggestion-info').innerHTML = `
                <strong>Optimized Result Retrieved</strong><br>
                Type: ${result.suggestion.type}<br>
                Quality Score: ${(result.suggestion.quality_score * 100).toFixed(1)}%<br>
                ${result.suggestion.data.equation ? `Equation: ${result.suggestion.data.equation}` : ''}
            `;
            console.log('✅ Suggestion displayed on canvas!');
        } else {
            console.log('❌ No suggestion available yet. Need more attempts or higher confidence.');
        }
        
        return result;
        
    } catch (error) {
        console.error('Error getting suggestion:', error);
        console.log('Make sure the LOLA server is running on port 8092');
    }
}

// Run the function
getSuggestion();
