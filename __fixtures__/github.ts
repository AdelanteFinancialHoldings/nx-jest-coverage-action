import type * as github from '@actions/github'
import { jest } from '@jest/globals'

// Context mock objects
export const mockContext = {
  eventName: 'pull_request',
  sha: '1234567890abcdef1234567890abcdef12345678',
  ref: 'refs/pull/1/merge',
  workflow: 'CI',
  action: 'run',
  actor: 'sebastiandg7',
  job: 'test',
  runNumber: 1,
  runId: 12345,
  apiUrl: 'https://api.github.com',
  serverUrl: 'https://github.com',
  graphqlUrl: 'https://api.github.com/graphql',
  payload: {
    pull_request: {
      number: 1
    }
  },
  repo: {
    owner: 'owner',
    repo: 'repo'
  },
  issue: {
    owner: 'owner',
    repo: 'repo',
    number: 1
  }
}

export const mockPRContext = {
  eventName: 'pull_request',
  sha: '1234567890abcdef1234567890abcdef12345678',
  ref: 'refs/pull/123/merge',
  workflow: 'CI',
  action: 'run',
  actor: 'sebastiandg7',
  job: 'test',
  runNumber: 1,
  runId: 12345,
  apiUrl: 'https://api.github.com',
  serverUrl: 'https://github.com',
  graphqlUrl: 'https://api.github.com/graphql',
  payload: {
    pull_request: {
      number: 123
    }
  },
  repo: {
    owner: 'sebastiandg7',
    repo: 'nx-jest-coverage-action'
  },
  issue: {
    owner: 'sebastiandg7',
    repo: 'nx-jest-coverage-action',
    number: 123
  }
}

export const mockNonPRContext = {
  eventName: 'push',
  sha: '1234567890abcdef1234567890abcdef12345678',
  ref: 'refs/heads/main',
  workflow: 'CI',
  action: 'run',
  actor: 'sebastiandg7',
  job: 'test',
  runNumber: 1,
  runId: 12345,
  apiUrl: 'https://api.github.com',
  serverUrl: 'https://github.com',
  graphqlUrl: 'https://api.github.com/graphql',
  payload: {},
  repo: {
    owner: 'sebastiandg7',
    repo: 'nx-jest-coverage-action'
  },
  issue: {
    owner: 'sebastiandg7',
    repo: 'nx-jest-coverage-action',
    number: 0
  }
}

export const mockComments = [
  {
    id: 1,
    body: 'Some comment'
  },
  {
    id: 2,
    body: '<!-- nx-jest-coverage-action report -->\nExisting report content'
  }
]

// GitHub client mock functions
export const getOctokit = jest.fn<typeof github.getOctokit>()

// Create mock GitHub client with jest mock functions
export const mockGitHubClient = {
  rest: {
    issues: {
      listComments: jest.fn(),
      createComment: jest.fn(),
      updateComment: jest.fn()
    }
  },
  request: jest.fn(),
  graphql: jest.fn(),
  log: jest.fn(),
  hook: {
    before: jest.fn(),
    after: jest.fn(),
    error: jest.fn(),
    wrap: jest.fn()
  },
  auth: jest.fn(),
  paginate: jest.fn()
}
