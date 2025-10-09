import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Check, Edit2, Trash2, X, Eye, Filter, Calendar } from 'lucide-react';
import { useAuth } from '../AuthContext';

const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = ['To Do', 'In Progress', 'Done'];
const ITEMS_PER_PAGE_OPTIONS = [6, 9, 12, 18, 24];
const TASKS_PER_PAGE = 9;

// ==================== DELETE CONFIRMATION MODAL ====================
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, taskName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-[450px] w-[90%] shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[slideIn_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
  
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="text-red-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1e293b] m-0">Delete Task?</h2>
            <p className="text-sm text-slate-500 m-0">This action cannot be undone</p>
          </div>
        </div>

        {/* Content */}
        <div className="my-5 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-sm text-slate-700 m-0">
            Are you sure you want to delete <strong className="text-red-600">"{taskName}"</strong>?
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button 
            className="px-5 py-2.5 bg-slate-100 text-slate-700 border-2 border-slate-200 rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 hover:bg-slate-200 hover:border-slate-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-5 py-2.5 bg-red-600 text-white border-none rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 shadow-[0_2px_6px_rgba(220,38,38,0.3)] hover:bg-red-700 hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(220,38,38,0.4)] flex items-center gap-2"
            onClick={onConfirm}
          >
            <Trash2 size={16} />
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== PAGINATION COMPONENT ====================
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-2 my-8 mb-6 flex-wrap">
      <button
        className="min-w-[40px] h-10 flex items-center justify-center border-2 border-gray-200 bg-white text-[#2563eb] rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 px-2 hover:border-[#2563eb] hover:bg-[#2563eb]/10 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-slate-400 disabled:hover:transform-none disabled:hover:border-gray-200 disabled:hover:bg-gray-50"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &lt;
      </button>

      {getPageNumbers().map((page, idx) => (
        <button
          key={idx}
          className={`min-w-[40px] h-10 flex items-center justify-center border-2 rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 px-2 ${
          page === currentPage
            ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-[0_4px_8px_rgba(37,99,235,0.18)]'
              : page === '...' 
              ? 'border-gray-200 bg-white text-slate-500 cursor-default' 
              : 'border-gray-200 bg-white text-[#2563eb] hover:border-[#2563eb] hover:bg-[#2563eb]/10 hover:-translate-y-px'
          }`}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
        >
          {page}
        </button>
      ))}

      <button
        className="min-w-[40px] h-10 flex items-center justify-center border-2 border-gray-200 bg-white text-[#2563eb] rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 px-2 hover:border-[#2563eb] hover:bg-[#2563eb]/10 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-slate-400 disabled:hover:transform-none disabled:hover:border-gray-200 disabled:hover:bg-gray-50"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        &gt;
      </button>
    </div>
  );
}

// ==================== TASK PROGRESS BAR COMPONENT ====================
function TaskProgressBar({ progress, onProgressChange, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);
  const progressRef = useRef(null);
  const initialProgressRef = useRef(progress);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  const updateProgress = (e) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setLocalProgress(newProgress);
  };

  const handleMouseDown = (e) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    initialProgressRef.current = Math.round(progress);
    updateProgress(e);
  };

  const handleTouchStart = (e) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    setIsDragging(true);
    initialProgressRef.current = Math.round(progress);
    
    const touch = e.touches[0];
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setLocalProgress(newProgress);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (disabled) return;
      e.preventDefault();
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        if (!progressRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newProgress = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setLocalProgress(newProgress);
      });
    };

    const handleTouchMove = (e) => {
      if (disabled) return;
      e.preventDefault();
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        if (!progressRef.current) return;
        const touch = e.touches[0];
        const rect = progressRef.current.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const newProgress = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setLocalProgress(newProgress);
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
      const roundedProgress = Math.round(localProgress);
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      if (roundedProgress !== initialProgressRef.current) {
        onProgressChange(roundedProgress);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isDragging, localProgress, disabled, onProgressChange]);

  const getStatusFromProgress = (prog) => {
    if (prog === 0) return 'To Do';
    if (prog >= 100) return 'Done';
    return 'In Progress';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'To Do': return 'text-amber-600';
      case 'In Progress': return 'text-blue-600';
      case 'Done': return 'text-green-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="mt-3 p-3 bg-slate-200/10 rounded-lg border border-[#2563eb]/20">
      <div className="flex justify-between mb-2 text-xs font-semibold">
        <span className="text-slate-500 uppercase tracking-wider">Progress</span>
        <span className="text-[#2563eb] font-bold">{Math.round(localProgress)}%</span>
      </div>
      <div 
        ref={progressRef}
        className={`relative w-full h-5 bg-slate-400/20 rounded-full mb-2 transition-all duration-200 touch-none group ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-400/30'
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        title={disabled ? "Task is overdue - Contact admin to modify" : "Drag to update progress"}
      >
        <div 
          className="h-full bg-gradient-to-r from-[#2563eb] to-[#3b82f6] rounded-full transition-[width] duration-[50ms] linear relative"
          style={{ width: `${localProgress}%` }}
        />
        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#2563eb] rounded-full shadow-md z-10 transition-all duration-200 ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab hover:scale-110 hover:border-[#2563eb] hover:shadow-lg active:cursor-grabbing active:scale-90'
          }`}
          style={{ left: `calc(${localProgress}% - 8px)` }}
        />
        {disabled && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-red-600/95 text-white px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200 z-[100] group-hover:opacity-100">
            Task is overdue - Contact admin to modify
          </div>
        )}
      </div>
      <div className={`text-center text-[11px] font-semibold uppercase tracking-wider ${getStatusColor(getStatusFromProgress(localProgress))}`}>
        {getStatusFromProgress(localProgress)}
      </div>
    </div>
  );
}

