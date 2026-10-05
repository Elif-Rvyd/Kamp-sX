module.exports = {
  presets: [require('./libs/shared/design-tokens/tailwind.preset.cjs')],
  content: ['./apps/shell/src/**/*.{html,ts}', './libs/shared/ui/**/*.{html,ts}'],
  darkMode: 'class',
};
