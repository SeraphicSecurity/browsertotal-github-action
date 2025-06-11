#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 BrowserTotal GitHub Action - Pre-publish Check\n');

let errors = [];
let warnings = [];

// Check 1: Verify action.yml exists and has required fields
console.log('📋 Checking action.yml...');
try {
  const actionYml = fs.readFileSync('action.yml', 'utf8');
  const requiredFields = ['name:', 'description:', 'author:', 'branding:', 'runs:'];
  
  requiredFields.forEach(field => {
    if (!actionYml.includes(field)) {
      errors.push(`Missing required field '${field}' in action.yml`);
    }
  });
  
  if (actionYml.includes('your-username')) {
    warnings.push('Found placeholder "your-username" in action.yml');
  }
  
  console.log('✅ action.yml structure looks good');
} catch (e) {
  errors.push('action.yml file not found');
}

// Check 2: Verify package.json version
console.log('\n📦 Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ Current version: ${packageJson.version}`);
  
  if (!packageJson.repository || !packageJson.repository.url.includes('github.com')) {
    warnings.push('Repository URL not properly set in package.json');
  }
} catch (e) {
  errors.push('Error reading package.json');
}

// Check 3: Verify dist folder exists
console.log('\n🔨 Checking build output...');
if (!fs.existsSync('dist/index.js')) {
  errors.push('dist/index.js not found. Run "npm run build" first');
} else {
  const stats = fs.statSync('dist/index.js');
  const ageInHours = (Date.now() - stats.mtime) / (1000 * 60 * 60);
  
  if (ageInHours > 24) {
    warnings.push('dist/index.js is more than 24 hours old. Consider rebuilding');
  }
  
  console.log('✅ dist/index.js found');
}

// Check 4: Verify dist is not gitignored
console.log('\n📄 Checking .gitignore...');
try {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (gitignore.includes('dist/') && !gitignore.includes('# dist/')) {
    errors.push('dist/ is gitignored. It must be committed for GitHub Actions');
  } else {
    console.log('✅ dist/ is not gitignored');
  }
} catch (e) {
  warnings.push('.gitignore file not found');
}

// Check 5: Check for uncommitted changes
console.log('\n🔍 Checking git status...');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    warnings.push('You have uncommitted changes:\n' + gitStatus);
  } else {
    console.log('✅ Working directory is clean');
  }
} catch (e) {
  warnings.push('Could not check git status');
}

// Check 6: Verify README has proper documentation
console.log('\n📖 Checking README...');
try {
  const readme = fs.readFileSync('README.md', 'utf8');
  
  if (readme.includes('your-username')) {
    warnings.push('Found placeholder "your-username" in README.md');
  }
  
  if (!readme.includes('## Usage') && !readme.includes('## Quick Start')) {
    warnings.push('README.md should include usage examples');
  }
  
  console.log('✅ README.md found');
} catch (e) {
  errors.push('README.md not found');
}

// Check 7: Look for a LICENSE file
console.log('\n⚖️  Checking LICENSE...');
if (!fs.existsSync('LICENSE')) {
  warnings.push('LICENSE file not found. Consider adding one');
} else {
  console.log('✅ LICENSE file found');
}

// Check 8: Verify logo exists
console.log('\n🖼️  Checking logo...');
if (!fs.existsSync('assets/256.png')) {
  errors.push('Logo file assets/256.png not found');
} else {
  console.log('✅ Logo file found');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Pre-publish Check Summary\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Your action is ready to publish.\n');
  console.log('Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Commit all changes including dist/');
  console.log('3. Create a new release on GitHub');
  console.log('4. Follow the marketplace publishing flow\n');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log(`❌ Found ${errors.length} error(s):\n`);
    errors.forEach(err => console.log(`   • ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  Found ${warnings.length} warning(s):\n`);
    warnings.forEach(warn => console.log(`   • ${warn}`));
  }
  
  console.log('\nPlease fix the errors before publishing.');
  process.exit(errors.length > 0 ? 1 : 0);
} 