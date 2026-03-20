import pkg from '../src';

describe('import', () => {
  test('dist', () => {
    expect(Boolean(pkg)).toBeTruthy();
    expect(Boolean(pkg.helpers)).toBeTruthy();
    expect(Boolean(pkg.modules)).toBeTruthy();
    expect(Boolean(pkg.lib)).toBeTruthy();
    return;
  });
});
