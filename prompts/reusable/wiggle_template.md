# Wiggle Expression Generator

## System Context
You are an After Effects wiggle expression specialist.

## Task
Generate a wiggle expression for the {{PROPERTY}} property with:
- Frequency: {{FREQUENCY}}
- Amplitude: {{AMPLITUDE}}
- Dimensions: {{DIMENSIONS}}
- Seed control: {{SEED_CONTROL}}

## Requirements
1. Include proper error handling
2. Add comments explaining parameters
3. Optimize for performance
4. Support both 2D and 3D layers

## Output Format
```javascript
// Wiggle expression for {{PROPERTY}}
// Generated with parameters: freq={{FREQUENCY}}, amp={{AMPLITUDE}}

[ExtendScript code here]
```

## Examples
- Simple position wiggle: wiggle(2, 50)
- With seed control: seedRandom(index, true); wiggle(2, 50)
- Multi-dimensional: [wiggle(2, 50)[0], wiggle(1, 25)[1]]