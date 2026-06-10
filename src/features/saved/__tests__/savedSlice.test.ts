import { describe, expect, it } from 'vitest';
import type { PropertySummary } from '@contracts';
import {
  clearSaved,
  saved,
  savedReducer,
  selectIsSaved,
  selectSavedCount,
  selectSavedItems,
  unsaved,
} from '../savedSlice';

function fixture(id: string, title = 'Sample home'): PropertySummary {
  return {
    id,
    slug: `slug-${id}`,
    title,
    type: 'home',
    listingKind: 'resale',
    status: 'published',
    price: 500_000,
    currency: 'USD',
    locality: 'SoHo',
    city: 'New York',
    thumbnail: 'https://example.com/x.jpg',
    isFeatured: false,
    location: { type: 'Point', coordinates: [-74.0, 40.7] },
    contactCapabilities: {
      chat: true,
      call: { enabled: true, masked: false },
      whatsapp: true,
      email: true,
    },
  } as PropertySummary;
}

describe('savedSlice', () => {
  it('starts empty', () => {
    const state = savedReducer(undefined, { type: '@@INIT' });
    expect(selectSavedCount({ saved: state } as never)).toBe(0);
  });

  it('saves a listing and reports it as saved', () => {
    const item = fixture('a1');
    const next = savedReducer(undefined, saved(item));
    expect(selectSavedCount({ saved: next } as never)).toBe(1);
    expect(selectIsSaved({ saved: next } as never, 'a1')).toBe(true);
    expect(selectIsSaved({ saved: next } as never, 'nope')).toBe(false);
  });

  it('is idempotent — saving the same id twice does not duplicate', () => {
    const item = fixture('a1');
    let state = savedReducer(undefined, saved(item));
    state = savedReducer(state, saved(item));
    expect(state.items).toHaveLength(1);
  });

  it('inserts most-recent first', () => {
    let state = savedReducer(undefined, saved(fixture('a1')));
    state = savedReducer(state, saved(fixture('a2')));
    state = savedReducer(state, saved(fixture('a3')));
    expect(selectSavedItems({ saved: state } as never).map((p) => p.id)).toEqual([
      'a3',
      'a2',
      'a1',
    ]);
  });

  it('unsaves by id', () => {
    let state = savedReducer(undefined, saved(fixture('a1')));
    state = savedReducer(state, saved(fixture('a2')));
    state = savedReducer(state, unsaved('a1'));
    expect(state.items.map((p) => p.id)).toEqual(['a2']);
  });

  it('clearSaved empties the list', () => {
    let state = savedReducer(undefined, saved(fixture('a1')));
    state = savedReducer(state, saved(fixture('a2')));
    state = savedReducer(state, clearSaved());
    expect(state.items).toEqual([]);
  });
});
