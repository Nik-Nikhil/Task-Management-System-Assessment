'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { Task } from '@/lib/types';

export type { Task };

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-orange-100 text-orange-600',
  HIGH: 'bg-red-100 text-red-600',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed',
};

// ---- TaskCard ----
function TaskCard({ task, onEdit, onDelete, onToggle }: {
  task: Task; onEdit: () => void; onDelete: () => void; onToggle: () => void;
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 flex gap-3 items-start ${task.status === 'COMPLETED' ? 'opacity-70' : ''}`}>
      <button onClick={onToggle} aria-label="Toggle status"
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${task.status === 'COMPLETED' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-blue-400'}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-medium text-gray-900 truncate ${task.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </h3>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="text-xs text-gray-400 hover:text-blue-600 px-2 py-0.5 rounded hover:bg-blue-50">Edit</button>
            <button onClick={onDelete} className="text-xs text-gray-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50">Delete</button>
          </div>
        </div>
        {task.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>}
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>{STATUS_LABELS[task.status]}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
          {task.dueDate && <span className="text-xs text-gray-400">Due {new Date(task.dueDate).toLocaleDateString()}</span>}
        </div>
      </div>
    </div>
  );
}

// ---- TaskModal ----
function TaskModal({ task, onClose, onSaved }: { task: Task | null; onClose: () => void; onSaved: () => void; }) {
  const [form, setForm] = useState({ title: '', description: '', status: 'PENDING', priority: 'MEDIUM', dueDate: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) setForm({ title: task.title, description: task.description || '', status: task.status, priority: task.priority, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '' });
    else setForm({ title: '', description: '', status: 'PENDING', priority: 'MEDIUM', dueDate: '' });
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null };
      if (task) { await api.patch(`/tasks/${task.id}`, payload); toast.success('Task updated'); }
      else { await api.post('/tasks', payload); toast.success('Task created'); }
      onSaved();
    } catch { toast.error('Failed to save task'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">{task ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Task title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Dashboard Page ----
export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/tasks?${params}`);
      setTasks(data.tasks); setTotal(data.total); setTotalPages(data.totalPages);
    } catch { toast.error('Failed to load tasks'); }
    finally { setFetching(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading, router]);
  useEffect(() => { if (user) fetchTasks(); }, [user, fetchTasks]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${id}`); toast.success('Task deleted'); fetchTasks(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async (id: number) => {
    try { await api.patch(`/tasks/${id}/toggle`); fetchTasks(); }
    catch { toast.error('Failed to update'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Task Manager</h1>
            <p className="text-xs text-gray-500">Hi, {user?.name}</p>
          </div>
          <button onClick={async () => { await logout(); router.push('/login'); }} className="text-sm text-gray-500 hover:text-gray-800">Sign out</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input type="text" placeholder="Search tasks…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <button onClick={() => { setEditTask(null); setModalOpen(true); }}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 whitespace-nowrap">
            + New Task
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{total} task{total !== 1 ? 's' : ''} found</p>
        {fetching ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">No tasks yet</p>
            <p className="text-sm mt-1">Create your first task to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task}
                onEdit={() => { setEditTask(task); setModalOpen(true); }}
                onDelete={() => handleDelete(task.id)}
                onToggle={() => handleToggle(task.id)} />
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        )}
      </main>
      {modalOpen && <TaskModal task={editTask} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchTasks(); }} />}
    </div>
  );
}
