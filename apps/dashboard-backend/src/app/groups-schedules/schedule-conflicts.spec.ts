import { describeTime, firstClash, isValidRange, overlaps } from './schedule-conflicts';

describe('schedule conflicts', () => {
  const mon = (startTime: string, endTime: string, id?: string) => ({
    id,
    weekday: 'MONDAY' as const,
    startTime,
    endTime,
  });

  it('detects overlapping ranges on the same day', () => {
    expect(overlaps(mon('07:00', '08:30'), mon('08:00', '09:00'))).toBe(true);
    expect(overlaps(mon('07:00', '09:00'), mon('07:45', '08:30'))).toBe(true);
  });

  it('treats ranges as half-open', () => {
    expect(overlaps(mon('07:00', '07:45'), mon('07:45', '08:30'))).toBe(false);
  });

  it('ignores other days and recess slots', () => {
    expect(overlaps(mon('07:00', '08:00'), { weekday: 'TUESDAY', startTime: '07:00', endTime: '08:00' })).toBe(false);
    expect(overlaps(mon('07:00', '08:00'), { ...mon('07:00', '08:00'), recess: true })).toBe(false);
  });

  it('skips the candidate itself', () => {
    const slots = [mon('07:00', '08:00', 'a'), mon('09:00', '10:00', 'b')];
    expect(firstClash(mon('07:15', '07:45', 'a'), slots)).toBeUndefined();
    expect(firstClash(mon('07:15', '07:45', 'c'), slots)?.id).toBe('a');
  });

  it('describes a slot in Spanish', () => {
    expect(describeTime({ weekday: 'THURSDAY', startTime: '12:30', endTime: '13:15' })).toBe(
      'el jueves de 12:30 a 13:15',
    );
  });

  it('validates HH:mm ranges', () => {
    expect(isValidRange('07:00', '07:45')).toBe(true);
    expect(isValidRange('07:45', '07:00')).toBe(false);
    expect(isValidRange('7:00', '07:45')).toBe(false);
  });
});
