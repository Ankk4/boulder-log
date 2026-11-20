import { ReactNode } from 'react';
import {
  AppBar,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Toolbar,
  Typography,
} from '@mui/material';
import { FitnessCenter, Timer } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentTab = () => {
    if (location.pathname.startsWith('/workouts')) return 1;
    return 0;
  };

  return (
    <Box sx={{ pb: 7 }}>
      <AppBar position="sticky" color="primary" elevation={0}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} width={24} height={24} alt="" />
          <Typography component="h1" variant="h6">
            Matside
          </Typography>
        </Toolbar>
      </AppBar>
      {children}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={getCurrentTab()}
          onChange={(_event, newValue) => {
            if (newValue === 0) {
              navigate('/session');
            } else {
              navigate('/workouts');
            }
          }}
        >
          <BottomNavigationAction label="Session" icon={<FitnessCenter />} />
          <BottomNavigationAction label="Timer" icon={<Timer />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default Layout;
