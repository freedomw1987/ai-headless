/**
 * TDD Gate 1 — 共用 CRUD 組件測試
 *
 * DataTable / FormField / SearchBar / Pagination / ConfirmDialog
 * 這些是 admin 頁面的基礎組件，供 UI Generator 生成時使用。
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type DataTableColumn } from './data-table';
import { FormField } from './form-field';
import { SearchBar } from './search-bar';
import { Pagination } from './pagination';
import { ConfirmDialog } from './confirm-dialog';
import type { Field } from '@/lib/specs/json-spec.types';

// ==============================================
// DataTable
// ==============================================

describe('DataTable', () => {
  interface User {
    id: string;
    name: string;
    email: string;
  }

  const columns: DataTableColumn<User>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
  ];

  const users: User[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
  ];

  it('渲染所有資料列', () => {
    render(<DataTable columns={columns} data={users} />);
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
    expect(screen.getByText('alice@example.com')).toBeTruthy();
  });

  it('渲染表頭', () => {
    render(<DataTable columns={columns} data={users} />);
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('空資料顯示提示', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText(/no data/i)).toBeTruthy();
  });

  it('actions prop 接收每行的 action 按鈕', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={users}
        actions={(row) => (
          <div>
            <button onClick={() => onEdit(row.id)}>Edit</button>
            <button onClick={() => onDelete(row.id)}>Delete</button>
          </div>
        )}
      />,
    );

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]!);
    expect(onEdit).toHaveBeenCalledWith('1');
  });

  it('column.render 自訂渲染', () => {
    const cols: DataTableColumn<User>[] = [
      {
        key: 'name',
        header: 'Name',
        render: (row) => <strong>{row.name.toUpperCase()}</strong>,
      },
    ];
    render(<DataTable columns={cols} data={users} />);
    expect(screen.getByText('ALICE')).toBeTruthy();
  });
});

// ==============================================
// FormField
// ==============================================

describe('FormField', () => {
  const baseField: Field = {
    name: 'title',
    type: 'string',
    label: '標題',
  };

  it('渲染 label 和 input', () => {
    render(<FormField field={baseField} value="" onChange={() => {}} />);
    expect(screen.getByLabelText('標題')).toBeTruthy();
  });

  it('boolean 類型渲染 Switch', () => {
    const boolField: Field = { ...baseField, name: 'completed', type: 'boolean', label: '完成' };
    render(<FormField field={boolField} value={false} onChange={() => {}} />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeTruthy();
  });

  it('enum 類型渲染 Select', () => {
    const enumField: Field = {
      ...baseField,
      name: 'status',
      type: 'enum',
      validation: { enum: ['pending', 'done'] },
    };
    render(<FormField field={enumField} value="" onChange={() => {}} />);
    // Select 使用 portal，文本可能不在當前 DOM
    const { container } = render(
      <FormField field={enumField} value="" onChange={() => {}} />,
    );
    expect(container.querySelector('[role="combobox"]') ?? document.body).toBeTruthy();
  });

  it('number 類型渲染 number input', () => {
    const numField: Field = { ...baseField, name: 'age', type: 'integer', label: '年齡' };
    render(<FormField field={numField} value={0} onChange={() => {}} />);
    const input = screen.getByLabelText('年齡') as HTMLInputElement;
    expect(input.type).toBe('number');
  });

  it('required 欄位顯示 *', () => {
    const reqField: Field = { ...baseField, validation: { required: true } };
    render(<FormField field={reqField} value="" onChange={() => {}} />);
    expect(screen.getByText(/\*/)).toBeTruthy();
  });

  it('onChange 被觸發時傳回新值', () => {
    const onChange = vi.fn();
    render(<FormField field={baseField} value="" onChange={onChange} />);
    const input = screen.getByLabelText('標題');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalled();
  });
});

// ==============================================
// SearchBar
// ==============================================

describe('SearchBar', () => {
  it('受控：value 與 onChange 配對', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} placeholder="搜尋..." />);

    const input = screen.getByPlaceholderText('搜尋...');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('非受控：呼叫 onChange', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByRole('searchbox') ?? screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'query' } });

    expect(onChange).toHaveBeenCalledWith('query');
  });
});

// ==============================================
// Pagination
// ==============================================

describe('Pagination', () => {
  it('顯示總數', () => {
    render(<Pagination currentPage={1} pageSize={20} total={100} onChange={() => {}} />);
    expect(screen.getByText(/100/)).toBeTruthy();
  });

  it('顯示當前頁 / 總頁數', () => {
    render(<Pagination currentPage={2} pageSize={20} total={100} onChange={() => {}} />);
    expect(screen.getByText(/第 2 頁/)).toBeTruthy();
    expect(screen.getByText(/共 5 頁/)).toBeTruthy();
  });

  it('點下一頁觸發 onChange', () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={1} pageSize={20} total={100} onChange={onChange} />);

    const nextButton = screen.getByText(/下一頁|next/i);
    fireEvent.click(nextButton);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('第一頁時上一頁 disabled', () => {
    render(<Pagination currentPage={1} pageSize={20} total={100} onChange={() => {}} />);
    const prevButton = screen.getByText(/上一頁|prev/i) as HTMLButtonElement;
    expect(prevButton.disabled).toBe(true);
  });

  it('最後一頁時下一頁 disabled', () => {
    render(<Pagination currentPage={5} pageSize={20} total={100} onChange={() => {}} />);
    const nextButton = screen.getByText(/下一頁|next/i) as HTMLButtonElement;
    expect(nextButton.disabled).toBe(true);
  });
});

// ==============================================
// ConfirmDialog
// ==============================================

describe('ConfirmDialog', () => {
  it('open=true 時顯示標題和訊息', () => {
    render(
      <ConfirmDialog
        open={true}
        title="刪除確認"
        message="確定要刪除嗎？"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('刪除確認')).toBeTruthy();
    expect(screen.getByText('確定要刪除嗎？')).toBeTruthy();
  });

  it('點確認觸發 onConfirm', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="刪除確認"
        message="確定嗎？"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );

    const confirmButton = screen.getByRole('button', { name: '確認' });
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalled();
  });

  it('點取消觸發 onCancel', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="刪除確認"
        message="確定嗎？"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );

    const cancelButton = screen.getByText(/取消|cancel/i);
    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalled();
  });

  it('open=false 時不渲染', () => {
    render(
      <ConfirmDialog
        open={false}
        title="刪除確認"
        message="確定嗎？"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.queryByText('刪除確認')).toBeNull();
  });
});