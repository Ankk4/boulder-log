import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RatingPicker from './RatingPicker';
import { LIMITS, sanitizeGoals, sanitizeNotes } from '../utils/validation';
import type { PreSessionData } from '../types';

interface PreSessionFormProps {
  value?: PreSessionData;
  onChange: (data: PreSessionData) => void;
  lastWorkOn?: string[];
}

type RatingField = 'sleepQuality' | 'energyLevel' | 'fingerSoreness' | 'motivation' | 'restDays';

const emptyData: PreSessionData = { goals: [], additionalNotes: '' };

const summarize = (parts: (string | undefined)[]): string => {
  const set = parts.filter((p): p is string => p !== undefined);
  return set.length > 0 ? set.join(' · ') : 'Not recorded';
};

const num = (label: string, v: number | undefined, suffix = '') =>
  v === undefined ? undefined : `${label} ${String(v)}${suffix}`;

const physicalSummary = (d: PreSessionData): string =>
  summarize([
    num('Sleep', d.sleepQuality),
    num('Energy', d.energyLevel),
    num('Fingers', d.fingerSoreness),
    num('Rest', d.restDays, 'd'),
  ]);

const mentalSummary = (d: PreSessionData): string =>
  summarize([
    num('Motivation', d.motivation),
    d.stress === undefined ? undefined : `Stress ${d.stress}`,
  ]);

const nutritionSummary = (d: PreSessionData): string =>
  summarize([d.nutrition === undefined ? undefined : `Nutrition ${d.nutrition}`]);

const goalsSummary = (d: PreSessionData): string =>
  d.goals.length === 0
    ? 'Not recorded'
    : `${String(d.goals.length)} ${d.goals.length === 1 ? 'goal' : 'goals'}`;

const notesSummary = (d: PreSessionData): string => {
  const t = d.additionalNotes.trim();
  if (!t) return 'Not recorded';
  return t.length > 40 ? `${t.slice(0, 40)}…` : t;
};

