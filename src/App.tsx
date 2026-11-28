import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import History from './pages/History';
import Settings from './pages/Settings';
import Session from './pages/Session';
import SessionDetail from './pages/SessionDetail';
import Workouts from './pages/Workouts';
import WorkoutRun from './pages/WorkoutRun';
import { createAppTheme, DEFAULT_THEME_MODE } from './theme/theme';

const theme = createAppTheme(DEFAULT_THEME_MODE);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/session" element={<Session />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/sessions/:id" element={<SessionDetail />} />
            <Route path="/sessions" element={<Navigate to="/session" replace />} />
            <Route path="/problems" element={<Navigate to="/session" replace />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/:id/run" element={<WorkoutRun />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
