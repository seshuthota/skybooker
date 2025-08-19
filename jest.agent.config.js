/** @type {import('jest').Config} */
const base = require('./jest.config.js')

module.exports = {
  ...base,
  // Focus only on the agent + tools tests we added
  testMatch: [
    '<rootDir>/__tests__/realtime-client.test.ts',
    '<rootDir>/__tests__/useRealtimeSession.test.tsx',
    '<rootDir>/__tests__/assistant-tools.test.ts',
  ],
  // Avoid collecting huge coverage in focused runs
  collectCoverageFrom: [],
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/setup-agent-env.ts'
  ],
}
