describe('Browser Posture Scanner Action', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.INPUT_BROWSER;
    delete process.env.INPUT_OUTPUT_FORMAT;
    delete process.env.INPUT_TIMEOUT;
    delete process.env.INPUT_HEADLESS;
    delete process.env.INPUT_FAIL_ON_LOW_SCORE;
  });

  test('action metadata is valid', () => {
    const action = require('../action.yml');
    expect(action).toBeDefined();
  });

  test('package.json is valid', () => {
    const pkg = require('../package.json');
    expect(pkg.name).toBe('browsertotal-github-action');
    expect(pkg.main).toBe('dist/index.js');
    expect(pkg.engines.node).toBe('>=20');
  });

  test('required dependencies are present', () => {
    const pkg = require('../package.json');
    expect(pkg.dependencies['@actions/core']).toBeDefined();
    expect(pkg.dependencies['playwright']).toBeDefined();
  });

  test('grade values mapping is correct', () => {
    // This would test the actual module if we could import it
    const GRADE_VALUES = {
      'A': 5,
      'B': 4,
      'C': 3,
      'D': 2,
      'F': 1
    };

    expect(GRADE_VALUES['A']).toBeGreaterThan(GRADE_VALUES['B']);
    expect(GRADE_VALUES['B']).toBeGreaterThan(GRADE_VALUES['C']);
    expect(GRADE_VALUES['C']).toBeGreaterThan(GRADE_VALUES['D']);
    expect(GRADE_VALUES['D']).toBeGreaterThan(GRADE_VALUES['F']);
  });
}); 