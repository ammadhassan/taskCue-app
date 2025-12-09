import TaskItem from './TaskItem';

export default function TaskList({ tasks, onToggle, onDelete, onModify, folders }) {
  if (tasks.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
        No tasks yet. Add one above!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onModify={onModify}
          folders={folders}
        />
      ))}
    </div>
  );
}
