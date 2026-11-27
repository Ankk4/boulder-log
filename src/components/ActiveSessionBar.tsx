import { useEffect, useState } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import { FiberManualRecord } from '@mui/icons-material';
import { useLocation, useSearchParams } from 'react-router';
import { useCurrentSession } from '../db/index';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { formatElapsed, sessionStats } from '../utils/sessions';

const ActiveSessionBar = () => {
  const session = useCurrentSession();
  const navigate = useAppNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [now, setNow] = useState(() => Date.now());
  const active = session != null;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [active]);

  if (!session) return null;

  const stats = sessionStats(session);
  const onSessionPage = location.pathname === '/session' && searchParams.get('view') !== 'history';
  const count = (n: number, one: string, many: string) => `${String(n)} ${n === 1 ? one : many}`;
  const parts = [count(stats.problems, 'problem', 'problems'), count(stats.sends, 'send', 'sends')];
  if (onSessionPage) {
    parts.push(
      count(stats.attempts, 'attempt', 'attempts'),
      count(stats.flashes, 'flash', 'flashes'),
    );
  }

  return (
    <Box component="section" aria-label="Active session">
      <ButtonBase
        onClick={() => {
          navigate('/session');
        }}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
          width: '100%',
          columnGap: 1.5,
          rowGap: 0,
          px: 2,
          py: 0.5,
          bgcolor: 'primary.dark',
          color: 'primary.contrastText',
          textAlign: 'left',
        }}
      >
        <Box
          component="span"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            whiteSpace: 'nowrap',
          }}
        >
          Open session,
        </Box>
        <FiberManualRecord aria-hidden color="error" sx={{ fontSize: 12, alignSelf: 'center' }} />
        <Typography variant="body2" component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatElapsed(now - new Date(session.startTime).getTime())}
        </Typography>
        <Typography variant="body2" component="span">
          {parts.join(' · ')}
        </Typography>
      </ButtonBase>
    </Box>
  );
};

export default ActiveSessionBar;
