import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Session from './pages/Session';
import Workouts from './pages/Workouts';
import WorkoutRun from './pages/WorkoutRun';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/session" replace />} />
            <Route path="/session" element={<Session />} />
            <Route path="/sessions" element={<Navigate to="/session" replace />} />
            <Route path="/problems" element={<Navigate to="/session" replace />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/:id/run" element={<WorkoutRun />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
