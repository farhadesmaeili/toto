/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    'header-max-length': [2, 'always', 100],

    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],

    // Warn (not error) if scope is outside the known list — new scopes are fine
    'scope-enum': [
      1,
      'always',
      [
        'auth',
        'rounds',
        'matches',
        'tickets',
        'wallet',
        'prizes',
        'gateway',
        'web',
        'api',
        'ci',
        'deploy',
        'deps',
        'docker',
        'security',
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],

    // Conventional Commits standard: subject is lower-case
    'subject-case': [2, 'always', 'lower-case'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-empty': [2, 'never'],

    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
  },
};
