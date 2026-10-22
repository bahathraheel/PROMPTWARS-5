import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, DollarSign, AlertTriangle, Download, Bot, X, Check } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getEvent, getBudgetCategories, addBudgetCategory, updateBudgetCategory, deleteBudgetCategory, getExpenses, addExpense, deleteExpense } from '../../services/firestoreService';
import { optimizeBudget } from '../../services/aiService';
import type { Event, BudgetCategory, Expense } from '../../../shared/types/index';
import { formatCurrency, percentage, sum, downloadFile, objectsToCSV } from '../../utils/helpers';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#7652D6','#21845B','#2B6CB0','#B7791F','#C53030','#9B7EE0','#4B2B91','#34D399','#63B3ED','#F6AD55'];

const DEFAULT_CATEGORIES = [
  'Venue', 'Catering', 'Decor', 'Photography', 'Entertainment', 'Transportation', 'Attire', 'Invitations', 'Miscellaneous'
];

export default function BudgetPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);

  const [newCat, setNewCat] = useState({ name: '', estimatedCost: '' });
  const [newExp, setNewExp] = useState({ description: '', amount: '', categoryId: '', isPaid: false });

  useEffect(() => {
    if (!eventId || !user) return;
    Promise.all([
      getEvent(eventId),
      getBudgetCategories(eventId),
      getExpenses(eventId),
    ]).then(([ev, cats, exps]) => {
      setEvent(ev);
      setCategories(cats);
      setExpenses(exps);
      setLoading(false);
    });
  }, [eventId, user]);

  // ─── Calculations (in app code, not AI) ──────────────────────────
  const totalEstimated = sum(categories.map(c => c.estimatedCost));
  const totalActual = sum(categories.map(c => c.actualCost));
  const totalPaid = sum(categories.map(c => c.amountPaid));
  const remaining = (event?.budget || 0) - totalActual;
  const isOverBudget = event ? totalActual > event.budget : false;
  const budgetUsedPct = event?.budget ? percentage(totalActual, event.budget) : 0;

  const chartData = categories.map((c, i) => ({
    name: c.name,
    value: c.estimatedCost,
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0);

  const handleAddCategory = async () => {
    if (!newCat.name || !eventId || !user) return;
    try {
      const id = await addBudgetCategory({
        eventId, userId: user.uid,
        name: newCat.name,
        estimatedCost: parseFloat(newCat.estimatedCost) || 0,
        actualCost: 0, amountPaid: 0,
      });
      const cat: BudgetCategory = {
        id, eventId, userId: user.uid,
        name: newCat.name,
        estimatedCost: parseFloat(newCat.estimatedCost) || 0,
        actualCost: 0, amountPaid: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCategories(prev => [...prev, cat]);
      setNewCat({ name: '', estimatedCost: '' });
      setShowAddCategory(false);
      toast.success('Category added!');
    } catch { toast.error('Failed to add category.'); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteBudgetCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  const handleAddExpense = async () => {
    if (!newExp.description || !newExp.amount || !eventId || !user) return;
    try {
      const id = await addExpense({
        eventId, userId: user.uid,
        categoryId: newExp.categoryId,
        description: newExp.description,
        amount: parseFloat(newExp.amount),
        isPaid: newExp.isPaid,
        date: new Date().toISOString(),
      });
      const exp: Expense = {
        id, eventId, userId: user.uid,
        categoryId: newExp.categoryId,
        description: newExp.description,
        amount: parseFloat(newExp.amount),
        isPaid: newExp.isPaid,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Update category actual cost
      if (newExp.categoryId) {
        const cat = categories.find(c => c.id === newExp.categoryId);
        if (cat) {
          const newActual = cat.actualCost + exp.amount;
          const newPaid = cat.amountPaid + (exp.isPaid ? exp.amount : 0);
          await updateBudgetCategory(cat.id, { actualCost: newActual, amountPaid: newPaid });
          setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, actualCost: newActual, amountPaid: newPaid } : c));
        }
      }
      setExpenses(prev => [...prev, exp]);
      setNewExp({ description: '', amount: '', categoryId: '', isPaid: false });
      setShowAddExpense(false);
      toast.success('Expense added!');
    } catch { toast.error('Failed to add expense.'); }
  };

  const handleDeleteExpense = async (exp: Expense) => {
    try {
      await deleteExpense(exp.id);
      // Reverse the cost from category
      if (exp.categoryId) {
        const cat = categories.find(c => c.id === exp.categoryId);
        if (cat) {
          const newActual = Math.max(0, cat.actualCost - exp.amount);
          const newPaid = Math.max(0, cat.amountPaid - (exp.isPaid ? exp.amount : 0));
          await updateBudgetCategory(cat.id, { actualCost: newActual, amountPaid: newPaid });
          setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, actualCost: newActual, amountPaid: newPaid } : c));
        }
      }
      setExpenses(prev => prev.filter(e => e.id !== exp.id));
      toast.success('Expense deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  const handleExportCSV = () => {
    const data = categories.map(c => ({
      Category: c.name,
      'Estimated Cost': c.estimatedCost,
      'Actual Cost': c.actualCost,
      'Amount Paid': c.amountPaid,
      'Remaining': c.estimatedCost - c.actualCost,
      'Over Budget': c.actualCost > c.estimatedCost ? 'YES' : 'NO',
    }));
    downloadFile(objectsToCSV(data), `budget_${eventId}.csv`);
    toast.success('Budget exported!');
  };

  const handleOptimize = async () => {
    if (!event) return;
    setOptimizing(true);
    try {
      const result = await optimizeBudget(
        event as unknown as Record<string, unknown>,
        categories.map(c => ({ category: c.name, amount: c.estimatedCost }))
      );
      setAiSuggestions(result.overallAdvice + '\n\n' + result.suggestions.map(s => `• **${s.category}**: ${s.savingTip}`).join('\n'));
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message || 'AI optimization failed.');
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return <AppLayout eventId={eventId} title="Budget Manager"><div className="page-content">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 12 }} />)}</div></AppLayout>;
  }

  return (
    <AppLayout eventId={eventId} title="Budget Manager">
      <div className="page-content">
        {/* Header */}
        <div className="section-header">
          <div>
            <h1 className="section-title">Budget Manager</h1>
            <p className="section-subtitle">Track every expense for {event?.name}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" id="export-budget-btn"><Download size={14} /> Export CSV</button>
            <button onClick={() => setShowAddCategory(true)} className="btn btn-primary btn-sm" id="add-category-btn"><Plus size={14} /> Add Category</button>
          </div>
        </div>

        {/* Over budget alert */}
        {isOverBudget && (
          <div className="alert alert--error" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle size={16} />
            <div>
              <strong>Over Budget!</strong> Your actual costs exceed your event budget by{' '}
              {formatCurrency(totalActual - (event?.budget || 0), event?.currency)}.
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Budget',   value: formatCurrency(event?.budget || 0, event?.currency), color: '#7652D6' },
            { label: 'Total Estimated',value: formatCurrency(totalEstimated, event?.currency),     color: '#2B6CB0' },
            { label: 'Total Spent',    value: formatCurrency(totalActual, event?.currency),        color: isOverBudget ? '#C53030' : '#21845B' },
            { label: 'Total Paid',     value: formatCurrency(totalPaid, event?.currency),          color: '#21845B' },
            { label: 'Remaining',      value: formatCurrency(Math.abs(remaining), event?.currency), color: remaining < 0 ? '#C53030' : '#B7791F' },
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <div className="stat-card__value" style={{ color: stat.color, fontSize: '1.4rem' }}>{stat.value}</div>
              <div className="stat-card__label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Budget Progress */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Budget Utilization</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: isOverBudget ? 'var(--color-error)' : 'var(--color-primary)' }}>{budgetUsedPct}%</span>
          </div>
          <div className="progress" style={{ height: 10 }}>
            <div className={`progress-bar ${budgetUsedPct > 100 ? 'progress-bar--error' : budgetUsedPct > 75 ? 'progress-bar--warning' : ''}`} style={{ width: `${Math.min(budgetUsedPct, 100)}%` }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          {/* Categories Table */}
          <div>
            {/* Add Category Form */}
            {showAddCategory && (
              <div className="card" style={{ marginBottom: '1rem', background: 'var(--color-lavender)' }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div className="select-wrapper" style={{ flex: 1, minWidth: 140 }}>
                    <select className="select" value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} id="new-cat-name">
                      <option value="">Select Category...</option>
                      {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <input className="input" style={{ width: 140 }} type="number" placeholder="Estimated cost" value={newCat.estimatedCost} onChange={e => setNewCat(p => ({ ...p, estimatedCost: e.target.value }))} id="new-cat-cost" />
                  <button onClick={handleAddCategory} className="btn btn-primary btn-sm"><Check size={14} /></button>
                  <button onClick={() => setShowAddCategory(false)} className="btn btn-ghost btn-sm"><X size={14} /></button>
                </div>
              </div>
            )}

            {categories.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon"><DollarSign size={28} /></div>
                <h3 className="empty-state__title">No budget categories yet</h3>
                <p className="empty-state__desc">Add categories to start tracking your event budget.</p>
                <button onClick={() => setShowAddCategory(true)} className="btn btn-primary"><Plus size={16} /> Add First Category</button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Estimated</th>
                      <th>Actual</th>
                      <th>Paid</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(cat => {
                      const over = cat.actualCost > cat.estimatedCost;
                      return (
                        <tr key={cat.id}>
                          <td style={{ fontWeight: 600 }}>{cat.name}</td>
                          <td>{formatCurrency(cat.estimatedCost, event?.currency)}</td>
                          <td style={{ color: over ? 'var(--color-error)' : 'var(--color-text)' }}>{formatCurrency(cat.actualCost, event?.currency)}</td>
                          <td>{formatCurrency(cat.amountPaid, event?.currency)}</td>
                          <td>
                            <span className={`badge ${over ? 'badge-error' : cat.actualCost > 0 ? 'badge-warning' : 'badge-neutral'}`}>
                              {over ? 'Over Budget' : cat.actualCost > 0 ? `${percentage(cat.actualCost, cat.estimatedCost)}%` : 'Not Started'}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="btn btn-icon btn-ghost btn-sm" aria-label="Delete category"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Expenses */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Expenses</h3>
                <button onClick={() => setShowAddExpense(true)} className="btn btn-secondary btn-sm" id="add-expense-btn"><Plus size={14} /> Add Expense</button>
              </div>

              {showAddExpense && (
                <div className="card" style={{ marginBottom: '1rem', background: 'var(--color-lavender)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: 8, alignItems: 'end' }}>
                    <div className="form-group" style={{ gap: 4 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Description</label>
                      <input className="input" placeholder="Expense description" value={newExp.description} onChange={e => setNewExp(p => ({ ...p, description: e.target.value }))} id="new-exp-desc" />
                    </div>
                    <div className="form-group" style={{ gap: 4 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Amount ({event?.currency})</label>
                      <input className="input" type="number" placeholder="0" value={newExp.amount} onChange={e => setNewExp(p => ({ ...p, amount: e.target.value }))} id="new-exp-amount" />
                    </div>
                    <div className="form-group" style={{ gap: 4 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Category</label>
                      <div className="select-wrapper" style={{ minWidth: 120 }}>
                        <select className="select" value={newExp.categoryId} onChange={e => setNewExp(p => ({ ...p, categoryId: e.target.value }))} id="new-exp-cat">
                          <option value="">None</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', cursor: 'pointer', paddingBottom: 2 }}>
                      <input type="checkbox" checked={newExp.isPaid} onChange={e => setNewExp(p => ({ ...p, isPaid: e.target.checked }))} />
                      Paid
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={handleAddExpense} className="btn btn-primary btn-sm"><Check size={14} /></button>
                      <button onClick={() => setShowAddExpense(false)} className="btn btn-ghost btn-sm"><X size={14} /></button>
                    </div>
                  </div>
                </div>
              )}

              {expenses.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No expenses recorded yet.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Description</th><th>Category</th><th>Amount</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {expenses.map(exp => (
                        <tr key={exp.id}>
                          <td>{exp.description}</td>
                          <td>{categories.find(c => c.id === exp.categoryId)?.name || '—'}</td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount, event?.currency)}</td>
                          <td><span className={`badge ${exp.isPaid ? 'badge-success' : 'badge-warning'}`}>{exp.isPaid ? 'Paid' : 'Pending'}</span></td>
                          <td><button onClick={() => handleDeleteExpense(exp)} className="btn btn-icon btn-ghost btn-sm" aria-label="Delete expense"><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right — Chart & AI */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {chartData.length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Budget Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                      {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val, event?.currency)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* AI Optimization */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>AI Budget Optimizer</h3>
                <button onClick={handleOptimize} disabled={optimizing || categories.length === 0} className="btn btn-secondary btn-sm" id="optimize-budget-btn">
                  {optimizing ? 'Analyzing...' : <><Bot size={14} /> Optimize</>}
                </button>
              </div>
              {aiSuggestions ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {aiSuggestions}
                  <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    ⚠️ AI suggestions are advisory. Verify costs with actual vendors.
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Click "Optimize" to get AI recommendations for better budget allocation.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
