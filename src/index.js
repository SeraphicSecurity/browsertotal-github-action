const core = require('@actions/core');
const github = require('@actions/github');
const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * Maps grade letters to numeric values for comparison
 */
const GRADE_VALUES = {
  'A': 5,
  'B': 4,
  'C': 3,
  'D': 2,
  'F': 1
};

module.exports = { GRADE_VALUES };

/**
 * Creates or updates a comment on the PR with scan results
 */
async function postPRComment(octokit, summary, scanResults) {
  const context = github.context;
  
  // Check if this is a PR event
  if (!context.payload.pull_request) {
    core.info('Not running in a pull request context, skipping PR comment');
    return;
  }

  const prNumber = context.payload.pull_request.number;
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  
  // Create a unique identifier for our comments
  const commentIdentifier = '<!-- BrowserTotal-scan-results -->';
  
  try {
    // Get existing comments
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber
    });
    
    // Find our previous comment if it exists
    const existingComment = comments.find(comment => 
      comment.body && comment.body.includes(commentIdentifier)
    );
    
    // Build the comment body
    const gradeEmoji = {
      'A': '🟢',
      'B': '🟡',
      'C': '🟠',
      'D': '🔴',
      'F': '🔴'
    };
    
    const commentBody = `${commentIdentifier}
<div align="center">
  <img src="https://raw.githubusercontent.com/SeraphicSecurity/browsertotal-github-action/master/assets/256.png" alt="BrowserTotal" width="128" height="128">
  
  # 🛡️ Browser Security Posture Scan Results
  
  ${gradeEmoji[scanResults.score.grade] || '⚪'} **Security Grade: ${scanResults.score.grade}**
</div>

${summary}

---
<details>
<summary>📊 View Full Results</summary>

\`\`\`json
${JSON.stringify(scanResults, null, 2)}
\`\`\`

</details>

---
<div align="center">
  <sub>🤖 Powered by <a href="https://browsertotal.com">BrowserTotal</a> • This comment is automatically updated on each commit</sub>
</div>`;
    
    if (existingComment) {
      // Update existing comment
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body: commentBody
      });
      core.info(`Updated existing PR comment`);
    } else {
      // Create new comment
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: commentBody
      });
      core.info(`Created new PR comment`);
    }
  } catch (error) {
    core.warning(`Failed to post PR comment: ${error.message}`);
  }
}

/**
 * Main function to run the browser posture scan
 */
