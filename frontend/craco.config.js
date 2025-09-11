export default {
  jest: {
    configure: {
      moduleNameMapper: {
        '^three$': '<rootDir>/src/test-utils/three-mocks.ts',
        '^three/(.*)$': '<rootDir>/src/test-utils/three-mocks.ts',
        '^@react-three/fiber$': '<rootDir>/src/test-utils/three-mocks.ts',
        '^@react-three/drei$': '<rootDir>/src/test-utils/three-mocks.ts',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/test-utils/fileMock.ts'
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            jsx: 'react',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true
          }
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      transformIgnorePatterns: [
        'node_modules/(?!(three|@react-three|@react-spring|@use-gesture|zustand|leva|maath|meshline|miniflare|suspend-react|tunnel-rat|uuid)/)'
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
        '<rootDir>/src/**/*.{spec,test}.{ts,tsx}'
      ],
      collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.tsx',
        '!src/reportWebVitals.ts',
        '!src/test-utils/**'
      ],
      coverageThreshold: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    }
  },
  webpack: {
    configure: (webpackConfig) => {
      // Add support for mjs files
      webpackConfig.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      });
      
      // Resolve fallbacks for Node.js core modules
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          ...webpackConfig.resolve?.fallback,
          fs: false,
          path: false,
          crypto: false
        }
      };
      
      return webpackConfig;
    }
  }
};
