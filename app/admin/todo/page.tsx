/**
 * Todo List Page
 */

import { listTodos } from '@/extensions/todo/workflow/todo-workflow';
import { guardExtensionOrRedirect } from '@/app/admin/_components/extension-page-guard';
import { CreateTodoDialog } from './components/create-todo-dialog';
import { TodoRowActions } from './components/todo-row-actions';
import { TodoPriorityBadge } from './components/todo-priority-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default async function TodosPage() {
  await guardExtensionOrRedirect('todo');
  const todos = await listTodos();
  const active = todos.filter((t) => !t.completed);
  const done = todos.filter((t) => t.completed);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">待辦事項</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Todo Extension — 簡單 CRUD + toggle complete
          </p>
        </div>
        <CreateTodoDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>待完成（{active.length}）</CardTitle>
            <CardDescription>點右側「完成」標記</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {active.length === 0 ? (
              <div className="text-sm text-muted-foreground">沒有待辦 🎉</div>
            ) : (
              active.map((todo) => (
                <div key={todo.id} className="border rounded p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{todo.title}</div>
                      {todo.description && (
                        <div className="text-sm text-muted-foreground mt-1">{todo.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <TodoPriorityBadge priority={todo.priority} />
                        {todo.dueDate && (
                          <span className="text-muted-foreground">
                            截止：{new Date(todo.dueDate).toLocaleDateString('zh-TW')}
                          </span>
                        )}
                      </div>
                    </div>
                    <TodoRowActions
                      todoId={todo.id}
                      completed={todo.completed}
                      initialTitle={todo.title}
                      initialDescription={todo.description ?? ''}
                      initialDueDate={todo.dueDate ? todo.dueDate.toISOString() : null}
                      initialPriority={todo.priority}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>已完成（{done.length}）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {done.length === 0 ? (
              <div className="text-sm text-muted-foreground">還沒完成任何待辦</div>
            ) : (
              done.map((todo) => (
                <div key={todo.id} className={cn('border rounded p-3 space-y-2 bg-gray-50')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium line-through text-muted-foreground">{todo.title}</div>
                    </div>
                    <TodoRowActions
                      todoId={todo.id}
                      completed={todo.completed}
                      initialTitle={todo.title}
                      initialDescription={todo.description ?? ''}
                      initialDueDate={todo.dueDate ? todo.dueDate.toISOString() : null}
                      initialPriority={todo.priority}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}