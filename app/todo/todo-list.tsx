'use client';

import { useEffect, useState, type FormEvent } from 'react';

type Todo = { text: string; done: boolean; added: string };

// Stored in ~/briefings/todos.json through the runner, like Saved Tabs
export default function TodoList() {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [text, setText] = useState('');
  // The todo being edited, keyed by its added time, and its draft text
  const [editing, setEditing] = useState<{ added: string; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/todos')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setTodos)
      .catch(() => setOffline(true));
  }, []);

  async function save(next: Todo[]) {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(next),
    }).catch(() => null);
    if (!res?.ok) return setOffline(true);
    setOffline(false);
    setTodos(next);
    return true;
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!todos || !text.trim()) return;
    if (await save([{ text: text.trim(), done: false, added: new Date().toISOString() }, ...todos])) setText('');
  }

  const toggle = (todo: Todo) => save(todos!.map((t) => (t === todo ? { ...t, done: !t.done } : t)));
  const remove = (todo: Todo) => save(todos!.filter((t) => t !== todo));
  // Saves the draft; an empty draft keeps the old text
  async function finishEdit() {
    if (!editing) return;
    const next = editing.text.trim();
    const todo = todos!.find((t) => t.added === editing.added);
    setEditing(null);
    if (todo && next && next !== todo.text) await save(todos!.map((t) => (t === todo ? { ...t, text: next } : t)));
  }
  // Open items first, done ones below, each newest first
  const shown = [...(todos ?? [])].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <>
      <form className="tab-form todo-form" onSubmit={add}>
        <input type="text" placeholder="Add a todo" value={text} onChange={(e) => setText(e.target.value)} aria-label="New todo" />
        <button type="submit" className="run-button" disabled={!todos}>
          Add
        </button>
      </form>
      {offline && <p className="muted run-hint">Runner is off. Start it with `make runner`.</p>}

      {todos === null ? (
        !offline && <p className="muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="muted">Nothing to do.</p>
      ) : (
        <ul className="tab-list">
          {shown.map((todo) => (
            <li key={todo.added} className="tab-item todo-item" data-done={todo.done}>
              <input type="checkbox" checked={todo.done} onChange={() => toggle(todo)} aria-label={`Done: ${todo.text}`} />
              {editing?.added === todo.added ? (
                <input
                  type="text"
                  className="todo-edit"
                  value={editing.text}
                  onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                  onBlur={finishEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEdit();
                    if (e.key === 'Escape') setEditing(null);
                  }}
                  aria-label="Edit todo"
                  autoFocus
                />
              ) : (
                <span className="tab-body" onDoubleClick={() => setEditing({ added: todo.added, text: todo.text })}>
                  {todo.text}
                </span>
              )}
              <button type="button" className="tag tab-remove" onClick={() => setEditing({ added: todo.added, text: todo.text })}>
                Edit
              </button>
              <button type="button" className="tag tab-remove" onClick={() => remove(todo)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
