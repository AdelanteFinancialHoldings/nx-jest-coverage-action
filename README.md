# NX Jest Coverage Action

[![GitHub Super-Linter](https://github.com/sebastiandg7/nx-jest-coverage-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/sebastiandg7/nx-jest-coverage-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/sebastiandg7/nx-jest-coverage-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/sebastiandg7/nx-jest-coverage-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/sebastiandg7/nx-jest-coverage-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/sebastiandg7/nx-jest-coverage-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action that generates Jest test coverage reports for affected projects
in NX workspaces and posts them as PR comments. This action helps you track code
coverage changes across your monorepo projects.

## Features

- 📊 Automatically generates coverage reports for affected projects in your NX
  workspace
- 🔍 Detects projects using Jest as their test executor
- 💬 Posts coverage reports as PR comments with beautiful badges
- 📈 Calculates average coverage metrics across all affected projects
- 🔄 Updates existing PR comments to avoid cluttering your PRs

## Prerequisites

- NX workspace with Jest configured for testing
- Jest configured with `json-summary` coverage reporter

## Usage

Add this action to your GitHub workflow:

```yaml
name: Coverage Report

on:
  pull_request:
    branches: [main]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate coverage report
        uses: sebastiandg7/nx-jest-coverage-action@v1
        with:
          workspace-location: '.'
          run-tests: true
          package-manager: 'npm' # Options: npm, yarn, pnpm
```

## Inputs

This action accepts the following inputs:

| Name                        | Description                                                      | Required | Default                                   |
| --------------------------- | ---------------------------------------------------------------- | -------- | ----------------------------------------- |
| `workspace-location`        | The location of the NX workspace relative to the repository root | No       | `.`                                       |
| `affected-projects-command` | Custom command to detect affected projects                       | No       | `nx affected -t=test --graph=stdout`      |
| `run-tests`                 | Whether to run the test target before building the report        | No       | `false`                                   |
| `report-anchor`             | Anchor key used to upsert the PR comment with the report         | No       | `<!-- nx-jest-coverage-action report -->` |
| `package-manager`           | Package manager to use for running NX commands (npm, yarn, pnpm) | No       | `npm`                                     |

## Outputs

| Name               | Description                                                           |
| ------------------ | --------------------------------------------------------------------- |
| `coverage-summary` | JSON string containing the coverage summary for all affected projects |

## PR Comment Example

When the action runs successfully, it will post a comment to your PR with
coverage information for all affected projects. The comment will look similar to
this:

```
# NX Jest Coverage Report

## Summary

| Project | Statements | Branches | Functions | Lines |
|---------|------------|----------|-----------|-------|
| project-a | 95.2% | 87.5% | 100% | 94.7% |
| project-b | 98.7% | 92.3% | 97.8% | 98.6% |
| Average | 96.95% | 89.9% | 98.9% | 96.65% |
```

_Note: Replace this with an actual screenshot when available._

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development

1. Clone this repository
2. Install dependencies with `npm ci`
3. Make your changes
4. Run tests with `npm test`
5. Build the action with `npm run build`
6. Commit your changes following
   [Conventional Commits](https://www.conventionalcommits.org/)

### Code of Conduct

This project follows the
[Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
