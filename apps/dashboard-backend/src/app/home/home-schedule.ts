/** Where a schedule slot (`HH:mm` strings, school-local) stands at `now`. */
export type TimeState = 'LATER' | 'NOW' | 'PAST';

export function timeState(slot: { startTime: string; endTime: string }, now: string): TimeState {
  if (slot.startTime > now) return 'LATER';
  return slot.endTime > now ? 'NOW' : 'PAST';
}
