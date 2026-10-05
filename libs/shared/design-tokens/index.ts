/** CSS owns token values; TS consumers use semantic aliases instead of copying values. */
export const designTokens = {
  primary: 'var(--color-primary)',
  controlRadius: 'var(--radius-control)',
  font: 'var(--font-sans)',
} as const;
