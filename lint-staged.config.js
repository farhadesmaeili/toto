/** @type {import('lint-staged').Config} */
module.exports = {
  // Next.js frontend — ESLint + Prettier
  'toto-web/**/*.{ts,tsx}': ['eslint --fix --config eslint.config.mjs', 'prettier --write'],

  // NestJS backend — Prettier only until Phase 1 adds its own ESLint config
  'toto-api/**/*.ts': ['prettier --write'],

  // Root config files and shared assets
  '*.{js,cjs,mjs}': ['prettier --write'],
  '*.{json,md}': ['prettier --write'],
  '*.css': ['prettier --write'],
};
