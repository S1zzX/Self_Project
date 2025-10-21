import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Filter, Check, Trash2, X, Eye } from 'lucide-react';
import { useAuth } from '../AuthContext';

// Import our extracted components
import {
  DeleteConfirmationModal,
  Pagination,
  TaskProgressBar,
  AssigneeDropdown,
  PriorityDropdown,
  StatusDropdown,
  FilterModal,
  TaskDetailsModal,
  LayoutToggle,
  TaskRowView
} from '../Components';

// Import custom hooks
import {
  useTaskFiltering,
  usePagination
} from '../hooks';
import { useTasks, useUsers } from '../hooks/useApi';

// Import constants and utilities
import { PRIORITIES, STATUSES, ITEMS_PER_PAGE_OPTIONS, TASKS_PER_PAGE } from '../utils/constants';
import { formatDate, getPriorityClass, getStatusClass, isTaskOverdue, validateTask } from '../utils/taskUtils';

// Styles component to avoid inline styles in main component
const TaskManagerStyles = () => (
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
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 0 10px 5px rgba(220, 38, 38, 0);
        opacity: 0.7;
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

    /* Custom Scrollbar Styles */
    .scrollbar-thin::-webkit-scrollbar {
      width: 8px;
    }

    .scrollbar-thin::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 10px;
    }

    .scrollbar-thin::-webkit-scrollbar-thumb {
      background: #2563eb;
      border-radius: 10px;
    }

    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background: #1d4ed8;
    }

    /* For Firefox */
    .scrollbar-thin {
      scrollbar-width: thin;
      scrollbar-color: #2563eb #f1f5f9;
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
);

