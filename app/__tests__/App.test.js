/**
 * @format
 */

import { activities, rewards, transactions, wallet } from '../src/data/mock';
import { gradients } from '../src/theme';

// UI rendering needs the native Reanimated/SVG runtimes, so these tests cover the
// mock data shape that every screen depends on.
test('activities have valid goals and gradients', () => {
  activities.forEach(a => {
    expect(a.goal).toBeGreaterThan(0);
    expect(a.gradient.length).toBeGreaterThanOrEqual(2);
  });
});

test('wallet and marketplace data are consistent', () => {
  expect(wallet.earnedToday).toBeLessThanOrEqual(wallet.dailyCap);
  rewards.forEach(r => expect(r.cost).toBeGreaterThan(0));
  expect(transactions.length).toBeGreaterThan(0);
  expect(gradients.primary).toHaveLength(2);
});
