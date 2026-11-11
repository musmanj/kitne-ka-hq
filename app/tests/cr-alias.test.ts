import { describe, it, expect } from 'vitest';
import { normalisePkr } from '../src/domain/normalise-pkr';

// D-009 #6: 'cr' parses as crore.
describe("'cr' alias (D-009 #6)", () => {
  it.each([['2 cr', 2_000_000_000], ['1.5cr', 1_500_000_000], ['1.5 CR', 1_500_000_000], ['Rs 1 cr', 1_000_000_000]] as const)('%s', (raw, minor) => {
    const r = normalisePkr(raw) as any;
    expect(r.ok).toBe(true);
    expect(r.amount_minor ?? r.value?.amount_minor ?? r.money?.amount_minor).toBe(minor);
  });
  it.each(['cr', '1 crs', '1 c r'])('%s is rejected', raw => expect(normalisePkr(raw).ok).toBe(false));
});
