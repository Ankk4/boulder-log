import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Home from './pages/Home';
import Session from './pages/Session';
import Workouts from './pages/Workouts';
import WorkoutRun from './pages/WorkoutRun';
import { createAppTheme, DEFAULT_THEME_MODE } from './theme/theme';

const theme = createAppTheme(DEFAULT_THEME_MODE);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/session" element={<Session />} />
            <Route path="/sessions" element={<Navigate to="/session" replace />} />
            <Route path="/problems" element={<Navigate to="/session" replace />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/:id/run" element={<WorkoutRun />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
