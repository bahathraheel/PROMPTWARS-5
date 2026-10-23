import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Trash2, Edit2, Check, Calendar, Clock, Bot, X, ArrowLeft } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getEvent, getTasks, addTask, updateTask, deleteTask } from '../../services/firestoreService';
import { generateChecklist } from '../../services/aiService';
import type { Event, Task, TaskPriority } from '../../../../shared/types/index';
import { formatDate, daysUntil, getPriorityColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

export default function TimelinePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingChecklist, setGeneratingChecklist] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'medium' as TaskPriority, category: '' });

  useEffect(() => {
    if (!eventId || !user) return;
    Promise.all([getEvent(eventId), getTasks(eventId)])
      .then(([ev, ts]) => {
        setEvent(ev);
        const pOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        setTasks(ts.sort((a: Task, b: Task) => pOrder[a.priority] - pOrder[b.priority]));
      })
      .catch((err) => {
        console.error('Failed to load timeline tasks:', err);
        toast.error('Failed to load tasks');
      })
      .finally(() => setLoading(false));
  }, [eventId, user]);

  const filtered = tasks.filter(t => {
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'done' ? t.completed : !t.completed);
    return matchPriority && matchStatus;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const daysLeft = daysUntil(event?.date);

  const handleToggle = async (task: Task) => {
    const updated = { ...task, completed: !task.completed };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    try {
      await updateTask(task.id, { completed: !task.completed });
    } catch (err) {
      console.error('Failed to update task completion:', err);
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      toast.error('Failed to update task');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !eventId || !user) {
      toast.error('Please enter a task title');
      return;
    }
    try {
      const payload = {
        eventId,
        userId: user.uid,
        title: newTask.title.trim(),
        priority: newTask.priority,
        dueDate: newTask.dueDate ? newTask.dueDate : undefined,
        category: newTask.category.trim() ? newTask.category.trim() : undefined,
        completed: false,
        order: tasks.length,
      };

      const id = await addTask(payload);
      const task: Task = {
        ...payload,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks(prev => [...prev, task]);
      setNewTask({ title: '', dueDate: '', priority: 'medium', category: '' });
      setShowAdd(false);
      toast.success('Task added!');
    } catch (err) {
      console.error('Failed to add task:', err);
      toast.error('Failed to add task.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editingTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    try {
      const updatedFields: Partial<Task> = {
        title: editingTask.title.trim(),
        priority: editingTask.priority,
        dueDate: editingTask.dueDate || undefined,
        category: editingTask.category?.trim() || undefined,
        description: editingTask.description?.trim() || undefined,
      };
      await updateTask(editingTask.id, updatedFields);
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...updatedFields } : t));
      setEditingTask(null);
      toast.success('Task updated!');
    } catch (err) {
      console.error('Failed to update task:', err);
      toast.error('Failed to update task.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted.');
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.error('Failed to delete task.');
    }
  };

  const handleGenerateChecklist = async () => {
    if (!event || !user) return;
    setGeneratingChecklist(true);
    try {
      const result = await generateChecklist(event as unknown as Record<string, unknown>);
      const newTasks: Task[] = [];
      for (const item of result.tasks) {
        const payload = {
          eventId: eventId!,
          userId: user.uid,
          title: item.title,
          description: item.description || undefined,
          priority: (item.priority as TaskPriority) || 'medium',
          dueDate: item.suggestedDueDate || undefined,
          category: item.category || undefined,
          completed: false,
          order: tasks.length + newTasks.length,
        };
        const id = await addTask(payload);
        newTasks.push({
          ...payload,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setTasks(prev => [...prev, ...newTasks]);
      toast.success(`${newTasks.length} AI tasks added!`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message || 'Failed to generate checklist.');
    } finally {
      setGeneratingChecklist(false);
    }
  };

  if (loading) {
    return (
      <AppLayout eventId={eventId} title="Timeline">
        <div className="page-content">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12, marginBottom: 10 }} />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!event || (user && event.userId !== user.uid)) {
    return (
      <AppLayout title="Event Not Found">
        <div className="page-content">
          <div className="empty-state">
            <h2 className="empty-state__title">Event not found</h2>
            <p className="empty-state__desc">This event doesn't exist or you don't have access to it.</p>
            <Link to="/dashboard" className="btn btn-primary"><ArrowLeft size={16} /> Back to Dashboard</Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout eventId={eventId} title="Timeline & Checklist">
      <div className="page-content">
        {/* Header */}
        <div className="section-header">
          <div>
            <h1 className="section-title">Timeline & Checklist</h1>
            <p className="section-subtitle">
              {event?.name} — {daysLeft !== null ? (daysLeft >= 0 ? `${daysLeft} days remaining` : `${Math.abs(daysLeft)} days ago`) : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleGenerateChecklist} disabled={generatingChecklist} className="btn btn-secondary btn-sm" id="ai-checklist-btn">
              <Bot size={14} /> {generatingChecklist ? 'Generating...' : 'AI Checklist'}
            </button>
            <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-sm" id="add-task-btn">
              <Plus size={14} /> Add Task
            </button>
          </div>
        </div>

        {/* Countdown + Progress */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, marginBottom: '1.5rem' }}>
          {daysLeft !== null && daysLeft >= 0 && (
            <div style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', borderRadius: 16, padding: '1.25rem 2rem', textAlign: 'center', color: '#fff', minWidth: 140 }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>{daysLeft}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: 4 }}>days to go</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 2 }}>{formatDate(event?.date)}</div>
            </div>
          )}
          <div className="card" style={{ justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Overall Progress</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{progress}%</span>
            </div>
            <div className="progress" style={{ height: 12, marginBottom: 8 }}>
              <div className={`progress-bar ${progress >= 100 ? 'progress-bar--success' : ''}`} style={{ width: `${progress}%` }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              {completedCount} of {tasks.length} tasks completed
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div className="select-wrapper" style={{ minWidth: 140 }}>
            <select className="select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)} id="priority-filter">
              <option value="all">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="select-wrapper" style={{ minWidth: 140 }}>
            <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} id="status-filter">
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="done">Completed</option>
            </select>
          </div>
        </div>

        {/* Add Task Form */}
        {showAdd && (
          <div className="card" style={{ marginBottom: '1rem', background: 'var(--color-lavender)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto auto', gap: 10, alignItems: 'end' }}>
              <div className="form-group" style={{ gap: 4 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Task Title *</label>
                <input className="input" placeholder="What needs to be done?" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} id="new-task-title" />
              </div>
              <div className="form-group" style={{ gap: 4 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Category</label>
                <input className="input" placeholder="e.g. Venue, Decor" value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))} id="new-task-cat" />
              </div>
              <div className="form-group" style={{ gap: 4 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Due Date</label>
                <input type="date" className="input" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} id="new-task-date" />
              </div>
              <div className="form-group" style={{ gap: 4 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Priority</label>
                <div className="select-wrapper">
                  <select className="select" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as TaskPriority }))} id="new-task-priority">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleAddTask} className="btn btn-primary btn-sm" style={{ marginBottom: 0 }} id="save-task-btn"><Check size={14} /></button>
              <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-sm"><X size={14} /></button>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit Task">
            <div className="modal" style={{ maxWidth: 500 }}>
              <div className="modal-header">
                <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Edit Task</h2>
                <button onClick={() => setEditingTask(null)} className="btn btn-icon btn-ghost btn-sm" aria-label="Close modal">
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    className="input"
                    value={editingTask.title}
                    onChange={e => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                    id="edit-task-title"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <div className="select-wrapper">
                      <select
                        className="select"
                        value={editingTask.priority}
                        onChange={e => setEditingTask(prev => prev ? { ...prev, priority: e.target.value as TaskPriority } : null)}
                        id="edit-task-priority"
                      >
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      className="input"
                      value={editingTask.category || ''}
                      onChange={e => setEditingTask(prev => prev ? { ...prev, category: e.target.value } : null)}
                      placeholder="e.g. Venue, Catering"
                      id="edit-task-category"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="input"
                    value={editingTask.dueDate || ''}
                    onChange={e => setEditingTask(prev => prev ? { ...prev, dueDate: e.target.value } : null)}
                    id="edit-task-date"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description / Notes</label>
                  <textarea
                    className="textarea"
                    value={editingTask.description || ''}
                    onChange={e => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Details about this task..."
                    id="edit-task-desc"
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={() => setEditingTask(null)} className="btn btn-ghost btn-sm">Cancel</button>
                  <button onClick={handleSaveEdit} className="btn btn-primary btn-sm" id="save-edit-task-btn">
                    <Check size={14} /> Save Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><Calendar size={28} /></div>
            <h3 className="empty-state__title">No tasks yet</h3>
            <p className="empty-state__desc">Add tasks manually or use AI to generate a preparation checklist.</p>
            <button onClick={handleGenerateChecklist} disabled={generatingChecklist} className="btn btn-primary" id="empty-ai-checklist-btn">
              <Bot size={16} /> Generate AI Checklist
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(task => {
              const taskDays = daysUntil(task.dueDate);
              const isOverdue = taskDays !== null && taskDays < 0 && !task.completed;
              return (
                <div key={task.id} className="card" style={{ padding: '0.875rem 1.25rem', opacity: task.completed ? 0.65 : 1, transition: 'opacity 200ms' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <button
                      onClick={() => handleToggle(task)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: `2px solid ${task.completed ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: task.completed ? 'var(--color-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 150ms',
                        marginTop: 1,
                      }}
                      aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                      id={`task-toggle-${task.id}`}
                    >
                      {task.completed && <Check size={12} color="#fff" />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                          {task.title}
                        </span>
                        <span className={`badge ${getPriorityColor(task.priority)}`} style={{ fontSize: '0.6rem' }}>{task.priority}</span>
                        {task.category && <span className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>{task.category}</span>}
                      </div>
                      {task.description && <p style={{ fontSize: '0.775rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>{task.description}</p>}
                      {task.dueDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.75rem', color: isOverdue ? 'var(--color-error)' : 'var(--color-text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
                          <Clock size={12} />
                          {isOverdue ? 'Overdue: ' : ''}{formatDate(task.dueDate, 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setEditingTask(task)} className="btn btn-icon btn-ghost btn-sm" aria-label="Edit task" id={`task-edit-${task.id}`} title="Edit Task">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(task.id)} className="btn btn-icon btn-ghost btn-sm" aria-label="Delete task" id={`task-delete-${task.id}`} title="Delete Task">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
