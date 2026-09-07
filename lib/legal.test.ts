/**
 * Legal Loader Tests — Sprint 58 P0-8
 */

import { describe, it, expect } from 'vitest';
import { loadLegalMeta, loadLegalDoc, getCurrentLegalVersions } from './legal';

describe('loadLegalMeta', () => {
  it('returns meta with both terms and privacy', () => {
    const meta = loadLegalMeta();
    expect(meta.terms).toBeDefined();
    expect(meta.privacy).toBeDefined();
    expect(meta.terms['zh-TW']).toBeDefined();
    expect(meta.terms.en).toBeDefined();
    expect(meta.privacy['zh-TW']).toBeDefined();
    expect(meta.privacy.en).toBeDefined();
  });

  it('returns valid version strings', () => {
    const meta = loadLegalMeta();
    expect(meta.terms['zh-TW'].version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(meta.privacy['zh-TW'].version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('loadLegalDoc', () => {
  it('loads ToS zh-TW', () => {
    const doc = loadLegalDoc('terms', 'zh-TW');
    expect(doc.title).toContain('服務條款');
    expect(doc.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(doc.content.length).toBeGreaterThan(100);
    expect(doc.content).toContain('ai-headless');
  });

  it('loads ToS en', () => {
    const doc = loadLegalDoc('terms', 'en');
    expect(doc.title).toContain('Terms');
    expect(doc.content).toContain('ai-headless');
  });

  it('loads Privacy zh-TW', () => {
    const doc = loadLegalDoc('privacy', 'zh-TW');
    expect(doc.title).toContain('隱私');
    expect(doc.content).toContain('Sentry');
  });

  it('loads Privacy en', () => {
    const doc = loadLegalDoc('privacy', 'en');
    expect(doc.title).toContain('Privacy');
    expect(doc.content).toContain('Sentry');
  });
});

describe('getCurrentLegalVersions', () => {
  it('returns versions for both docs', () => {
    const v = getCurrentLegalVersions();
    expect(v.terms).toMatch(/^\d+\.\d+\.\d+$/);
    expect(v.privacy).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
