/**
 * TDD Gate 1 — TD-403 Toast 組件
 */

import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './toast';

function ToastTrigger({ message }: { message: string }) {
  const { show } = useToast();
  return (
    <button onClick={() => show({ message, variant: 'error' })}>
      Trigger
    </button>
  );
}

describe('TD-403 Toast 組件', () => {
  it('顯示 toast 訊息', async () => {
    render(
      <ToastProvider>
        <ToastTrigger message="操作失敗" />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(await screen.findByText('操作失敗')).toBeTruthy();
  });

  it('多個 toast 同時顯示', async () => {
    function MultiTrigger() {
      const { show } = useToast();
      return (
        <>
          <button onClick={() => show({ message: 'msg-1' })}>t1</button>
          <button onClick={() => show({ message: 'msg-2' })}>t2</button>
        </>
      );
    }

    render(
      <ToastProvider>
        <MultiTrigger />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('t1').click();
      screen.getByText('t2').click();
    });

    expect(await screen.findByText('msg-1')).toBeTruthy();
    expect(await screen.findByText('msg-2')).toBeTruthy();
  });

  it('error variant 樣式', async () => {
    render(
      <ToastProvider>
        <ToastTrigger message="err" />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    const toast = await screen.findByTestId('toast');
    expect(toast.className).toContain('red');
  });
});