const Group = ({
  title,
  summary,
  defaultExpanded = false,
  children,
}: {
  title: string;
  summary: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) => (
  <Accordion defaultExpanded={defaultExpanded} disableGutters>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Box>
        <Typography variant="subtitle1">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {summary}
        </Typography>
      </Box>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

const PreSessionForm = ({ value, onChange, lastWorkOn = [] }: PreSessionFormProps) => {
  const [internal, setInternal] = useState<PreSessionData>(emptyData);
  const [goalInput, setGoalInput] = useState('');
  const data = value ?? internal;

  const update = (patch: Partial<PreSessionData>) => {
    const next: PreSessionData = { ...data, ...patch };
    // An undefined patch value means "not recorded": drop the key entirely.
    for (const key of Object.keys(patch) as (keyof PreSessionData)[]) {
      if (patch[key] === undefined) Reflect.deleteProperty(next, key);
    }
    setInternal(next);
    onChange(next);
  };

  const setRating = (field: RatingField, next: number | null) => {
    update({ [field]: next ?? undefined });
  };

  const addGoal = (goal: string) => {
    if (data.goals.length >= LIMITS.maxGoals) return;
    update({ goals: sanitizeGoals([...data.goals, goal]) });
  };

  const isGoal = (item: string) => data.goals.includes(sanitizeGoals([item])[0] ?? item);

  const atGoalLimit = data.goals.length >= LIMITS.maxGoals;

  const handleGoalKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && goalInput.trim()) {
      addGoal(goalInput.trim());
      setGoalInput('');
    }
  };

  const handleDeleteGoal = (index: number) => {
    update({ goals: data.goals.filter((_, i) => i !== index) });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">How you feel</Typography>
      <Group title="Physical" summary={physicalSummary(data)}>
        <RatingPicker
          label="Sleep quality (last night)"
          value={data.sleepQuality ?? null}
          onChange={(n) => {
            setRating('sleepQuality', n);
          }}
        />
        <RatingPicker
          label="Energy level"
          value={data.energyLevel ?? null}
          onChange={(n) => {
            setRating('energyLevel', n);
          }}
        />
        <RatingPicker
          label="Finger soreness (1 = very sore, 10 = fresh)"
          value={data.fingerSoreness ?? null}
          onChange={(n) => {
            setRating('fingerSoreness', n);
          }}
        />
        <RatingPicker
          label="Rest days since last session"
          min={0}
          max={7}
          value={data.restDays ?? null}
          onChange={(n) => {
            setRating('restDays', n);
          }}
        />
      </Group>
      <Group title="Mental" summary={mentalSummary(data)}>
        <RatingPicker
          label="Motivation level"
          value={data.motivation ?? null}
          onChange={(n) => {
            setRating('motivation', n);
          }}
        />
        <Typography variant="subtitle2" gutterBottom>
          Stress level
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          aria-label="Stress level"
          value={data.stress ?? null}
          onChange={(_e, next: PreSessionData['stress'] | null) => {
            update({ stress: next ?? undefined });
          }}
          sx={{ mb: 2, display: 'flex' }}
        >
          <ToggleButton value="low" sx={{ minHeight: 40, flex: 1 }}>
            Low
          </ToggleButton>
          <ToggleButton value="medium" sx={{ minHeight: 40, flex: 1 }}>
            Medium
          </ToggleButton>
          <ToggleButton value="high" sx={{ minHeight: 40, flex: 1 }}>
            High
          </ToggleButton>
        </ToggleButtonGroup>
      </Group>
      <Group title="Nutrition" summary={nutritionSummary(data)}>
        <Typography variant="subtitle2" gutterBottom>
          Today&apos;s nutrition quality
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          aria-label="Nutrition quality"
          value={data.nutrition ?? null}
          onChange={(_e, next: PreSessionData['nutrition'] | null) => {
            update({ nutrition: next ?? undefined });
          }}
          sx={{ display: 'flex' }}
        >
          <ToggleButton value="poor" sx={{ minHeight: 40, flex: 1 }}>
            Poor
          </ToggleButton>
          <ToggleButton value="moderate" sx={{ minHeight: 40, flex: 1 }}>
            Moderate
          </ToggleButton>
          <ToggleButton value="good" sx={{ minHeight: 40, flex: 1 }}>
            Good
          </ToggleButton>
        </ToggleButtonGroup>
      </Group>

      <Typography variant="h6">Plan</Typography>
      <Group title="Goals" summary={goalsSummary(data)} defaultExpanded>
        <TextField
          fullWidth
          placeholder="Add a goal and press Enter"
          value={goalInput}
          slotProps={{ htmlInput: { maxLength: LIMITS.goal } }}
          onChange={(e) => {
            setGoalInput(e.target.value);
          }}
          onKeyDown={handleGoalKey}
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {data.goals.map((goal, index) => (
            <Chip
              key={index}
              label={goal}
              onDelete={() => {
                handleDeleteGoal(index);
              }}
            />
          ))}
        </Box>

        {lastWorkOn.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Last time: work on
            </Typography>
            <Stack spacing={1}>
              {lastWorkOn.map((item, index) => (
                <Box
                  key={index}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography variant="body2">{item}</Typography>
                  <Button
                    size="small"
                    aria-label={`Add as goal: ${item}`}
                    disabled={atGoalLimit || isGoal(item)}
                    onClick={() => {
                      addGoal(item);
                    }}
                  >
                    Add as goal
                  </Button>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Group>
      <Group title="Notes" summary={notesSummary(data)}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Any other notes about your condition or goals..."
          value={data.additionalNotes}
          slotProps={{ htmlInput: { maxLength: LIMITS.notes } }}
          onChange={(e) => {
            update({ additionalNotes: sanitizeNotes(e.target.value) });
          }}
        />
      </Group>
    </Stack>
  );
};

export default PreSessionForm;
