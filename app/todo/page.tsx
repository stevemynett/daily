import TodoList from './todo-list';

export const metadata = {
  title: 'Todo',
};

export default function Todo() {
  return (
    <>
      <h1 className="page-title">Todo</h1>
      <TodoList />
    </>
  );
}
