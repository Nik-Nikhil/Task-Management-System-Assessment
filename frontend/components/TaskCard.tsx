'use client';
import { Task } from '@/lib/types';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
};
const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-orange-100 text-orange-600',
  HIGH: 'bg-red-100 text-red-600',
};
const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

interface Props {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

export default function TaskCard({ task, onEdit, onDelete, onToggle }: Props) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 flex gap-3 items-start ${task.status === 'COMPLETED' ? 'opacity-70' : ''}`}>
      <button
        onClick={onToggle}
        aria-label={task.status === 'COMPLETED' ? 'Mark incomplete' : 'Mark complete'}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
          task.status === 'COMPLETED' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-blue-400'
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-medium text-gray-900 truncate ${task.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </h3>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="text-xs text-gray-400 hover:text-blue-600 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors">
              Edit
            </button>
            <button onClick={onDelete} className="text-xs text-gray-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50 transition-colors">
              Delete
            </button>
          </div>
        </div>
        {task.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}>
            {statusLabels[task.status]}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          {task.dueDate && (
            <span className="text-xs text-gray-400">
              Due {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