export default function TaskManager({ user }) {
  const { apiRequest, isAdmin } = useAuth();
  
  // Use API hooks for data management
  const { 
    tasks, 
    loading: tasksLoading, 
    error: tasksError, 
    fetchTasks, 
    addTask: apiAddTask, 
    updateTask: apiUpdateTask, 
    deleteTask: apiDeleteTask 
  } = useTasks();
  
  const { 
    users, 
    loading: usersLoading, 
    error: usersError, 
    fetchUsers 
  } = useUsers();
  
  const [newTask, setNewTask] = useState({
    text: '',
    description: '',
    assignee: [],
    deadline: '',
    priority: 'Medium',
    status: 'To Do',
    progress: 0
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [deadlineFilter, setDeadlineFilter] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(TASKS_PER_PAGE);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, taskId: null, taskName: '' });
  const [layout, setLayout] = useState('grid'); // 'grid' or 'row'
  const [newlyAddedTaskIds, setNewlyAddedTaskIds] = useState([]); // Track newly added tasks

  // Custom hooks
  const filteredTasksUnsorted = useTaskFiltering(tasks, searchQuery, filter, priorityFilter, assigneeFilter, deadlineFilter);
  
  // Sort tasks: newly added tasks first, then by ID ascending
  const filteredTasks = [...filteredTasksUnsorted].sort((a, b) => {
    const aIsNew = newlyAddedTaskIds.includes(a.id);
    const bIsNew = newlyAddedTaskIds.includes(b.id);
    
    // If both are new or both are old, sort by ID descending (newest new tasks first)
    if (aIsNew && bIsNew) return b.id - a.id;
    // New tasks come first
    if (aIsNew) return -1;
    if (bIsNew) return 1;
    // Old tasks sorted by ID ascending
    return a.id - b.id;
  });
  
  const { currentPage, setCurrentPage, totalPages, currentTasks } = usePagination(filteredTasks, itemsPerPage);
  
  // Local state for form and bulk actions
  const [formErrors, setFormErrors] = useState({});
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(null);

  // Override with API functions
  const addTask = apiAddTask;
  const deleteTask = apiDeleteTask;

  // Bulk actions
  const toggleTaskSelection = useCallback((taskId) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  }, []);

  const toggleSelectAll = useCallback((filteredTasks) => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(task => task.id));
    }
  }, [selectedTaskIds.length]);

  const resetBulkSelection = useCallback(() => {
    setSelectedTaskIds([]);
    setShowBulkConfirm(null);
  }, []);

  // Task actions
  const toggleComplete = useCallback(async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = {
      ...task,
      completed: !task.completed,
      status: task.completed ? 'To Do' : 'Done',
      progress: task.completed ? 0 : 100
    };

    try {
      await apiUpdateTask(taskId, updatedTask);
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  }, [tasks, apiUpdateTask]);

  const updateTaskProgress = useCallback(async (taskId, progress) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = {
      ...task,
      progress,
      status: progress === 100 ? 'Done' : progress > 0 ? 'In Progress' : 'To Do',
      completed: progress === 100
    };

    try {
      await apiUpdateTask(taskId, updatedTask);
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  }, [tasks, apiUpdateTask]);

  const bulkMarkAsDone = useCallback(async () => {
    if (selectedTaskIds.length === 0) return;
    if (showBulkConfirm !== 'done') {
      setShowBulkConfirm('done');
      return;
    }

    try {
      for (const taskId of selectedTaskIds) {
        const task = tasks.find(t => t.id === taskId);
        if (task && !task.completed) {
          await apiUpdateTask(taskId, {
            ...task,
            completed: true,
            status: 'Done',
            progress: 100
          });
        }
      }
      resetBulkSelection();
    } catch (error) {
      console.error('Error bulk marking tasks as done:', error);
    }
  }, [selectedTaskIds, showBulkConfirm, tasks, apiUpdateTask, resetBulkSelection]);

  const bulkMarkAsNotDone = useCallback(async () => {
    if (selectedTaskIds.length === 0) return;
    if (showBulkConfirm !== 'notdone') {
      setShowBulkConfirm('notdone');
      return;
    }

    try {
      for (const taskId of selectedTaskIds) {
        const task = tasks.find(t => t.id === taskId);
        if (task && task.completed) {
          await apiUpdateTask(taskId, {
            ...task,
            completed: false,
            status: 'To Do',
            progress: 0
          });
        }
      }
      resetBulkSelection();
    } catch (error) {
      console.error('Error bulk marking tasks as not done:', error);
    }
  }, [selectedTaskIds, showBulkConfirm, tasks, apiUpdateTask, resetBulkSelection]);

  const bulkDelete = useCallback(async () => {
    if (selectedTaskIds.length === 0) return;
    if (showBulkConfirm !== 'delete') {
      setShowBulkConfirm('delete');
      return;
    }

    try {
      for (const taskId of selectedTaskIds) {
        await apiDeleteTask(taskId);
      }
      resetBulkSelection();
    } catch (error) {
      console.error('Error bulk deleting tasks:', error);
    }
  }, [selectedTaskIds, showBulkConfirm, apiDeleteTask, resetBulkSelection]);

  // Auto-reset bulk confirmation when selection changes
  useEffect(() => {
    if (selectedTaskIds.length === 0) {
      setShowBulkConfirm(null);
    }
  }, [selectedTaskIds]);

  // Data fetching
  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchUsers(); // Fetch users for everyone to populate assignee dropdown
    }
  }, [user, fetchTasks, fetchUsers]);

  // Clear newly added task IDs when tasks are refetched (e.g., on page refresh)
  useEffect(() => {
    // When tasks change from a full fetch, clear the newly added tracking
    // This happens on component mount or when fetchTasks is called
    const taskIds = tasks.map(t => t.id);
    setNewlyAddedTaskIds(prev => prev.filter(id => taskIds.includes(id)));
  }, [tasks.length]); // Only run when number of tasks changes

  // Helper functions
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

  const handleItemsPerPageChange = (newValue) => {
    setItemsPerPage(newValue);
    setCurrentPage(1);
  };

  const handleAddTask = async () => {
    // Validate the task before adding
    const validationErrors = validateTask(newTask);
    setFormErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return; // Don't add task if there are validation errors
    }
    
    const newTaskData = await addTask(newTask);
    if (newTaskData) {
      // Track this newly added task ID
      setNewlyAddedTaskIds(prev => [...prev, newTaskData.id]);
      
      setNewTask({
        text: '',
        description: '',
        assignee: [],
        deadline: '',
        priority: 'Medium', 
        status: 'To Do',
        progress: 0
      });
      setFormErrors({}); // Clear any previous errors
    }
  };

  const handleDeleteTask = async (id) => {
    const success = await deleteTask(id);
    if (success) {
      setDeleteModal({ isOpen: false, taskId: null, taskName: '' });
    }
  };

  const openDeleteModal = (taskId, taskName) => {
    setDeleteModal({ isOpen: true, taskId, taskName });
  };

  // Computed values
  const completedCount = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  return (
    <div className="max-w-full mx-auto p-6 bg-white/95 min-h-screen font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8 shadow-xl animate-slideInDown relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
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

          <div>
            <PriorityDropdown
              value={newTask.priority}
              onChange={priority => setNewTask({ ...newTask, priority })}
              options={PRIORITIES}
              hasError={!!formErrors.priority}
            />
            {formErrors.priority && <span className="text-red-600 text-xs mt-1 block">{formErrors.priority}</span>}
          </div>

          <div>
            <StatusDropdown
              value={newTask.status}
              onChange={status => setNewTask({ ...newTask, status })}
              options={STATUSES}
              hasError={!!formErrors.status}
            />
            {formErrors.status && <span className="text-red-600 text-xs mt-1 block">{formErrors.status}</span>}
          </div>

          <button onClick={handleAddTask} className="px-5 py-3 bg-[#2563eb] text-white border-none rounded-lg cursor-pointer flex items-center gap-2 text-base font-semibold transition-all duration-200 shadow-[0_4px_8px_rgba(37,99,235,0.12)] hover:bg-[#2563eb] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(37,99,235,0.18)] hover:scale-105 active:scale-95">
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
                onChange={() => toggleSelectAll(filteredTasks)}
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
                  <button onClick={bulkMarkAsNotDone} className="flex items-center gap-2 px-5 py-2.5 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.1)] bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(37,99,235,0.4)]">
                    <X size={16} />
                    Mark as Not Done ({selectedTaskIds.length})
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
                      : showBulkConfirm === 'notdone'
                      ? `Are you sure to mark ${selectedTaskIds.length} task(s) as not done?`
                      : `Are you sure to delete ${selectedTaskIds.length} task(s)?`
                    }
                  </span>
                  <button 
                    onClick={() => {
                      if (showBulkConfirm === 'done') bulkMarkAsDone();
                      else if (showBulkConfirm === 'notdone') bulkMarkAsNotDone();
                      else if (showBulkConfirm === 'delete') bulkDelete();
                    }} 
                    className={`flex items-center gap-2 px-5 py-2.5 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.1)] ${
                      showBulkConfirm === 'done' 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : showBulkConfirm === 'notdone'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
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

          <LayoutToggle layout={layout} onLayoutChange={setLayout} />

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
        <>
          <div className={layout === 'grid' ? 'pt-4 flex flex-row flex-wrap gap-4 justify-start min-h-[763px] max-h-[763px] overflow-y-auto overflow-x-hidden pr-2 scroll-smooth scrollbar-thin scrollbar-thumb-[#2563eb] scrollbar-track-gray-100' : 'pt-4 min-h-[920px] max-h-[920px] overflow-y-auto overflow-x-hidden pr-2 scroll-smooth scrollbar-thin scrollbar-thumb-[#2563eb] scrollbar-track-gray-100'}>
            {layout === 'row' ? (
              <div className="flex flex-col gap-0">
                {currentTasks.map((task, index) => {
                  const isOverdue = isTaskOverdue(task.deadline, task.completed);
                  
                  return (
                    <TaskRowView
                      key={task.id}
                      task={task}
                      index={index}
                      isOverdue={isOverdue}
                      isAdmin={isAdmin}
                      selectedTaskIds={selectedTaskIds}
                      users={users}
                      getMemberNameById={getMemberNameById}
                      updateTaskProgress={updateTaskProgress}
                      toggleComplete={toggleComplete}
                      toggleTaskSelection={toggleTaskSelection}
                      openTaskDetails={setSelectedTask}
                      openDeleteModal={openDeleteModal}
                    />
                  );
                })}
              </div>
            ) : (
              currentTasks.map((task, index) => {
                const isOverdue = isTaskOverdue(task.deadline, task.completed);
                
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    isOverdue={isOverdue}
                    isAdmin={isAdmin}
                    selectedTaskIds={selectedTaskIds}
                    getMemberNameById={getMemberNameById}
                    updateTaskProgress={updateTaskProgress}
                    toggleComplete={toggleComplete}
                    toggleTaskSelection={toggleTaskSelection}
                    openTaskDetails={setSelectedTask}
                    openDeleteModal={openDeleteModal}
                  />
                );
              })
            )}
          </div>

          {/* Pagination - Fixed position */}
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

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

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={(id, data) => {
            // This will be handled by the API updateTask function
            setSelectedTask(prev => prev && prev.id === id ? { ...prev, ...data } : prev);
          }}
          onDelete={handleDeleteTask}
          isAdmin={isAdmin}
          users={users}
          getMemberNameById={getMemberNameById}
          validateTask={validateTask}
          apiRequest={apiRequest}
          updateTask={apiUpdateTask}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, taskId: null, taskName: '' })}
        onConfirm={() => handleDeleteTask(deleteModal.taskId)}
        taskName={deleteModal.taskName}
      />

      <TaskManagerStyles />
    </div>
  );
}

// Extracted TaskCard component for cleaner code
function TaskCard({ 
  task, 
  index, 
  isOverdue, 
  isAdmin, 
  selectedTaskIds, 
  getMemberNameById, 
  updateTaskProgress, 
  toggleComplete, 
  toggleTaskSelection, 
  openTaskDetails, 
  openDeleteModal 
}) {
  return (
    <div
      className={`relative flex items-center gap-3 p-5 border-2 rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(39,55,77,0.1)] w-[calc(33.333%-11px)] min-w-[380px] min-h-[360px] animate-fadeInUp cursor-pointer ${
        task.completed 
          ? 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-300 opacity-100' 
          : isAdmin && isOverdue
          ? 'border-red-600 bg-red-50'
          : isOverdue && !isAdmin
          ? 'border-[#2563eb]/20 bg-white/90'
          : 'border-[#2563eb]/20 bg-white/90 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(39,55,77,0.2)] hover:border-[#2563eb]'
      } ${selectedTaskIds.includes(task.id) ? 'selected' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => openTaskDetails(task)}
    >
      {/* Selection checkbox */}
      <label className="absolute top-2 left-2 flex items-center cursor-pointer z-20" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selectedTaskIds.includes(task.id)}
          onChange={() => toggleTaskSelection(task.id)}
          className="w-4 h-4 cursor-pointer accent-[#2563eb] opacity-80 hover:opacity-100"
        />
      </label>

      {/* Overdue overlay for non-admin users */}
      {isOverdue && !isAdmin && (
        <>
          <div className="absolute inset-0 bg-white/15 backdrop-blur-[1px] rounded-xl z-[1]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600/95 text-white px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap z-10 pointer-events-none">
            OVERDUE - Contact Admin
          </div>
        </>
      )}

      {/* Overdue badge for admin */}
      {isAdmin && isOverdue && (
        <div className="absolute -top-3 right-2.5 bg-red-600 text-white px-3 py-1 rounded-xl text-[11px] font-bold z-[5] shadow-lg animate-pulse-glow">
          OVERDUE
        </div>
      )}

      {/* Complete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleComplete(task.id);
        }}
        className={`w-6 h-6 rounded-full border-2 border-slate-500 bg-transparent cursor-pointer flex items-center justify-center transition-all duration-200 hover:border-[#2563eb] hover:scale-110 active:scale-90 ${
          task.completed ? 'bg-gradient-to-br from-[#2563eb] to-[#2563eb] border-[#2563eb] text-white animate-checkBounce' : ''
        } ${isOverdue && !isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
        disabled={isOverdue && !isAdmin}
      >
        {task.completed && <Check size={16} className="animate-checkmark" />}
      </button>

      {/* Task content */}
      <div className="flex-1 w-full pr-2">
        <TaskDisplay 
          task={task}
          getMemberNameById={getMemberNameById}
          updateTaskProgress={updateTaskProgress}
          isOverdue={isOverdue}
          isAdmin={isAdmin}
          openTaskDetails={openTaskDetails}
        />
      </div>

      {/* Action buttons */}
      <div className="block gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={(e) => { e.stopPropagation(); openTaskDetails(task); }} className="p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-[#2563eb] hover:bg-[#2563eb]/10" title="View Details">
          <Eye size={16} />
        </button>
        {isAdmin && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(task.id, task.text);
            }}
            className="p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-red-600 hover:bg-red-100"
            title="Delete Task"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// TaskDisplay component for viewing tasks
