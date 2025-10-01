import { jest } from '@jest/globals'
import type * as child_process from 'child_process'

// Mock exec function
export const exec = jest.fn<typeof child_process.exec>()

// Mock NX graph output (old format for backward compatibility)
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

// Mock NX project details (new format from `nx show project`)
export const mockNxProjectDetails: Record<string, unknown> = {
  'project-a': {
    name: 'project-a',
    root: 'libs/project-a',
    targets: {
      test: {
        executor: '@nx/jest:jest'
      }
    }
  },
  'project-b': {
    name: 'project-b',
    root: 'libs/project-b',
    targets: {
      test: {
        executor: '@nx/jest:jest'
      }
    }
  },
  'project-c': {
    name: 'project-c',
    root: 'libs/project-c',
    targets: {
      test: {
        executor: '@nx/jest:jest'
      }
    }
  },
  'project-d': {
    name: 'project-d',
    root: 'libs/project-d',
    targets: {
      test: {
        executor: '@nrwl/jest:jest'
      }
    }
  },
  'project-e': {
    name: 'project-e',
    root: 'libs/project-e',
    targets: {
      test: {
        executor: 'some-other-executor'
      }
    }
  },
  'project-f': {
    name: 'project-f',
    root: 'libs/project-f'
    // No targets
  }
}
