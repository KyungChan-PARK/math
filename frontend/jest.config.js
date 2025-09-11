export default {
  preset: 'react-scripts',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^three/examples/jsm/(.*)$': '<rootDir>/node_modules/three/examples/jsm/$1',
    '^three$': '<rootDir>/node_modules/three/build/three.cjs',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(three|@react-three|troika-three-text|drei)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.git/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/setupTests.ts',
    '!src/test-utils/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
  },
};
