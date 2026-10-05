module.exports = {
  theme: {
    extend: {
      colors: Object.fromEntries(
        [
          'bg',
          'surface',
          'surface-alt',
          'text',
          'muted',
          'primary',
          'on-primary',
          'accent',
          'border',
          'success',
          'danger',
          'indigo',
          'yellow',
          'coral',
        ].map((name) => [name, `var(--color-${name})`]),
      ),
      fontFamily: { sans: ['var(--font-sans)'], mono: ['var(--font-mono)'] },
      borderRadius: { control: 'var(--radius-control)', panel: 'var(--radius-panel)' },
      maxWidth: { page: 'var(--page-max)' },
    },
  },
};
