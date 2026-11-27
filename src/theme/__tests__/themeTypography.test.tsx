import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { createAppTheme } from '../theme';

describe('createAppTheme', () => {
  it('subtitle variants are not headings', () => {
    render(
      <ThemeProvider theme={createAppTheme('dark')}>
        <Typography variant="subtitle1">First</Typography>
        <Typography variant="subtitle2">Second</Typography>
        <Typography variant="h6">Real heading</Typography>
      </ThemeProvider>,
    );
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(screen.getByText('First').tagName).toBe('P');
    expect(screen.getByText('Second').tagName).toBe('P');
    expect(screen.getByText('Real heading').tagName).toBe('H6');
  });
});
