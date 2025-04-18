import { ReactNode } from 'react';
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, FitnessCenter, List, History } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentTab = () => {
    switch (location.pathname) {
      case '/':
        return 0;
      case '/session':
        return 1;
      case '/sessions':
        return 2;
      case '/problems':
        return 3;
      default:
        return 0;
    }
  };

  return (
    <Box sx={{ pb: 7 }}>
      {children}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={getCurrentTab()}
          onChange={(event, newValue) => {
            switch (newValue) {
              case 0:
                navigate('/');
                break;
              case 1:
                navigate('/session');
                break;
              case 2:
                navigate('/sessions');
                break;
              case 3:
                navigate('/problems');
                break;
            }
          }}
        >
          <BottomNavigationAction label="Home" icon={<Home />} />
          <BottomNavigationAction label="Session" icon={<FitnessCenter />} />
          <BottomNavigationAction label="Sessions" icon={<History />} />
          <BottomNavigationAction label="Problems" icon={<List />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default Layout; 