export type WorkoutPreset = {
  id: string;
  name: string;
  workSeconds: number;
  restSeconds: number;
  intervals: number;
};

export const WORKOUT_PRESETS: WorkoutPreset[] = [
  {
    id: '7-3-repeaters',
    name: '7/3 Repeaters',
    workSeconds: 7,
    restSeconds: 3,
    intervals: 6,
  },
  {
    id: '10s-max-hangs',
    name: '10s Max Hangs',
    workSeconds: 10,
    restSeconds: 180,
    intervals: 5,
  },
  {
    id: '5s-holds',
    name: '5s Holds',
    workSeconds: 5,
    restSeconds: 5,
    intervals: 6,
  },
  {
    id: '20-10-intervals',
    name: '20/10 Intervals',
    workSeconds: 20,
    restSeconds: 10,
    intervals: 8,
  },
];
