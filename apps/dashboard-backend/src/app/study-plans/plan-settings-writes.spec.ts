import { settingsScalars } from './plan-settings-writes';

describe('settingsScalars', () => {
  it('writes only the fields the input sets', () => {
    expect(settingsScalars({})).toEqual({});
    expect(settingsScalars({ gradeMetricId: 'm' })).toEqual({ gradeMetricId: 'm' });
    expect(settingsScalars({ gradeMetricId: '' })).toEqual({ gradeMetricId: null });
  });
});
