import { MouseEvent, ReactNode } from 'react';
import {
  AppBar,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Container,
  Link,
  Paper,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FitnessCenter, Timer } from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router';
import { FocusModeProvider } from '../hooks/FocusModeProvider';
import { useFocusMode } from '../hooks/useFocusMode';
import { CONTENT_MAX_WIDTH } from '../theme/layout';

interface LayoutProps {
  children: ReactNode;
}

const skipLinkSx = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  m: '-1px',
  p: 0,
  border: 0,
  '&:focus-visible': {
    width: 'auto',
    height: 'auto',
    overflow: 'visible',
    clip: 'auto',
    m: 0,
    p: 1,
    top: 8,
    left: 8,
    zIndex: 'tooltip',
    bgcolor: 'background.paper',
    color: 'text.primary',
  },
} as const;

const LayoutShell = ({ children }: LayoutProps) => {
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const focus = useFocusMode();

  const getCurrentTab = (): number | false => {
    if (location.pathname.startsWith('/workouts')) return 1;
    if (location.pathname.startsWith('/session')) return 0;
    return false;
  };

  // MUI's Tab is role="tab" with roving tabindex; as links they need neither.
  const tabLinkProps = (to: string, index: number) => ({
    component: RouterLink,
    to,
    role: undefined,
    tabIndex: 0,
    'aria-selected': undefined,
    'aria-current': getCurrentTab() === index ? ('page' as const) : undefined,
  });

  const skipToMain = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    document.getElementById('main-content')?.focus();
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {!focus && (
        <Box component="a" href="#main-content" onClick={skipToMain} sx={skipLinkSx}>
          Skip to main content
        </Box>
      )}
      {!focus && (
        <AppBar position="sticky" color="primary" elevation={0}>
          <Toolbar variant="dense" sx={{ gap: 1 }}>
            <Link
              component={RouterLink}
              to="/"
              color="inherit"
              underline="none"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <img src={`${import.meta.env.BASE_URL}favicon.svg`} width={24} height={24} alt="" />
              <Typography component="h1" variant="h6">
                Matside
              </Typography>
            </Link>
            {isDesktop && (
              <Tabs
                value={getCurrentTab()}
                component="nav"
                slotProps={{ root: { 'aria-label': 'Main' }, list: { role: undefined } }}
                textColor="inherit"
                indicatorColor="secondary"
                sx={{ ml: 2, minHeight: 48 }}
              >
                <Tab {...tabLinkProps('/session', 0)} label="Session" />
                <Tab {...tabLinkProps('/workouts', 1)} label="Timer" />
              </Tabs>
            )}
          </Toolbar>
        </AppBar>
      )}
      {/* Always the same Container element: swapping it out for bare children would
          remount the page and reset its state (e.g. the running timer). Focus mode
          only drops the width limit and padding. */}
      <Container
        component="main"
        id="main-content"
        tabIndex={-1}
        maxWidth={false}
        disableGutters={focus}
        sx={
          focus
            ? { maxWidth: 'none' }
            : {
                maxWidth: CONTENT_MAX_WIDTH,
                px: { xs: 2, md: 3 },
                py: 2,
                pb: isDesktop ? 2 : 'calc(56px + env(safe-area-inset-bottom))',
              }
        }
      >
        {children}
      </Container>
      {!focus && !isDesktop && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            pb: 'env(safe-area-inset-bottom)',
          }}
          elevation={3}
        >
          <BottomNavigation component="nav" aria-label="Main" showLabels value={getCurrentTab()}>
            <BottomNavigationAction
              component={RouterLink}
              to="/session"
              aria-current={getCurrentTab() === 0 ? 'page' : undefined}
              label="Session"
              icon={<FitnessCenter />}
            />
            <BottomNavigationAction
              component={RouterLink}
              to="/workouts"
              aria-current={getCurrentTab() === 1 ? 'page' : undefined}
              label="Timer"
              icon={<Timer />}
            />
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
};

const Layout = ({ children }: LayoutProps) => (
  <FocusModeProvider>
    <LayoutShell>{children}</LayoutShell>
  </FocusModeProvider>
);

export default Layout;
