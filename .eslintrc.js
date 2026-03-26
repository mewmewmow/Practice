// ESLint configuration for SmartBook SaaS
module.exports = {
  env: {
    node: true,
    es2021: true,
    browser: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'only-multiline'],
    'indent': ['error', 2],
    'keyword-spacing': ['error'],
    'space-infix-ops': ['error'],
    'space-before-blocks': ['error'],
    'no-var': ['error'],
    'prefer-const': ['error'],
  },
};