async function run() {
  let browser = null;
  
  try {
    // Get inputs
    const outputFormat = core.getInput('output-format');
    const timeout = parseInt(core.getInput('timeout')) || 1800000;
    const browserType = core.getInput('browser').toLowerCase();
    const headless = core.getInput('headless') === 'true';
    const failThreshold = core.getInput('fail-on-low-score').toUpperCase();
    const commentOnPR = core.getInput('comment-on-pr') === 'true';
    const githubToken = core.getInput('github-token');

    // Validate inputs
    if (!['chrome', 'firefox', 'webkit'].includes(browserType)) {
      throw new Error(`Invalid browser type: ${browserType}. Must be chrome, firefox, or webkit.`);
    }

    if (!['json', 'summary', 'both'].includes(outputFormat)) {
      throw new Error(`Invalid output format: ${outputFormat}. Must be json, summary, or both.`);
    }

    // Install browsers if needed
    core.info(`Installing Playwright browsers...`);
    try {
      // Install only the browser we need to save time
      const browserMap = {
        'chrome': 'chromium',
        'firefox': 'firefox',
        'webkit': 'webkit'
      };
      const playwrightBrowser = browserMap[browserType];
      
      execSync(`npx playwright install ${playwrightBrowser}`, {
        stdio: 'inherit',
        env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '0' }
      });
      
      // Also install dependencies for the browser
      execSync(`npx playwright install-deps ${playwrightBrowser}`, {
        stdio: 'inherit'
      });
      
      core.info(`Browser ${playwrightBrowser} installed successfully`);
    } catch (installError) {
      core.warning(`Failed to install browser dependencies: ${installError.message}`);
      // Continue anyway, as the browser might already be installed
    }

    core.info(`Starting browser posture scan with ${browserType} browser...`);

    // Launch browser
    const browserOptions = {
      headless: headless,
      args: ['--deny-permission-prompts']
    };

    switch (browserType) {
      case 'chrome':
        browser = await chromium.launch(browserOptions);
        break;
      case 'firefox':
        browser = await firefox.launch(browserOptions);
        break;
      case 'webkit':
        browser = await webkit.launch(browserOptions);
        break;
    }

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // Set up result capture
    let scanResults = null;

    const _scanTask = {};

    _scanTask.promise = new Promise((resolve, reject) => {
      _scanTask.resolve = resolve;
      _scanTask.reject = reject;
    });


    // Listen for the scan_completed event
    await page.exposeFunction('captureScanResults', (results) => {
      scanResults = results;
      core.info('Scan completed event captured');
      _scanTask.resolve(results);
    });

    // Inject event listener with one-time execution
    await page.addInitScript(() => {
      let captured = false;
      const scanHandler = async (event) => {
        if (captured) return; // Prevent multiple captures
        captured = true;
        
        try {
          console.log('Scan completed event captured');
          await window.captureScanResults(event.detail);
          
          // Remove the listener after capturing
          window.removeEventListener('scan_complete', scanHandler);
        } catch (e) {
          console.error('Failed to capture scan results:', e);
        }
      };
      
      window.addEventListener('scan_complete', scanHandler);
    });

   

    // Navigate to the scan page
    core.info('Navigating to BrowserTotal scan page...');
    await page.goto('https://browsertotal.com/browser-posture-scan#automation=true', {
      timeout: timeout
    });

    await Promise.race([_scanTask.promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Scan timed out')), timeout))]);

    if (!scanResults) {
      throw new Error(`Scan did not complete within ${timeout}ms timeout`);
    }

    core.info('Scan completed successfully');
    
    // Clean up event listeners to prevent hanging
    await page.evaluate(() => {
      window.removeEventListener('scan_complete', window.captureScanResults);
    }).catch(() => {});

   

    // Validate results structure
    if (!scanResults.score || typeof scanResults.score.current !== 'number') {
      throw new Error('Invalid scan results: missing or invalid score data');
    }

    // Generate outputs
    core.setOutput('score', scanResults.score.current.toString());
    core.setOutput('max-score', scanResults.score.max.toString());
    core.setOutput('grade', scanResults.score.grade);
    core.setOutput('passed-count', scanResults.passedCount.toString());
    core.setOutput('failed-count', scanResults.failedCount.toString());
    core.setOutput('total-tests', scanResults.totalTests.toString());

    // Save results to file
    const resultsDir = path.join(process.env.GITHUB_WORKSPACE || '.', 'browsertotal-results');
    await fs.mkdir(resultsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(resultsDir, `scan-results-${timestamp}.json`);
    
    await fs.writeFile(resultsFile, JSON.stringify(scanResults, null, 2));
    core.setOutput('results-file', resultsFile);

    // Generate outputs based on format
    if (outputFormat === 'json' || outputFormat === 'both') {
      core.setOutput('results-json', JSON.stringify(scanResults));
    }

    let summary = '';
    if (outputFormat === 'summary' || outputFormat === 'both') {
      summary = generateSummary(scanResults);
      core.setOutput('summary', summary);
      
      // Also write summary to GitHub Action summary
      await core.summary
        .addHeading('Browser Posture Scan Results')
        .addRaw(`<div align="center"><img src="https://raw.githubusercontent.com/SeraphicSecurity/browsertotal-github-action/main/assets/256.png" alt="BrowserTotal" width="128" height="128"></div>`)
        .addRaw(summary)
        .addRaw(`<hr><div align="center"><sub>🤖 Powered by <a href="https://browsertotal.com">BrowserTotal</a></sub></div>`)
        .write();
    } else if (commentOnPR) {
      // Generate summary for PR comment even if not requested in output
      summary = generateSummary(scanResults);
    }

    // Post results to PR if enabled
    if (commentOnPR && githubToken) {
      try {
        const octokit = github.getOctokit(githubToken);
        await postPRComment(octokit, summary, scanResults);
      } catch (error) {
        core.warning(`Failed to initialize GitHub client for PR commenting: ${error.message}`);
      }
    }

    // Check if we should fail based on grade threshold
    if (failThreshold !== 'NONE' && GRADE_VALUES[failThreshold]) {
      const currentGradeValue = GRADE_VALUES[scanResults.score.grade];
      const thresholdValue = GRADE_VALUES[failThreshold];
      
      if (currentGradeValue < thresholdValue) {
        core.setFailed(`Security grade ${scanResults.score.grade} is below threshold ${failThreshold}`);
      }
    }

    // Log summary information
    core.info(`Security Grade: ${scanResults.score.grade}`);
    core.info(`Score: ${scanResults.score.current}/${scanResults.score.max}`);
    core.info(`Passed Tests: ${scanResults.passedCount}/${scanResults.totalTests}`);

  } catch (error) {
    core.setFailed(`Browser posture scan failed: ${error.message}`);
    
    // Try to capture a screenshot for debugging
    if (browser) {
      try {
        const page = (await browser.contexts())[0]?.pages()[0];
        if (page) {
          const screenshotPath = path.join(process.env.GITHUB_WORKSPACE || '.', 'error-screenshot.png');
          await page.screenshot({ path: screenshotPath });
          core.info(`Error screenshot saved to: ${screenshotPath}`);
        }
      } catch (screenshotError) {
        core.debug(`Failed to capture error screenshot: ${screenshotError.message}`);
      }
    }
  } finally {
    core.info('Exiting process in 4 seconds');
    setTimeout(() => {
      core.info('Exiting process');
      process.exit(0);
    }, 4000);
    // Clean up browser resources
    if (browser) {
      try {
        core.info('Closing browser...');
        
        // Close all pages and contexts first
        const contexts = browser.contexts();
        for (const context of contexts) {
          const pages = context.pages();
          for (const page of pages) {
            await page.close().catch(() => {});
          }
          await context.close().catch(() => {});
        }
        
        // Close the browser with a timeout
        await Promise.race([
          browser.close(),
          new Promise((resolve) => setTimeout(resolve, 5000))
        ]);
        
        core.info('Browser closed successfully');
      } catch (closeError) {
        core.warning(`Failed to close browser cleanly: ${closeError.message}`);
      }
    }
    
    
  }
}

/**
 * Generates a human-readable summary of the scan results
 */
function generateSummary(results) {
  const { score, passedCount, failedCount, totalTests } = results;
  const passRate = ((passedCount / totalTests) * 100).toFixed(1);
  
  let summary = `## Browser Security Posture Scan Summary\n\n`;
  summary += `**Grade:** ${score.grade}\n`;
  summary += `**Score:** ${score.current} / ${score.max}\n`;
  summary += `**Pass Rate:** ${passRate}% (${passedCount}/${totalTests} tests)\n\n`;
  
  // List failed tests
  if (failedCount > 0) {
    summary += `### Failed Tests (${failedCount})\n\n`;
    
    for (const [testName, testResult] of Object.entries(results.results)) {
      if (!testResult.passed) {
        summary += `- **${testName}**`;
        
        // Add brief details if available
        if (testResult.details?.message) {
          summary += `: ${testResult.details.message}`;
        }
        summary += '\n';
      }
    }
    summary += '\n';
  }
  
  // Top 5 highest scoring passed tests
  const passedTests = Object.entries(results.results)
    .filter(([_, result]) => result.passed)
    .slice(0, 5);
  
  if (passedTests.length > 0) {
    summary += `### Top Security Features (Sample)\n\n`;
    passedTests.forEach(([testName]) => {
      summary += `- ✅ ${testName}\n`;
    });
  }
  
  return summary;
}

if (require.main === module) {
  run();
}

module.exports.run = run;
module.exports.generateSummary = generateSummary;
module.exports.postPRComment = postPRComment; 