function TaskDisplay({ task, getMemberNameById, updateTaskProgress, isOverdue, isAdmin, openTaskDetails }) {
  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'No description';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div>
      <div>
        <span className={`text-[#1e293b] break-words font-semibold ${task.completed ? 'line-through text-slate-500' : ''}`}>
          <strong>{task.text}</strong>
        </span>
        <div className="mt-2 p-2 px-3 bg-slate-50 rounded-lg text-sm leading-relaxed break-words border border-slate-200">
          <span className="block mb-1 break-words">
            <b className="text-blue-600">Description:</b> <span className="text-[#1e293b]">{truncateText(task.description)}</span>
          </span>
          <span className="block mb-1 break-words">
            <b className="text-purple-600">Assignee:</b> <span className="text-[#1e293b]">{
              task.assigneeNames && task.assigneeNames.length > 0 
                ? task.assigneeNames.join(', ')
                : (task.assignees?.map(id => getMemberNameById(id, task)).join(', ') || 'Unassigned')
            }</span>
          </span>
          <span className="block mb-1 break-words">
            <b className="text-orange-600">Deadline:</b> <span className="text-[#1e293b]">{formatDate(task.deadline)}</span>
          </span>
          <span className="block mb-1 break-words">
            <b className="text-red-600">Priority:</b> <span className="text-[#1e293b]">{task.priority}</span>
          </span>
          <span className="block mb-0 break-words">
            <b className="text-green-600">Status:</b> <span className="text-[#1e293b]">{task.status}</span>
          </span>
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <TaskProgressBar 
          progress={task.progress || 0}
          onProgressChange={(newProgress) => updateTaskProgress(task.id, newProgress)}
          disabled={isOverdue && !isAdmin}
        />
      </div>
    </div>
  );
}

