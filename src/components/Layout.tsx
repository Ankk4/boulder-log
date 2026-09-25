import { ReactNode } from 'react';
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
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
