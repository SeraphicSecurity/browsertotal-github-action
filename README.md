# Browser Posture Scanner GitHub Action

<div align="center">
  <img src="assets/256.png" alt="BrowserTotal Logo" width="128" height="128">
  
  [![GitHub Marketplace](https://img.shields.io/badge/Marketplace-BrowserTotal%20Posture%20Scanner-blue.svg?colorA=24292e&colorB=0366d6&style=flat&longCache=true&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAM6wAADOsB5dZE0gAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAERSURBVCiRhZG/SsMxFEZPfsVJ61jbxaF0cRQRcRJ9hlYn30IHN/+9iquDCOIsblIrOjqKgy5aKoJQj4O3EEtbPwhJbr6Te28CmdSKeqzeqr0YbfVIrTBKakvtOl5dtTkK+v4HfA9PEyBFCY9AGVgCBLaBp1jPAyfAJ/AAdIEG0dNAiyP7+K1qIfMdonZic6+WJoBJvQlvuwDqcXadUuqPA1NKAlexbRTAIMvMOCjTbMwl1LtI/6KWJ5Q6rT6Ht1MA58AX8Apcqqt5r2qhrgAXQC3CZ6i1+KMd9TRu3MvA3aH/fFPnBodb6oe6HM8+lYHrGdRXW8M9bMZtPXUji69lmf5Cmamq7quNLFZXD9Rq7v0Bpc1o/tp0fisAAAAASUVORK5CYII=)](https://github.com/marketplace/actions/browsertotal-posture-scanner)
</div>

A GitHub Action that performs comprehensive security posture scanning of web browsers using [BrowserTotal](https://browsertotal.com). This action launches a real browser instance, navigates to BrowserTotal's scanner, and collects detailed security assessment results.

## Features

- 🛡️ **Comprehensive Security Scanning**: Tests 130+ browser security features
- 🌐 **Multi-Browser Support**: Works with Chrome, Firefox, and WebKit
- 📊 **Detailed Results**: Provides security grades, scores, and detailed test results
- 🔄 **CI/CD Integration**: Seamlessly integrates with GitHub Actions workflows
- 📈 **Actionable Insights**: Identifies security weaknesses and provides recommendations
- 🎯 **Threshold-Based Failing**: Can fail builds based on security grade thresholds
- 💬 **PR Comments**: Automatically posts scan results as comments on pull requests

## Quick Start

```yaml
- name: Browser Security Scan
  uses: SeraphicSecurity/browsertotal-github-action@v1
  with:
    browser: chrome
    output-format: both
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `browser` | Browser to use for scanning (`chrome`, `firefox`, or `webkit`) | No | `chrome` |
| `output-format` | Output format for results (`json`, `summary`, or `both`) | No | `json` |
| `timeout` | Maximum time to wait for scan completion (milliseconds) | No | `1800000` |
| `headless` | Run browser in headless mode (`true`/`false`) | No | `false` |
| `fail-on-low-score` | Fail if grade is below threshold (`A`, `B`, `C`, `D`, `F`, or `none`) | No | `none` |
| `comment-on-pr` | Post scan results as a comment on pull requests (`true`/`false`) | No | `true` |
| `github-token` | GitHub token for PR commenting (defaults to `github.token`) | No | `${{ github.token }}` |

## Outputs

| Output | Description |
|--------|-------------|
| `score` | Current security score |
| `max-score` | Maximum possible security score |
| `grade` | Security grade (A-F) |
| `passed-count` | Number of passed security tests |
| `failed-count` | Number of failed security tests |
| `total-tests` | Total number of security tests |
| `results-json` | Full scan results in JSON format |
| `results-file` | Path to the saved results file |
| `summary` | Human-readable summary of the scan results |

## Usage Examples

### Basic Security Scan

```yaml
name: Security Scan
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Browser Security Scan
        uses: SeraphicSecurity/browsertotal-github-action@v1
        with:
          browser: chrome
          output-format: summary
```

### Multi-Browser Testing

```yaml
name: Multi-Browser Security Testing
on: [push]

jobs:
  browser-security:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      
      - name: Security Scan - ${{ matrix.browser }}
        uses: SeraphicSecurity/browsertotal-github-action@v1
        with:
          browser: ${{ matrix.browser }}
          output-format: both
          
      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: security-results-${{ matrix.browser }}
          path: browsertotal-results/
```

### Enforce Security Standards

```yaml
name: Security Gate
on: [pull_request]

jobs:
  security-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Browser Security Gate
        uses: SeraphicSecurity/browsertotal-github-action@v1
        with:
          browser: chrome
          fail-on-low-score: B  # Fail if grade is below B
          output-format: both
```

### Pull Request Comments

The action automatically posts scan results as comments on pull requests. This feature is enabled by default.

```yaml
name: PR Security Check
on: [pull_request]

jobs:
  pr-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Browser Security Scan with PR Comment
        uses: SeraphicSecurity/browsertotal-github-action@v1
        with:
          browser: chrome
          output-format: summary
          comment-on-pr: true  # This is the default
          github-token: ${{ github.token }}  # This is the default
```

To disable PR comments:

```yaml
      - name: Browser Security Scan without PR Comment
        uses: SeraphicSecurity/browsertotal-github-action@v1
        with:
          browser: chrome
          comment-on-pr: false
```

The PR comment includes:
- Security grade with visual indicators (🟢 A, 🟡 B, 🟠 C, 🔴 D/F)
- Summary of passed/failed tests
- Expandable section with full JSON results
- Automatic updates on new commits
- BrowserTotal logo and branding

### Advanced Analysis with JSON Output

```yaml
name: Security Analysis
on: [push]

jobs:
  analyze-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Security Scan
        id: scan
        uses: SeraphicSecurity/browsertotal-github-action@v1
        with:
          browser: chrome
          output-format: json
          
      - name: Process Results
        run: |
          echo "Security Grade: ${{ steps.scan.outputs.grade }}"
          echo "Score: ${{ steps.scan.outputs.score }}/${{ steps.scan.outputs.max-score }}"
          echo "Failed Tests: ${{ steps.scan.outputs.failed-count }}"
          
          # Parse JSON results for custom analysis
          echo '${{ steps.scan.outputs.results-json }}' | jq '.results | to_entries | map(select(.value.passed == false)) | .[].key'
```

### Scheduled Security Monitoring

```yaml
name: Weekly Security Check
on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight
  workflow_dispatch:

jobs:
  security-monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Weekly Security Scan
        uses: SeraphicSecurity/browsertotal-github-action@v1
        with:
          browser: chrome
          output-format: both
          timeout: 120000  # 2 minutes for thorough scan
          
      - name: Create Issue on Low Score
        if: ${{ steps.scan.outputs.grade == 'C' || steps.scan.outputs.grade == 'D' || steps.scan.outputs.grade == 'F' }}
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Browser Security Score Alert',
              body: `Security scan detected grade ${steps.scan.outputs.grade}. Please review the security posture.`
            })
```

## Security Tests Coverage