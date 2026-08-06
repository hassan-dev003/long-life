/**
 * Leisure activities (CONTENT_DATA_SPEC §6). Each is a one-week action with a
 * cash cost and health/happiness gains.
 */
export interface Activity {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  h: number; // +health
  hp: number; // +happiness
}

export const ACTIVITIES: Activity[] = [
  { id: 'rest', name: 'Rest at home', emoji: '🛋️', cost: 0, h: 4, hp: 1 },
  { id: 'walk', name: 'Take a walk', emoji: '🚶', cost: 0, h: 2, hp: 3 },
  { id: 'meditate', name: 'Meditate', emoji: '🧘', cost: 0, h: 0, hp: 3 },
  { id: 'gym', name: 'Hit the gym', emoji: '🏋️', cost: 25, h: 7, hp: 2 },
  { id: 'movie', name: 'Movie night', emoji: '🎬', cost: 45, h: 1, hp: 8 },
  { id: 'dinner', name: 'Nice dinner out', emoji: '🍽️', cost: 110, h: 1, hp: 11 },
  { id: 'spa', name: 'Spa day', emoji: '💆', cost: 360, h: 11, hp: 11 },
  { id: 'trip', name: 'Weekend getaway', emoji: '🏕️', cost: 1_900, h: 6, hp: 26 },
  { id: 'vacation', name: 'Luxury vacation', emoji: '✈️', cost: 13_000, h: 22, hp: 46 },
  { id: 'retreat', name: 'Wellness retreat', emoji: '🌿', cost: 65_000, h: 65, hp: 28 },
];

export const ACTIVITY_BY_ID: Record<string, Activity> = Object.fromEntries(
  ACTIVITIES.map((a) => [a.id, a]),
);
