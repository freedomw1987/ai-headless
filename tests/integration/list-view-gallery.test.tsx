/**
 * Sprint 38-2 — GalleryView 元件測試
 *
 * 設計：
 * - 響應式 grid 布局（desktop 3-4 cols, mobile 2 cols）
 * - 每個 card 顯示圖片 + title + metadata
 * - 沒 image 時顯示 fallback icon (📷)
 * - 支援 selection + actions
 *
 * Gate 1 TDD
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GalleryView } from '@/app/admin/crud/[spec]/list-views/gallery-view';

const columns = [
  { name: 'title', label: '標題' },
  { name: 'image', label: '圖片' },
  { name: 'createdAt', label: '建立時間' },
];

const rows = [
  { id: 'r1', cells: [
    { fieldName: 'title', value: 'Hello World', isCheckbox: false, isDate: false },
    { fieldName: 'image', value: 'https://example.com/img1.jpg', isCheckbox: false, isDate: false },
    { fieldName: 'createdAt', value: '2026-08-30', isCheckbox: false, isDate: true },
  ] },
  { id: 'r2', cells: [
    { fieldName: 'title', value: 'No Image Post', isCheckbox: false, isDate: false },
    { fieldName: 'image', value: '', isCheckbox: false, isDate: false },
    { fieldName: 'createdAt', value: '2026-08-29', isCheckbox: false, isDate: true },
  ] },
];

describe('Sprint 38-2 — GalleryView', () => {
  it('渲染每 row 一張 card', () => {
    const { container } = render(
      <GalleryView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
        imageField="image"
      />,
    );
    // 只 match 完全等於 gallery-card-XXX (不是 -image, -title 等子元素)
    const allEls = container.querySelectorAll('[data-testid^="gallery-card-"]');
    const cards = Array.from(allEls).filter((el) => {
      const tid = el.getAttribute('data-testid') ?? '';
      return tid.startsWith('gallery-card-') && !tid.slice('gallery-card-'.length).includes('-');
    });
    expect(cards.length).toBe(2);
  });

  it('有 image 時顯示 <img>', () => {
    const { container } = render(
      <GalleryView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
        imageField="image"
      />,
    );
    const img = container.querySelector('[data-testid="gallery-card-r1-image"]');
    expect(img?.tagName).toBe('IMG');
    expect(img?.getAttribute('src')).toBe('https://example.com/img1.jpg');
  });

  it('沒 image 時顯示 fallback icon', () => {
    const { container } = render(
      <GalleryView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
        imageField="image"
      />,
    );
    const fallback = container.querySelector('[data-testid="gallery-card-r2-fallback"]');
    expect(fallback).toBeTruthy();
  });

  it('顯示 primary field (title)', () => {
    render(
      <GalleryView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
        imageField="image"
      />,
    );
    expect(screen.getByTestId('gallery-card-r1-title').textContent).toBe('Hello World');
  });

  it('空 rows 時顯示提示', () => {
    render(
      <GalleryView
        rows={[]}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
        imageField="image"
      />,
    );
    expect(screen.getByTestId('gallery-empty')).toBeTruthy();
  });

  it('沒指定 imageField 時顯示提示', () => {
    render(
      <GalleryView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
      />,
    );
    expect(screen.getByTestId('gallery-no-image-field')).toBeTruthy();
  });

  it('checkbox 切換 selection', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <GalleryView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
        renderActions={() => null}
        primaryField="title"
        imageField="image"
      />,
    );
    const card = container.querySelector('[data-testid="gallery-card-r1"]');
    const checkbox = card?.querySelector('button[role="checkbox"]') as HTMLElement;
    await user.click(checkbox);
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['r1']));
  });

  it('actions 透過 renderActions prop 渲染', () => {
    render(
      <GalleryView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={(rowId) => <button data-testid={`action-${rowId}`}>Edit</button>}
        primaryField="title"
        imageField="image"
      />,
    );
    expect(screen.getByTestId('action-r1')).toBeTruthy();
  });

  it('selected card 顯示 selected 樣式', () => {
    render(
      <GalleryView
        rows={rows}
        columns={columns}
        selectedIds={new Set(['r1'])}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
        imageField="image"
      />,
    );
    const card = screen.getByTestId('gallery-card-r1');
    expect(card.getAttribute('data-selected')).toBe('true');
  });
});