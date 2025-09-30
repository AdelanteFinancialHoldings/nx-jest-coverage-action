import { jest } from '@jest/globals'
import type * as child_process from 'child_process'

// Mock exec function
export const exec = jest.fn<typeof child_process.exec>()

// Mock NX graph output
export const mockNxGraphOutput = {
  graph: {
    nodes: {
      'project-a': {
        name: 'project-a',
        type: 'lib',
        data: {
          root: 'libs/project-a',
          targets: {
            test: {
              executor: '@nx/jest:jest'
            }
          }
        }
      },
      'project-b': {
        name: 'project-b',
        type: 'lib',
        data: {
          root: 'libs/project-b',
          targets: {
            test: {
              executor: '@nx/jest:jest'
            }
          }
        }
      },
      'project-c': {
        name: 'project-c',
        type: 'lib',
        data: {
          root: 'libs/project-c',
          targets: {
            test: {
              executor: '@nx/jest:jest'
            }
          }
        }
      },
      'project-d': {
        name: 'project-d',
        type: 'lib',
        data: {
          root: 'libs/project-d',
          targets: {
            test: {
              executor: '@nrwl/jest:jest'
            }
          }
        }
      },
      'project-e': {
        name: 'project-e',
        type: 'lib',
        data: {
          root: 'libs/project-e',
          targets: {
            test: {
              executor: 'some-other-executor'
            }
          }
        }
      },
      'project-f': {
        name: 'project-f',
        type: 'lib',
        data: {
          root: 'libs/project-f'
          // No targets
        }
      }
    }
  }
}
