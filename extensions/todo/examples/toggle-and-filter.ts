// Todo Extension 使用範例
//
// 展示最簡單的 extension（無 state machine）
// 包含 toggle 功能（checkbox 快速切換完成狀態）
//
// API 摘要：
// - listTodos()      → Todo[]
// - getTodo(id)      → Todo | null
// - createTodo(input) → Todo
// - updateTodo(id, data) → Todo
// - deleteTodo(id)   → 軟刪除
// - toggleTodo(id)   → 切換 completed 狀態

import {
  listTodos,
  createTodo,
  toggleTodo,
  deleteTodo,
} from '../workflow/todo-workflow';

export async function exampleCreateAndComplete() {
  const todo = await createTodo({
    title: '寫 Sprint 13 reflection',
    priority: 'high',
    dueDate: '2026-12-31',
  });

  // 快速完成（不需 update 整個物件）
  const completed = await toggleTodo(todo.id);

  return completed; // completed: true
}

export async function exampleListByPriority() {
  const todos = await listTodos();

  return {
    high: todos.filter((t) => t.priority === 'high'),
    medium: todos.filter((t) => t.priority === 'medium'),
    low: todos.filter((t) => t.priority === 'low'),
    completed: todos.filter((t) => t.completed),
    pending: todos.filter((t) => !t.completed),
  };
}

export async function exampleBulkComplete(todoIds: string[]) {
  return await Promise.all(todoIds.map((id) => toggleTodo(id)));
}

export async function exampleCleanup(todoIds: string[]) {
  // 刪除已完成 todo
  return await Promise.all(todoIds.map((id) => deleteTodo(id)));
}