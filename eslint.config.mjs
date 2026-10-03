import tseslint from 'typescript-eslint';
import angular from '@angular-eslint/eslint-plugin';
import templateSignatures from '@angular-eslint/eslint-plugin-template';
import unusedImports from 'eslint-plugin-unused-imports';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
    {
        files: ['**/*.ts'],
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            'unused-imports': unusedImports,
            prettier: prettierPlugin,
            '@angular-eslint': angular,
        },
        languageOptions: {
            parser: tseslint.parser,
        },
        rules: {
            quotes: ['error', 'single', { avoidEscape: true }],
            semi: ['error', 'always'],

            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],

            '@angular-eslint/directive-selector': [
                'error',
                { type: 'attribute', prefix: 'app', style: 'camelCase' },
            ],
            '@angular-eslint/component-selector': [
                'error',
                { type: 'element', prefix: 'app', style: 'kebab-case' },
            ],

            '@typescript-eslint/no-explicit-any': 'warn',
            'prettier/prettier': ['error', { endOfLine: 'auto' }],
        },
    },
    {
        files: ['**/*.html'],
        plugins: {
            '@angular-eslint/template': templateSignatures,
        },
        languageOptions: {
            parser: await import('@angular-eslint/template-parser'),
        },
        rules: {
            '@angular-eslint/template/prefer-control-flow': 'error',
        },
    },

    prettierConfig
);