// ==================== ASSIGNEE DROPDOWN COMPONENT ====================
function AssigneeDropdown({ value, onChange, options, getMemberNameById, hasError }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative min-w-[120px]" ref={ref}>
      <div
        className={`bg-white border-2 rounded-lg p-3 text-base select-none transition-all duration-200 cursor-pointer ${
          hasError ? 'border-red-600' : 'border-gray-200 hover:border-[#2563eb]'
        }`}
        onClick={() => setOpen(o => !o)}
      >
        {value.length
          ? value.map(id => getMemberNameById(id)).join(', ')
          : 'Assign to...'}
        <span className="float-right font-bold">▼</span>
      </div>
      {open && (
        <div className="absolute top-[110%] left-0 bg-white/95 border-2 border-[#2563eb]/20 rounded-lg shadow-[0_8px_24px_rgba(37,99,235,0.12)] z-10 min-w-[120px] py-2 backdrop-blur-[10px]">
          {options.map(member => (
            <label key={member.id} className="flex items-center px-4 py-2 text-[15px] cursor-pointer transition-colors duration-200 text-[#2563eb] hover:bg-[#2563eb]/10">
              <input
                type="checkbox"
                checked={value.includes(member.id)}
                onChange={e => {
                  if (e.target.checked) {
                    onChange([...value, member.id]);
                  } else {
                    onChange(value.filter(id => id !== member.id));
                  }
                }}
                className="mr-2 accent-[#2563eb]"
              />
              <span className={value.includes(member.id) ? 'font-bold text-[#2563eb]' : ''}>{member.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== FILTER MODAL COMPONENT ====================
function FilterModal({ 
  isOpen, 
  onClose, 
  filter, 
  setFilter,
  priorityFilter,
  setPriorityFilter,
  assigneeFilter,
  setAssigneeFilter,
  deadlineFilter,
  setDeadlineFilter,
  users 
}) {
  const [tempFilter, setTempFilter] = useState(filter);
  const [tempPriorityFilter, setTempPriorityFilter] = useState(priorityFilter);
  const [tempAssigneeFilter, setTempAssigneeFilter] = useState(assigneeFilter);
  const [tempDeadlineFilter, setTempDeadlineFilter] = useState(deadlineFilter);

  useEffect(() => {
    if (isOpen) {
      setTempFilter(filter);
      setTempPriorityFilter(priorityFilter);
      setTempAssigneeFilter(assigneeFilter);
      setTempDeadlineFilter(deadlineFilter);
    }
  }, [isOpen, filter, priorityFilter, assigneeFilter, deadlineFilter]);

  if (!isOpen) return null;

  const clearAllFilters = () => {
    setTempFilter('All');
    setTempPriorityFilter('All');
    setTempAssigneeFilter('All');
    setTempDeadlineFilter('All');
  };

  const applyFilters = () => {
    setFilter(tempFilter);
    setPriorityFilter(tempPriorityFilter);
    setAssigneeFilter(tempAssigneeFilter);
    setDeadlineFilter(tempDeadlineFilter);
    onClose();
  };

  const hasActiveFilters = tempFilter !== 'All' || tempPriorityFilter !== 'All' || 
                          tempAssigneeFilter !== 'All' || tempDeadlineFilter !== 'All';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-[500px] w-[90%] shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[slideIn_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-5 pb-4 border-b-2 border-[#2563eb]/10">
          <h2 className="text-2xl font-bold text-[#2563eb] m-0 flex-1 mr-4 leading-tight">Filter Tasks</h2>
          <button className="bg-transparent border-none text-2xl text-slate-500 cursor-pointer p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:bg-red-600/10 hover:text-red-600" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-5 my-5">
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-green-600 text-sm uppercase tracking-wide">Status</label>
          <select
            value={tempFilter}
            onChange={e => setTempFilter(e.target.value)}
            className="p-3 px-4 rounded-lg border-2 border-gray-200 bg-white text-sm text-slate-700 outline-none transition-all duration-200 cursor-pointer focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
          >
            <option value="All">All Status</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-red-600 text-sm uppercase tracking-wide">Priority</label>
          <select
            value={tempPriorityFilter}
            onChange={e => setTempPriorityFilter(e.target.value)}
            className="p-3 px-4 rounded-lg border-2 border-gray-200 bg-white text-sm text-slate-700 outline-none transition-all duration-200 cursor-pointer focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
          >
            <option value="All">All Priorities</option>
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-purple-600 text-sm uppercase tracking-wide">Assignee</label>
          <select
            value={tempAssigneeFilter}
            onChange={e => setTempAssigneeFilter(e.target.value)}
            className="p-3 px-4 rounded-lg border-2 border-gray-200 bg-white text-sm text-slate-700 outline-none transition-all duration-200 cursor-pointer focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
          >
            <option value="All">All Assignees</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-orange-600 text-sm uppercase tracking-wide">Deadline</label>
          <select
            value={tempDeadlineFilter}
            onChange={e => setTempDeadlineFilter(e.target.value)}
            className="p-3 px-4 rounded-lg border-2 border-gray-200 bg-white text-sm text-slate-700 outline-none transition-all duration-200 cursor-pointer focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
          >
            <option value="All">All Dates</option>
            <option value="Overdue">Overdue</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
          </select>
        </div>
      </div>

        <div className="flex justify-end gap-3 mt-5 pt-5 border-t-2 border-[#2563eb]/10">
          {hasActiveFilters && (
            <button 
              className="px-5 py-2.5 bg-red-600/10 text-red-600 border-2 border-red-600/20 rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 hover:bg-red-600/20 hover:border-red-600"
              onClick={clearAllFilters}
            >
              Clear All Filters
            </button>
          )}
          <button 
            className="px-6 py-2.5 bg-[#2563eb] text-white border-none rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 shadow-[0_2px_6px_rgba(37,99,235,0.12)] hover:bg-[#2563eb] hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(37,99,235,0.18)]"
            onClick={applyFilters}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== TASK DETAILS MODAL COMPONENT ====================
function TaskDetailsModal({ 
  task, 
  onClose, 
  onUpdateTask, 
  onDelete, 
  isAdmin, 
  users, 
  getMemberNameById, 
  validateTask, 
  apiRequest 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [modalErrors, setModalErrors] = useState({});

  if (!task) return null;

  const enterEditMode = () => {
    setEditingTask({
      text: task.text,
      description: task.description || '',
      assignee: task.assignees || [],
      deadline: task.deadline || '',
      priority: task.priority || 'Medium',
      status: task.status || 'To Do',
      completed: task.completed,
      progress: task.progress || 0
    });
    setIsEditing(true);
    setModalErrors({});
  };

  const saveModalEdit = async () => {
    const validationErrors = validateTask(editingTask);
    setModalErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      text: editingTask.text.trim(),
      description: editingTask.description?.trim() || '',
      assignees: editingTask.assignee,
      deadline: editingTask.deadline || '',
      priority: editingTask.priority || 'Medium',
      status: editingTask.status || 'To Do',
      completed: editingTask.completed,
      progress: editingTask.progress || 0,
      requesterType: 'admin'
    };

    try {
      const res = await apiRequest(`http://localhost:3001/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onUpdateTask(task.id, payload);
        setIsEditing(false);
        onClose();
      } else {
        const err = await res.json();
        alert('Error updating task: ' + err.error);
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingTask(null);
    setModalErrors({});
  };

  const updateTaskProgressInModal = async (newProgress) => {
    if (!task) return;

    if (!isAdmin && task.deadline && !task.completed) {
      const deadlineDate = new Date(task.deadline);
      const today = new Date();
      deadlineDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate < today) {
        alert('This task is overdue. Please contact an administrator to modify it.');
        return;
      }
    }

    let newStatus = task.status;
    let newCompleted = task.completed;

    if (newProgress === 0) {
      newStatus = 'To Do';
      newCompleted = false;
    } else if (newProgress === 100) {
      newStatus = 'Done';
      newCompleted = true;
    } else {
      newStatus = 'In Progress';
      newCompleted = false;
    }

    const payload = {
      ...task,
      progress: newProgress,
      status: newStatus,
      completed: newCompleted
    };

    onUpdateTask(task.id, payload);

    try {
      const response = await apiRequest(`http://localhost:3001/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        alert('Error: ' + error.error);
        onUpdateTask(task.id, task);
      }
    } catch (error) {
      console.error('Error updating task progress:', error);
      alert('Network error: ' + error.message);
      onUpdateTask(task.id, task);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'medium': return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
      case 'low': return 'bg-green-500/20 text-green-600 border-green-500/30';
      default: return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
    }
  };

  const getStatusClass = (status, completed) => {
  if (completed) return 'bg-green-500/10 text-green-600 font-semibold border-green-500/20';
  switch (status?.toLowerCase()) {
    case 'in progress': return 'bg-blue-500/10 text-blue-600 font-semibold border-blue-500/20';
    case 'to do': return 'bg-amber-500/10 text-amber-600 font-semibold border-amber-500/20';
    case 'done': return 'bg-green-500/10 text-green-600 font-semibold border-green-500/20';
    default: return 'bg-amber-500/10 text-amber-600 font-semibold border-amber-500/20';
  }
};

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-[600px] w-[90%] max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[slideIn_0.3s_ease-out] relative [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-[#2563eb]/10">
          <h2 className="text-2xl font-bold text-[#2563eb] m-0 flex-1 mr-4 leading-tight">
            {isEditing ? (
              <div className="w-full">
                <input
                  type="text"
                  value={editingTask.text}
                  onChange={e => setEditingTask({ ...editingTask, text: e.target.value })}
                  className="w-full p-1 px-2 border-2 border-gray-200 rounded text-2xl font-bold m-0 outline-none transition-all duration-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
                  autoFocus
                />
                {modalErrors.text && <span className="text-red-600 text-xs mt-1 block">{modalErrors.text}</span>}
              </div>
            ) : (
              task.text
            )}
          </h2>
          <button className="bg-transparent border-none text-2xl text-slate-500 cursor-pointer p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:bg-red-600/10 hover:text-red-600" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-5">
          {/* Description */}
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-blue-600 text-sm uppercase tracking-wide">Description</div>
            {isEditing ? (
              <>
                <textarea
                  value={editingTask.description}
                  onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="min-h-[80px] resize-y p-1 px-2 border-2 border-gray-200 rounded text-base outline-none transition-all duration-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
                  placeholder="Task description..."
                />
                {modalErrors.description && <span className="text-red-600 text-xs mt-1 block">{modalErrors.description}</span>}
              </>
            ) : (
              <div className="p-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg text-[#64748b] text-base leading-normal min-h-[20px] whitespace-pre-wrap">
                {task.description || 'No description provided'}
              </div>
            )}
          </div>

          {/* Assignees */}
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-purple-600 text-sm uppercase tracking-wide">Assigned To</div>
            {isEditing ? (
              <>
                <AssigneeDropdown
                  value={editingTask.assignee}
                  onChange={assignee => setEditingTask({ ...editingTask, assignee })}
                  options={users}
                  getMemberNameById={getMemberNameById}
                  hasError={!!modalErrors.assignee}
                />
                {modalErrors.assignee && <span className="text-red-600 text-xs mt-1 block">{modalErrors.assignee}</span>}
              </>
            ) : (
              <div className="p-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg text-[#64748b] text-base leading-normal min-h-[20px]">
                {Array.isArray(task.assignees) && task.assignees.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(task.assigneeNames || task.assignees.map(id => getMemberNameById(id, task))).map((name, index) => (
                      <span key={index} className="bg-[#2563eb] text-white px-3 py-1.5 rounded-2xl text-sm font-medium">
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-red-600 italic">Unassigned</span>
                )}
              </div>
            )}
          </div>

          {/* Deadline */}
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-orange-600 text-sm uppercase tracking-wide">Deadline</div>
            {isEditing ? (
              <>
                <input
                  type="date"
                  value={editingTask.deadline}
                  onChange={e => setEditingTask({ ...editingTask, deadline: e.target.value })}
                  className="p-1 px-2 border-2 border-gray-200 rounded text-base outline-none transition-all duration-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
                  min={new Date().toISOString().split('T')[0]}
                />
                {modalErrors.deadline && <span className="text-red-600 text-xs mt-1 block">{modalErrors.deadline}</span>}
              </>
            ) : (
              <div className="p-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg text-[#64748b] text-base leading-normal min-h-[20px]">
                {formatDate(task.deadline)}
                {task.deadline && (() => {
                  const deadlineDate = new Date(task.deadline);
                  const today = new Date();
                  deadlineDate.setHours(0, 0, 0, 0);
                  today.setHours(0, 0, 0, 0);
                  return deadlineDate < today && !task.completed;
                })() && (
                  <span className="text-red-600 ml-2 font-bold">(Overdue)</span>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-green-600 text-sm uppercase tracking-wide">Status</div>
            {isEditing ? (
              <select
                value={editingTask.status}
                onChange={e => setEditingTask({ ...editingTask, status: e.target.value })}
                className="p-1 px-2 border-2 border-gray-200 rounded text-base outline-none transition-all duration-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <div className={`p-3 px-4 border-2 border-[#2563eb]/10 rounded-lg text-base leading-normal min-h-[20px] ${getStatusClass(task.status, task.completed)}`}>
                {task.completed ? 'Completed ✓' : task.status || 'To Do'}
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-red-600 text-sm uppercase tracking-wide">Priority</div>
            {isEditing ? (
              <select
                value={editingTask.priority}
                onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })}
                className="p-1 px-2 border-2 border-gray-200 rounded text-base outline-none transition-all duration-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <div className="p-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg text-[#64748b] text-base leading-normal min-h-[20px]">
                <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${getPriorityClass(task.priority)}`}>
                  {task.priority || 'Medium'}
                </span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-blue-600 text-sm uppercase tracking-wide">Progress</div>
            {isEditing ? (
              <div className="p-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg text-[#64748b] text-base leading-normal min-h-[20px]">
                <TaskProgressBar 
                  progress={editingTask.progress || 0}
                  onProgressChange={(newProgress) => {
                    let newStatus = editingTask.status;
                    if (newProgress === 0) newStatus = 'To Do';
                    else if (newProgress === 100) newStatus = 'Done';
                    else newStatus = 'In Progress';
                    
                    setEditingTask({ 
                      ...editingTask, 
                      progress: newProgress,
                      status: newStatus,
                      completed: newProgress === 100
                    });
                  }}
                  disabled={false}
                />
              </div>
            ) : (
              <div className="p-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg text-[#64748b] text-base leading-normal min-h-[20px]">
                <TaskProgressBar 
                  progress={task.progress || 0}
                  onProgressChange={updateTaskProgressInModal}
                  disabled={!isAdmin && task.deadline && !task.completed && (() => {
                    const deadlineDate = new Date(task.deadline);
                    const today = new Date();
                    deadlineDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    return deadlineDate < today;
                  })()}
                />
              </div>
            )}
          </div>

          {/* Task ID */}
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-slate-600 text-sm uppercase tracking-wide">Task ID</div>
            <div className="p-3 px-4 bg-slate-200/10 border-2 border-[#2563eb]/10 rounded-lg text-slate-500 text-base leading-normal min-h-[20px]">
              #{task.id}
            </div>
          </div>
        </div>

        {/* Footer */}
        {isAdmin && (
          <div className="flex justify-end gap-3 mt-8 pt-5 border-t-2 border-[#2563eb]/10">
            {isEditing ? (
              <>
                <button className="px-6 py-3 bg-[#f1f5f9] text-[#1e293b] border-2 border-[#e2e8f0] rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 flex items-center gap-2 hover:bg-[#e8eef9] hover:border-[#2563eb] hover:text-white" onClick={cancelEdit}>
                  <X size={16} />Cancel
                </button>
                <button className="px-6 py-3 bg-[#2563eb] text-white border-none rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.12)] flex items-center gap-2 hover:bg-[#2563eb] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(37,99,235,0.18)]" onClick={saveModalEdit}>
                  <Check size={16} />Save Changes
                </button>
              </>
            ) : (
              <>
                <button className="px-6 py-3 bg-[#f1f5f9] text-[#1e293b] border-2 border-[#e2e8f0] rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 hover:bg-[#e8eef9] hover:border-[#2563eb] hover:text-white" onClick={onClose}>
                  Close
                </button>
                <button className="px-6 py-3 bg-[#2563eb] text-white border-none rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.12)] flex items-center gap-2 hover:bg-[#2563eb] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(37,99,235,0.18)]" onClick={enterEditMode}>
                  <Edit2 size={16} />Edit
                </button>
                <button
                  className="px-6 py-3 bg-red-600 text-white border-none rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 shadow-[0_4px_12px_rgba(220,38,38,0.3)] flex items-center gap-2 hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(220,38,38,0.4)]"
                  onClick={() => {
                    onClose();
                    // Need to pass deleteModal setter from parent
                    window.deleteTaskFromModal = { id: task.id, name: task.text };
                  }}
                >
                  <Trash2 size={16} />Delete Task
                </button>
              </>
            )}
          </div>
        )}
        {!isAdmin && (
          <div className="flex justify-end gap-3 mt-8 pt-5 border-t-2 border-[#2563eb]/10">
            <button className="px-6 py-3 bg-[#f1f5f9] text-[#1e293b] border-2 border-[#e2e8f0] rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 hover:bg-[#e8eef9] hover:border-[#2563eb] hover:text-white" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== MAIN TASK MANAGER COMPONENT ====================
export default function TaskManager({ user }) {
  const { apiRequest, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [newTask, setNewTask] = useState({
    text: '',
    description: '',
    assignee: [],
    deadline: '',
    priority: 'Medium',
    status: 'To Do',
    progress: 0
  });
  const [editingTask, setEditingTask] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [editingErrors, setEditingErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('All');
  const [itemsPerPage, setItemsPerPage] = useState(TASKS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [deadlineFilter, setDeadlineFilter] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, taskId: null, taskName: '' });
  // ==================== FETCH DATA ====================
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchUsers = async () => {
      try {
        const response = await apiRequest('http://localhost:3001/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data || []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    };

    fetchUsers();
  }, [isAdmin, apiRequest]);

  useEffect(() => {
    if (!user) return;
    
    const fetchTasks = async () => {
      try {
        const response = await apiRequest('http://localhost:3001/tasks');
        if (response.ok) {
          const data = await response.json();
          const normalizedTasks = data.map(task => {
          // Sync based on progress value
          let normalizedStatus = task.status;
          let normalizedProgress = task.progress || 0;
          
          if (task.completed || task.status === 'Done' || normalizedProgress >= 100) {
            normalizedStatus = 'Done';
            normalizedProgress = 100;
          } else if (normalizedProgress === 0) {
            normalizedStatus = 'To Do';
          } else if (normalizedProgress > 0 && normalizedProgress < 100) {
            normalizedStatus = 'In Progress';
          }
          
          return { 
            ...task, 
            status: normalizedStatus,
            progress: normalizedProgress 
          };
        });
          setTasks(normalizedTasks);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]);
      }
    };

    fetchTasks();
  }, [user, apiRequest]);

  // ==================== HELPER FUNCTIONS ====================
  const getMemberNameById = (id, task = null) => {
    if (task && task.assigneeNames && task.assignees) {
      const index = task.assignees.indexOf(id);
      if (index !== -1 && task.assigneeNames[index]) {
        return task.assigneeNames[index];
      }
    }
    
    const member = users.find(m => m.id === id);
    return member ? member.name : `User ${id}`;
  };

  const validateTask = (task) => {
    const errors = {};
    if (!task.text?.trim()) {
      errors.text = 'Task title is required.';
    } else if (task.text.trim().length > 100) {
      errors.text = 'Task title must be 100 characters or less.';
    }
    
    if (!task.description?.trim()) {
      errors.description = 'Task description is required.';
    } else if (task.description.trim().length > 500) {
      errors.description = 'Task description must be 500 characters or less.';
    }
    
    if (!task.assignee || task.assignee.length === 0) errors.assignee = 'Please assign the task to at least one person.';
    if (!task.deadline) {
      errors.deadline = 'Deadline is required.';
    } else {
      const selectedDate = new Date(task.deadline);
      const today = new Date();
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.deadline = 'Deadline cannot be in the past.';
      }
    }
    return errors;
  };

  const handleItemsPerPageChange = (newValue) => {
    setItemsPerPage(newValue);
    setCurrentPage(1);
  };

  // ==================== TASK CRUD OPERATIONS ====================
  const addTask = async () => {
    if (!isAdmin) return;
    const validationErrors = validateTask(newTask);
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    let progress = newTask.progress || 0;
    let completed = false;
    
    if (newTask.status === 'Done') {
      progress = 100;
      completed = true;
    } else if (newTask.status === 'To Do') {
      progress = 0;
      completed = false;
    } else if (newTask.status === 'In Progress') {
       progress = progress > 0 ? progress : 50;
      completed = false;
    }

    const payload = {
      text: newTask.text.trim(),
      description: newTask.description.trim(),
      assignees: newTask.assignee,
      deadline: newTask.deadline,
      priority: newTask.priority,
      status: newTask.status,
      completed: completed,
      progress: progress
    };

    try {
      const response = await apiRequest('http://localhost:3001/tasks', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks([{ 
          ...payload, 
          id: data.id,
          progress: progress,
          completed: completed
        }, ...tasks]);
        
        setNewTask({ 
          text: '', 
          description: '', 
          assignee: [], 
          deadline: '', 
          priority: 'Medium', 
          status: 'To Do',
          progress: 0
        });
        setFormErrors({});
      } else {
        const error = await response.json();
        alert('Error adding task: ' + error.error);
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    }
  };

  const saveEdit = async () => {
    if (!isAdmin) return;
    const validationErrors = validateTask(editingTask);
    setEditingErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      text: editingTask.text.trim(),
      description: editingTask.description?.trim() || '',
      assignees: editingTask.assignee,
      deadline: editingTask.deadline || '',
      priority: editingTask.priority,
      status: editingTask.status,
      completed: editingTask.completed,
      progress: editingTask.progress || 0
    };

    try {
      const response = await apiRequest(`http://localhost:3001/tasks/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setTasks(tasks.map(t => t.id === editingId ? { ...t, ...payload } : t));
        setEditingId(null);
        setEditingTask(null);
        setEditingErrors({});
      } else {
        const error = await response.json();
        alert('Error updating task: ' + error.error);
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    }
  };

  const deleteTask = async (id) => {
  if (!isAdmin) return;
  
  try {
    const response = await apiRequest(`http://localhost:3001/tasks/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      setTasks(tasks.filter(t => t.id !== id));
      setDeleteModal({ isOpen: false, taskId: null, taskName: '' });
    } else {
      const error = await response.json();
      alert('Error deleting task: ' + error.error);
    }
  } catch (error) {
    alert('Network error: ' + error.message);
  }
};

  const toggleComplete = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (!isAdmin && task.deadline && !task.completed) {
      const deadlineDate = new Date(task.deadline);
      const today = new Date();
      deadlineDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate < today) {
        alert('This task is overdue. Please contact an administrator.');
        return;
      }
    }

    const newCompleted = !task.completed;
    let newStatus = task.status;
    let newProgress = task.progress || 0;

    if (newCompleted) {
      newStatus = 'Done';
      newProgress = 100;
    } else {
      if (task.status === 'Done') {
        newStatus = 'To Do';
        newProgress = 0;
      }
    }

    const payload = {
      ...task,
      completed: newCompleted,
      status: newStatus,
      progress: newProgress
    };

    try {
      const response = await apiRequest(`http://localhost:3001/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setTasks(tasks.map(t =>
          t.id === id ? { ...t, completed: newCompleted, status: newStatus, progress: newProgress } : t
        ));
      } else {
        const error = await response.json();
        alert('Error updating task: ' + error.error);
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    }
  };

  const updateTaskProgress = async (taskId, newProgress) => {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  let newStatus = task.status;
  let newCompleted = task.completed;
  
  if (newProgress === 0) {
    newStatus = 'To Do';
    newCompleted = false;
  } else if (newProgress === 100) {
    newStatus = 'Done';
    newCompleted = true;
  } else if (newProgress > 0 && newProgress < 100) {
    newStatus = 'In Progress';
    newCompleted = false;
  }

    const payload = {
      ...task,
      progress: newProgress,
      status: newStatus,
      completed: newCompleted
    };

    try {
      const response = await apiRequest(`http://localhost:3001/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setTasks(tasks.map(t =>
          t.id === taskId ? { ...t, progress: newProgress, status: newStatus, completed: newCompleted } : t
        ));
      }
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  };

  const startEditing = (task) => {
    if (!isAdmin) return;
    setEditingId(task.id);
    setEditingTask({ ...task, assignee: task.assignees || [] });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTask(null);
    setEditingErrors({});
  };

  const openTaskDetails = (task) => setSelectedTask(task);
  const closeTaskDetails = () => setSelectedTask(null);

  // ==================== BULK ACTIONS ====================
  const toggleTaskSelection = (taskId) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id));
    }
  };

  const bulkMarkAsDone = async () => {
    if (selectedTaskIds.length === 0) return;
    if (showBulkConfirm !== 'done') {
      setShowBulkConfirm('done');
      return;
    }

    try {
      const updates = selectedTaskIds.map(async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const payload = {
          ...task,
          completed: true,
          status: 'Done',
          progress: 100
        };

        const response = await apiRequest(`http://localhost:3001/tasks/${taskId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        return response.ok ? taskId : null;
      });

      const results = await Promise.all(updates);
      const successfulIds = results.filter(id => id !== null);

      if (successfulIds.length > 0) {
        setTasks(tasks.map(t =>
          successfulIds.includes(t.id)
            ? { ...t, completed: true, status: 'Done', progress: 100 }
            : t
        ));
        setSelectedTaskIds([]);
        setShowBulkConfirm(null);
      }
    } catch (error) {
      alert('Error marking tasks as done: ' + error.message);
    }
  };

  const bulkDelete = async () => {
    if (!isAdmin) return;
    if (selectedTaskIds.length === 0) return;
    if (showBulkConfirm !== 'delete') {
      setShowBulkConfirm('delete');
      return;
    }

    try {
      const deletes = selectedTaskIds.map(async (taskId) => {
        const response = await apiRequest(`http://localhost:3001/tasks/${taskId}`, {
          method: 'DELETE'
        });
        return response.ok ? taskId : null;
      });

      const results = await Promise.all(deletes);
      const successfulIds = results.filter(id => id !== null);

      if (successfulIds.length > 0) {
        setTasks(tasks.filter(t => !successfulIds.includes(t.id)));
        setSelectedTaskIds([]);
        setShowBulkConfirm(null);
      }
    } catch (error) {
      alert('Error deleting tasks: ' + error.message);
    }
  };

  // ==================== COMPUTED VALUES ====================
  const completedCount = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const searchFilteredTasks = tasks.filter(task => {
  const searchLower = searchQuery.toLowerCase().trim();
  const taskTitle = (task.text || '').toLowerCase();
  
  // Only search by title, not description
  return taskTitle.includes(searchLower);
});

  const filteredTasks = searchFilteredTasks.filter(t => {
    const statusMatch = filter === 'All' || t.status === filter;
    const priorityMatch = priorityFilter === 'All' || t.priority === priorityFilter;
    const assigneeMatch = assigneeFilter === 'All' || 
      (Array.isArray(t.assignees) && t.assignees.includes(parseInt(assigneeFilter)));
    
    let deadlineMatch = true;
    if (deadlineFilter === 'Overdue') {
      if (t.deadline && !t.completed) {
        const deadlineDate = new Date(t.deadline);
        const today = new Date();
        deadlineDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        deadlineMatch = deadlineDate < today;
      } else {
        deadlineMatch = false;
      }
    } else if (deadlineFilter === 'Today') {
      if (t.deadline) {
        const deadlineDate = new Date(t.deadline);
        const today = new Date();
        deadlineMatch = deadlineDate.toDateString() === today.toDateString();
      } else {
        deadlineMatch = false;
      }
    } else if (deadlineFilter === 'This Week') {
      if (t.deadline) {
        const deadlineDate = new Date(t.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        deadlineDate.setHours(0, 0, 0, 0);
        
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        deadlineMatch = deadlineDate >= today && deadlineDate <= weekFromNow;
      } else {
        deadlineMatch = false;
      }
    }
    
    return statusMatch && priorityMatch && assigneeMatch && deadlineMatch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filter, priorityFilter, assigneeFilter, deadlineFilter]);

  useEffect(() => {
    if (selectedTaskIds.length === 0) {
      setShowBulkConfirm(null);
    }
  }, [selectedTaskIds]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  // ==================== RENDER ====================
  return (
    <div className="max-w-full mx-auto p-6 bg-white/95 min-h-screen font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2563eb] to-[#8b5cf6] rounded-xl p-6 text-white mb-8 shadow-xl animate-slideInDown relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
        <h2 className="font-normal text-3xl my-2 text-white relative z-10 flex items-center gap-3">
          <Calendar size={32} className="animate-bounce" /> Welcome back, {user?.name || 'User'}!
        </h2>
        <p className="opacity-90 m-0 text-white relative z-10">
          {totalTasks === 0
            ? 'No tasks yet'
            : `${completedCount} of ${totalTasks} tasks completed`}
        </p>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <FilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          filter={filter}
          setFilter={setFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          assigneeFilter={assigneeFilter}
          setAssigneeFilter={setAssigneeFilter}
          deadlineFilter={deadlineFilter}
          setDeadlineFilter={setDeadlineFilter}
          users={users}
        />
      )}

      {/* Add Task Form */}
      {isAdmin && (
        <div className="flex gap-2 mb-6 justify-center flex-wrap bg-[#2563eb]/10 p-5 rounded-xl border-2 border-[#2563eb]/20">
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              value={newTask.text}
              onChange={e => setNewTask({ ...newTask, text: e.target.value })}
              placeholder="Task title..."
              maxLength={100}
              className={`w-full p-3 px-4 border-2 rounded-lg text-base outline-none transition-all duration-200 bg-white ${
                formErrors.text ? 'border-red-600 shadow-[0_0_0_2px_rgba(220,38,38,0.2)]' : 'border-gray-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]'
              }`}
            />
            {formErrors.text && <span className="text-red-600 text-xs mt-1 block">{formErrors.text}</span>}
            <span className="text-xs text-slate-400 mt-0.5 block">{newTask.text.length}/100</span>
          </div>

          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              value={newTask.description}
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Description"
              maxLength={500}
              className={`w-full p-3 px-4 border-2 rounded-lg text-base outline-none transition-all duration-200 bg-white ${
                formErrors.description ? 'border-red-600 shadow-[0_0_0_2px_rgba(220,38,38,0.2)]' : 'border-gray-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]'
              }`}
            />
            {formErrors.description && <span className="text-red-600 text-xs mt-1 block">{formErrors.description}</span>}
            <span className="text-xs text-slate-400 mt-0.5 block">{newTask.description.length}/500</span>
          </div>

          <div>
            <AssigneeDropdown
              value={newTask.assignee}
              onChange={assignee => setNewTask({ ...newTask, assignee })}
              options={users}
              getMemberNameById={getMemberNameById}
              hasError={!!formErrors.assignee}
            />
            {formErrors.assignee && <span className="text-red-600 text-xs mt-1 block">{formErrors.assignee}</span>}
          </div>

          <div>
            <input
            type="date"
            value={newTask.deadline}
            onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
            className={`p-3 px-4 border-2 rounded-lg text-base outline-none transition-all duration-200 bg-white text-slate-700 min-w-[120px] h-[46px] ${
              formErrors.deadline ? 'border-red-600 shadow-[0_0_0_2px_rgba(220,38,38,0.2)]' : 'border-gray-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]'
            }`}
            min={new Date().toISOString().split('T')[0]}
          />
            {formErrors.deadline && <span className="text-red-600 text-xs mt-1 block">{formErrors.deadline}</span>}
          </div>

          <select
            value={newTask.priority}
            onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
            className="p-3 px-4 border-2 border-gray-200 rounded-lg text-base outline-none transition-all duration-200 bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
          >
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            value={newTask.status}
            onChange={e => setNewTask({ ...newTask, status: e.target.value })}
            className="p-3 px-4 border-2 border-gray-200 rounded-lg text-base outline-none transition-all duration-200 bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <button onClick={addTask} className="px-5 py-3 bg-[#2563eb] text-white border-none rounded-lg cursor-pointer flex items-center gap-2 text-base font-semibold transition-all duration-200 shadow-[0_4px_8px_rgba(37,99,235,0.12)] hover:bg-[#2563eb] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(37,99,235,0.18)] hover:scale-105 active:scale-95">
            <Plus size={20} /> Add
          </button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {filteredTasks.length > 0 && (
        <div className="flex justify-between items-center px-5 py-4 bg-gradient-to-br from-[#2563eb]/5 to-[#2563eb]/5 rounded-xl border-2 border-[#2563eb]/20 gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-[#2563eb]">
              <input
                type="checkbox"
                checked={selectedTaskIds.length > 0 && selectedTaskIds.length === filteredTasks.length}
                ref={(el) => {
                  if (el) {
                    el.indeterminate =
                      selectedTaskIds.length > 0 &&
                      selectedTaskIds.length < filteredTasks.length;
                  }
                }}
                onChange={toggleSelectAll}
                className="w-5 h-5 cursor-pointer accent-[#2563eb]"
              />
              Select All ({selectedTaskIds.length} selected)
            </label>
          </div>

          {selectedTaskIds.length > 0 && (
            <>
              {showBulkConfirm === null ? (
                <div className="flex gap-3 flex-wrap">
                  <button onClick={bulkMarkAsDone} className="flex items-center gap-2 px-5 py-2.5 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.1)] bg-green-600 text-white hover:bg-green-700 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(22,163,74,0.4)]">
                    <Check size={16} />
                    Mark as Done ({selectedTaskIds.length})
                  </button>
                  {isAdmin && (
                    <button onClick={bulkDelete} className="flex items-center gap-2 px-5 py-2.5 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.1)] bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(220,38,38,0.4)]">
                      <Trash2 size={16} />
                      Delete ({selectedTaskIds.length})
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex gap-3 flex-wrap items-center">
                  <span className="text-[#2563eb] font-semibold text-sm">
                    {showBulkConfirm === 'done' 
                      ? `Are you sure to mark ${selectedTaskIds.length} task(s) as done?`
                      : `Are you sure to delete ${selectedTaskIds.length} task(s)?`
                    }
                  </span>
                  <button 
                    onClick={() => showBulkConfirm === 'done' ? bulkMarkAsDone() : bulkDelete()} 
                    className={`flex items-center gap-2 px-5 py-2.5 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.1)] ${
                      showBulkConfirm === 'done' 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-red-600 text-white hover:bg-red-700'
                    } hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(82,109,130,0.4)]`}
                  >
                    <Check size={16} />
                    Confirm
                  </button>
                  <button 
                    onClick={() => setShowBulkConfirm(null)} 
                    className="flex items-center gap-2 px-5 py-2.5 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.1)] bg-slate-500 text-white hover:bg-slate-600 hover:-translate-y-0.5"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
            
      {/* Filter and Search Section */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative w-full max-w-[600px] mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title..."
            className="mt-2.5 w-full py-3.5 pr-[50px] pl-5 border-2 border-gray-200 rounded-xl text-base outline-none transition-all duration-300 bg-white shadow-[0_2px_8px_rgba(39,55,77,0.05)] focus:border-[#2563eb] focus:shadow-[0_4px_16px_rgba(37,99,235,0.15)] focus:-translate-y-px"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-600/10 border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer text-2xl text-red-600 transition-all duration-200 font-bold leading-none hover:bg-red-600/20 hover:scale-110 active:scale-95"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex justify-center items-center gap-6 flex-wrap">
        <button 
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white border-none rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-px active:scale-95"
          >
            <Filter size={16} />
            Filters
            {(filter !== 'All' || priorityFilter !== 'All' || 
              assigneeFilter !== 'All' || deadlineFilter !== 'All') && (
              <span className="bg-white text-purple-600 px-2 py-0.5 rounded-full text-[10px] font-bold ml-1">
                {[filter, priorityFilter, assigneeFilter, deadlineFilter].filter(f => f !== 'All').length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 whitespace-nowrap">
          <label className="font-semibold text-slate-700 text-sm whitespace-nowrap min-w-fit">Per page:</label>
          <select
            value={itemsPerPage}
            onChange={e => handleItemsPerPageChange(Number(e.target.value))}
            className="py-2.5 px-3.5 rounded-lg border-2 border-gray-300 bg-white text-sm text-slate-700 outline-none transition-all duration-200 cursor-pointer min-w-[80px] font-medium focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)] hover:border-[#2563eb]"
          >
            {ITEMS_PER_PAGE_OPTIONS.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="text-center py-3 px-5 bg-gradient-to-br from-[#2563eb]/10 to-[#2563eb]/10 border border-[#2563eb]/20 rounded-lg text-[#2563eb] font-medium text-sm animate-[slideDown_0.3s_ease]">
            Found {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="flex flex-row flex-wrap gap-4 justify-start">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 px-6 text-[#64748b] bg-[#f1f5f9] border-2 border-dashed rounded-xl my-6 mx-auto w-full max-w-[600px]" style={{ borderColor: 'rgba(226,232,240,0.8)' }}>
            <div className="text-5xl mb-4 text-[#2563eb]">📋</div>
            <p className="text-lg mb-1 text-[#2563eb] font-medium">No tasks found!</p>
            <p className="text-sm text-[#64748b] m-0">
              {filter === 'All'
                ? (isAdmin ? 'Add your first task above.' : 'No tasks assigned.')
                : `No tasks with status "${filter}".`}
            </p>
          </div>
        ) : (
          currentTasks.map((task, index) => {
            const isOverdue = (() => {
              if (!task.deadline || task.completed) return false;
              const deadlineDate = new Date(task.deadline);
              const today = new Date();
              deadlineDate.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
              return deadlineDate < today;
            })();
            
            return (
              <div
                key={task.id}
                className={`relative flex items-center gap-3 p-4 border-2 rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(39,55,77,0.1)] max-w-[400px] min-w-[300px] animate-fadeInUp ${
                  task.completed 
                    ? 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-300 opacity-100' 
                    : isAdmin && isOverdue
                    ? 'border-red-600 bg-red-50'
                    : isOverdue && !isAdmin
                    ? 'border-[#2563eb]/20 bg-white/90'
                    : 'border-[#2563eb]/20 bg-white/90 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(39,55,77,0.2)] hover:border-[#2563eb]'
                } ${editingId === task.id ? 'editing z-[9999]' : 'z-10'} ${selectedTaskIds.includes(task.id) ? 'selected' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >

                {isOverdue && !isAdmin && (
                  <>
                    <div className="absolute inset-0 bg-white/15 backdrop-blur-[1px] rounded-xl z-[1]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600/95 text-white px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap z-10 pointer-events-none">
                      OVERDUE - Contact Admin
                    </div>
                  </>
                )}
                {isAdmin && isOverdue && (
                  <div className="absolute -top-2.5 right-2.5 bg-red-600 text-white px-3 py-1 rounded-xl text-[11px] font-bold z-[5] animate-pulse-glow">
                    OVERDUE
                  </div>
                )}
                <button
                  onClick={() => toggleComplete(task.id)}
                  className={`w-6 h-6 rounded-full border-2 border-slate-500 bg-transparent cursor-pointer flex items-center justify-center transition-all duration-200 hover:border-[#2563eb] hover:scale-110 active:scale-90 ${
                    task.completed ? 'bg-gradient-to-br from-[#2563eb] to-[#2563eb] border-[#2563eb] text-white animate-checkBounce' : ''
                  } ${isOverdue && !isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={isOverdue && !isAdmin}
                >
                  {task.completed && <Check size={16} className="animate-checkmark" />}
                </button>
                <div className="flex-1 w-full pr-2">
                {editingId === task.id && isAdmin ? (
                  <div className="flex flex-col gap-2 pr-28">
                      <input
                        type="text"
                        className={`w-full p-1 px-2 border-2 rounded text-base outline-none transition-all duration-200 ${editingErrors.text ? 'border-red-600' : 'border-gray-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]'}`}
                        value={editingTask?.text || ''}
                        onChange={e => setEditingTask({ ...editingTask, text: e.target.value })}
                        placeholder="Task title..."
                        maxLength={100}
                      />
                      {editingErrors.text && <span className="text-red-600 text-xs mt-1 block">{editingErrors.text}</span>}
                      <span className="text-xs text-slate-400">{(editingTask?.text || '').length}/100</span>

                      <textarea
                        className={`min-h-[60px] resize-y p-1 px-2 border-2 rounded text-base outline-none transition-all duration-200 ${editingErrors.description ? 'border-red-600' : 'border-gray-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]'}`}
                        value={editingTask?.description || ''}
                        onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                        placeholder="Description"
                        maxLength={500}
                      />
                      {editingErrors.description && <span className="text-red-600 text-xs mt-1 block">{editingErrors.description}</span>}
                      <span className="text-xs text-slate-400">{(editingTask?.description || '').length}/500</span>

                      <AssigneeDropdown
                        value={editingTask?.assignee || []}
                        onChange={assignee => setEditingTask({ ...editingTask, assignee })}
                        options={users}
                        getMemberNameById={getMemberNameById}
                        hasError={!!editingErrors.assignee}
                      />
                      {editingErrors.assignee && <span className="text-red-600 text-xs mt-1 block">{editingErrors.assignee}</span>}

                      <div className="flex gap-2 items-center mt-1">
                        <input
                          type="date"
                          className={`p-3 px-4 border-2 rounded-lg text-base outline-none transition-all duration-200 bg-white text-[#2563eb] min-w-[120px] h-[46px] ${
                            editingErrors.deadline ? 'border-red-600' : 'border-gray-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]'
                          }`}
                          value={editingTask?.deadline || ''}
                          onChange={e => setEditingTask({ ...editingTask, deadline: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                        />

                        <select
                          value={editingTask?.priority || 'Medium'}
                          onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })}
                          className="p-1 px-2 border-2 border-gray-200 rounded text-base outline-none transition-all duration-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
                        >
                          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>

                        <select
                          value={editingTask?.status || 'To Do'}
                          onChange={e => setEditingTask({ ...editingTask, status: e.target.value })}
                          className="p-1 px-2 border-2 border-gray-200 rounded text-base outline-none transition-all duration-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div className="mt-1.5">
                        <TaskProgressBar
                          progress={editingTask?.progress || 0}
                          onProgressChange={(newProgress) => setEditingTask({ ...editingTask, progress: newProgress, status: newProgress === 100 ? 'Done' : (newProgress > 0 ? 'In Progress' : 'To Do'), completed: newProgress === 100 })}
                          disabled={false}
                        />
                      </div>

                      {/* Save and Cancel buttons */}
                      <div className="flex gap-2 mt-3">
                        <button onClick={saveEdit} className="flex-1 px-4 py-2 bg-green-600 text-white border-none rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-green-700 hover:-translate-y-px shadow-[0_2px_6px_rgba(22,163,74,0.3)]">
                          <Check size={16} />Save
                        </button>
                        <button onClick={cancelEdit} className="flex-1 px-4 py-2 bg-slate-200/50 text-slate-600 border-2 border-slate-300 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-slate-200/80 hover:border-slate-400">
                          <X size={16} />Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div onClick={() => openTaskDetails(task)} className="cursor-pointer">
                    <span className={`text-[#1e293b] break-words font-semibold ${task.completed ? 'line-through text-slate-500' : ''}`}>
                      <strong>{task.text}</strong>
                    </span>
                    <div className="mt-2 p-2 px-3 bg-slate-50 rounded-lg text-sm leading-relaxed break-words border border-slate-200">
                    <span className="block mb-1 break-words">
                      <b className="text-blue-600">Description:</b> <span className="text-[#1e293b]">{task.description || 'No description'}</span>
                    </span>
                      <span className="block mb-1 break-words">
                        <b className="text-purple-600">Assignee:</b> <span className="text-[#1e293b]">{
                          task.assigneeNames && task.assigneeNames.length > 0 
                            ? task.assigneeNames.join(', ')
                            : (task.assignees?.map(id => getMemberNameById(id, task)).join(', ') || 'Unassigned')
                        }</span>
                      </span>
                      <span className="block mb-1 break-words">
                        <b className="text-orange-600">Deadline:</b> <span className="text-[#1e293b]">{task.deadline || 'None'}</span>
                      </span>
                      <span className="block mb-1 break-words">
                        <b className="text-red-600">Priority:</b> <span className="text-[#1e293b]">{task.priority}</span>
                      </span>
                      <span className="block mb-0 break-words">
                        <b className="text-green-600">Status:</b> <span className="text-[#1e293b]">{task.status}</span>
                      </span>
                    </div>
                  </div>

                      <TaskProgressBar 
                        progress={task.progress || 0}
                        onProgressChange={(newProgress) => updateTaskProgress(task.id, newProgress)}
                        disabled={isOverdue && !isAdmin}
                      />
                    </div>
                  )}
                </div>

                <div className="block gap-1">
                  {isAdmin ? (
                    editingId === task.id ? (
                      <div className="flex flex-col gap-1">
                      </div>
                    ) : (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); openTaskDetails(task); }} className="p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-[#2563eb] hover:bg-[#2563eb]/10" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => startEditing(task)} className="p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-[#2563eb] hover:bg-[#2563eb]/10">
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteModal({ isOpen: true, taskId: task.id, taskName: task.text })} 
                          className="p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); openTaskDetails(task); }} className="p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-[#2563eb] hover:bg-[#2563eb]/10" title="View Details">
                      <Eye size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Progress Bar */}
      {totalTasks > 0 && (
        <div className="mt-8 p-5 bg-gradient-to-br from-[#2563eb]/5 to-[#2563eb]/5 rounded-xl border-2 border-[#2563eb]/20">
          <div className="flex justify-between text-sm text-[#2563eb] mb-2 font-semibold">
            <span>Overall Progress</span>
            <span>{Math.round(progress)}% ({completedCount}/{totalTasks})</span>
          </div>
          <div className="w-full bg-slate-400/20 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-[#2563eb] to-[#3b82f6] h-2.5 rounded-full transition-[width] duration-300 shadow-[0_2px_6px_rgba(139,92,246,0.3)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={closeTaskDetails}
          onUpdateTask={(id, data) => {
            setTasks(tasks.map(t => t.id === id ? { ...t, ...data } : t));
            setSelectedTask(prev => prev && prev.id === id ? { ...prev, ...data } : prev);
          }}
          onDelete={deleteTask}
          isAdmin={isAdmin}
          users={users}
          getMemberNameById={getMemberNameById}
          validateTask={validateTask}
          apiRequest={apiRequest}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, taskId: null, taskName: '' })}
        onConfirm={() => deleteTask(deleteModal.taskId)}
        taskName={deleteModal.taskName}
      />
      {/* Styles for animations and responsiveness */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* NEW CUSTOM ANIMATIONS */
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 10px 5px rgba(220, 38, 38, 0);
          }
        }

        @keyframes checkBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        @keyframes checkmark {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(0deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.4s ease-out both;
        }

        .animate-slideInDown {
          animation: slideInDown 0.5s ease-out;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-checkBounce {
          animation: checkBounce 0.3s ease-in-out;
        }

        .animate-checkmark {
          animation: checkmark 0.3s ease-out;
        }

        /* Responsive styles */
        @media (max-width: 768px) {
          .search-container {
            max-width: 100%;
          }

          .search-input {
            padding: 12px 45px 12px 16px;
            font-size: 15px;
          }

          .filter-controls {
            flex-direction: column;
            gap: 12px;
            width: 100%;
          }

          .filter-group {
            width: 100%;
            justify-content: space-between;
          }

          .filter-select {
            flex: 1;
            min-width: 0;
          }

          .search-results-info {
            font-size: 13px;
            padding: 10px 16px;
          }

          .bulk-actions-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .bulk-actions-left {
            justify-content: center;
          }

          .bulk-actions-buttons {
            width: 100%;
            justify-content: center;
          }

          .bulk-action-btn {
            flex: 1;
            justify-content: center;
            min-width: 140px;
          }

          .pagination {
            gap: 4px;
          }
          
          .pagination-button {
            min-width: 36px;
            height: 36px;
            font-size: 13px;
          }
        }

        @media (max-width: 480px) {
          .search-input {
            padding: 10px 40px 10px 14px;
            font-size: 14px;
          }

          .search-clear-button {
            width: 24px;
            height: 24px;
            font-size: 20px;
          }

          .filter-label {
            font-size: 13px;
          }

          .filter-select {
            font-size: 13px;
            padding: 8px 12px;
          }

          .bulk-actions-buttons {
            flex-direction: column;
          }

          .bulk-action-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}