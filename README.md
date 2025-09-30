# NX Jest Coverage Action

[![GitHub Super-Linter](https://github.com/AdelanteFinancialHoldings/nx-jest-coverage-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/AdelanteFinancialHoldings/nx-jest-coverage-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/AdelanteFinancialHoldings/nx-jest-coverage-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/AdelanteFinancialHoldings/nx-jest-coverage-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/AdelanteFinancialHoldings/nx-jest-coverage-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/AdelanteFinancialHoldings/nx-jest-coverage-action/actions/workflows/codeql-analysis.yml)
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
- 🎨 Color-coded badges based on coverage thresholds (red < 70%, yellow < 80%,
  green ≥ 80%)

## How It Works

1. **Detects Affected Projects**: Uses NX to identify projects affected by PR
   changes
1. **Filters Jest Projects**: Only processes projects configured with Jest as
   their test executor
1. **Runs Tests** (optional): Can run tests before generating the report if
   `run-tests: true`
1. **Collects Coverage Data**: Reads Jest coverage summaries from each project
1. **Generates Report**: Creates a formatted Markdown report with badges and
   tables
1. **Posts to PR**: Updates or creates a PR comment with the coverage report

## Prerequisites

- NX workspace (v15+) with Jest configured for testing
- Jest configured with `json-summary` coverage reporter in your Jest config
- GitHub Actions workflow with pull request permissions

## Usage

Add this action to your GitHub workflow:

```yaml
name: Coverage Report

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

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
        uses: AdelanteFinancialHoldings/nx-jest-coverage-action@v1
        with:
          workspace-location: '.'
          run-tests: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Jest Configuration

To use this action, ensure your Jest configuration includes the `json-summary`
reporter. Add this to your `jest.config.js` or project-level Jest configuration:

```javascript
module.exports = {
  // ... other config
  coverageReporters: ['json-summary', 'text', 'lcov']
  // ... other config
}
```

The action will automatically detect the coverage directory from your Jest
configuration.

## Inputs

This action accepts the following inputs:

| Name                 | Description                                                      | Required | Default                                   |
| -------------------- | ---------------------------------------------------------------- | -------- | ----------------------------------------- |
| `workspace-location` | The location of the NX workspace relative to the repository root | false    | `.`                                       |
| `github-token`       | GitHub token for posting PR comments                             | false    | `${{ github.token }}`                     |
| `run-tests`          | Whether to run the test target before building the report        | false    | `false`                                   |
| `report-anchor`      | Anchor key used to upsert the PR comment with the report         | false    | `<!-- nx-jest-coverage-action report -->` |

## Outputs

| Name               | Description                                                           |
| ------------------ | --------------------------------------------------------------------- |
| `coverage-summary` | JSON string containing the coverage summary for all affected projects |

## PR Comment Example

When the action runs successfully, it will post a comment to your PR with
coverage information for all affected projects. The comment includes:

- **Coverage badges** for statements, branches, functions, and lines
  (color-coded based on coverage percentage)
- **Coverage summary** showing average coverage across all affected projects
- **Project details** in collapsible sections for each affected project

Example format:

```markdown
# Jest Coverage Report 🧪📊

![statements: 85%](https://img.shields.io/badge/statements-85%25-yellow)
![branches: 75%](https://img.shields.io/badge/branches-75%25-yellow)
![functions: 90%](https://img.shields.io/badge/functions-90%25-green)
![lines: 85%](https://img.shields.io/badge/lines-85%25-yellow)

## Coverage Summary

| Statements | Branches | Functions | Lines |
| ---------- | -------- | --------- | ----- |
| 85%        | 75%      | 90%       | 85%   |

## Project Coverage Details

<details>
<summary>project-a</summary>

| Statements | Branches | Functions | Lines |
| ---------- | -------- | --------- | ----- |
| 85%        | 75%      | 90%       | 85%   |

</details>

<sub>Last updated: 2024-01-01T00:00:00.000Z</sub>
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development

1. Clone this repository
1. Install dependencies with `npm ci`
1. Make your changes
1. Verify everything is working with `npm run all`
1. Commit your changes following
   [Conventional Commits](https://www.conventionalcommits.org/)

### Code of Conduct

This project follows the
[Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
