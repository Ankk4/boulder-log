import { Box, Typography, Button, Paper } from '@mui/material';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { currentSession } = useAppContext();
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to BoulderLog
      </Typography>
      
      {currentSession ? (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Current Session</Typography>
          <Typography>Started: {new Date(currentSession.startTime).toLocaleTimeString()}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mt: 2 }}
            onClick={() => navigate('/session')}
          >
            Continue Session
          </Button>
        </Paper>
      ) : (
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth 
          sx={{ mb: 2 }}
          onClick={() => navigate('/session')}
        >
          Start New Session
        </Button>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Quick Actions</Typography>
        <Button 
          variant="outlined" 
          fullWidth 
          sx={{ mb: 1 }}
          onClick={() => navigate('/problems')}
        >
          View Problems
        </Button>
        <Button 
          variant="outlined" 
          fullWidth 
          sx={{ mb: 1 }}
          onClick={() => navigate('/projects')}
        >
          View Projects
        </Button>
      </Paper>
    </Box>
  );
};

export default Home; 