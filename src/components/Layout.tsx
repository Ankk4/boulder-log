import { ReactNode } from 'react';
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
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { FocusModeProvider } from '../hooks/FocusModeProvider';
import { useFocusMode } from '../hooks/useFocusMode';
import { CONTENT_MAX_WIDTH } from '../theme/layout';

interface LayoutProps {
  children: ReactNode;
}

const LayoutShell = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const focus = useFocusMode();

  const getCurrentTab = (): number | false => {
    if (location.pathname.startsWith('/workouts')) return 1;
    if (location.pathname.startsWith('/session')) return 0;
    return false;
  };

  const goToTab = (value: number) => navigate(value === 0 ? '/session' : '/workouts');

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
                onChange={(_event, newValue: number) => goToTab(newValue)}
                textColor="inherit"
                indicatorColor="secondary"
                sx={{ ml: 2, minHeight: 48 }}
              >
                <Tab label="Session" />
                <Tab label="Timer" />
              </Tabs>
            )}
          </Toolbar>
        </AppBar>
      )}
      {/* Always the same Container element: swapping it out for bare children would
          remount the page and reset its state (e.g. the running timer). Focus mode
          only drops the width limit and padding. */}
      <Container
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
          <BottomNavigation
            showLabels
            value={getCurrentTab()}
            onChange={(_event, newValue: number) => goToTab(newValue)}
          >
            <BottomNavigationAction label="Session" icon={<FitnessCenter />} />
            <BottomNavigationAction label="Timer" icon={<Timer />} />
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
