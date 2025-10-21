import { useState, useCallback } from 'react';
import { validateTask } from '../utils/taskUtils';

/**
 * Custom hook for managing task CRUD operations
 */
export const useTaskOperations = (apiRequest, isAdmin, tasks, setTasks) => {
  const [formErrors, setFormErrors] = useState({});
  const [editingErrors, setEditingErrors] = useState({});
  const [editingTask, setEditingTask] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const addTask = useCallback(async (newTask) => {
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
    } else if (newTask.status === 'In Progress' && progress === 0) {
      progress = 25;
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
        const task = await response.json();
        setTasks(prev => [...prev, task]);
        setFormErrors({});
        return true;
      } else {
        const error = await response.json();
        alert('Error adding task: ' + error.error);
        return false;
      }
    } catch (error) {
      alert('Network error: ' + error.message);
      return false;
    }
  }, [apiRequest, isAdmin, setTasks]);

  const updateTask = useCallback(async (taskId, updates) => {
    try {
      const response = await apiRequest(`http://localhost:3001/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
        return true;
      } else {
        const error = await response.json();
        alert('Error updating task: ' + error.error);
        return false;
      }
    } catch (error) {
      alert('Network error: ' + error.message);
      return false;
    }
  }, [apiRequest, setTasks]);

  const deleteTask = useCallback(async (id) => {
    if (!isAdmin) return;
    
    try {
      const response = await apiRequest(`http://localhost:3001/tasks/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== id));
        return true;
      } else {
        const error = await response.json();
        alert('Error deleting task: ' + error.error);
        return false;
      }
    } catch (error) {
      alert('Network error: ' + error.message);
      return false;
    }
  }, [apiRequest, isAdmin, setTasks]);

  const saveEdit = useCallback(async () => {
    if (!isAdmin || !editingTask) return;
    
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

    const success = await updateTask(editingId, payload);
    if (success) {
      cancelEdit();
    }
  }, [isAdmin, editingTask, editingId, updateTask]);

  const startEditing = useCallback((task) => {
    if (!isAdmin) return;
    setEditingId(task.id);
    setEditingTask({ ...task, assignee: task.assignees || [] });
  }, [isAdmin]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingTask(null);
    setEditingErrors({});
  }, []);

  const toggleComplete = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (!isAdmin && task.deadline && !task.completed) {
      const deadlineDate = new Date(task.deadline);
      const today = new Date();
      deadlineDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        alert('Task is overdue. Only admin can modify overdue tasks.');
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
      newStatus = newProgress === 0 ? 'To Do' : 'In Progress';
    }

    const payload = {
      ...task,
      completed: newCompleted,
      status: newStatus,
      progress: newProgress
    };

    await updateTask(id, payload);
  }, [tasks, isAdmin, updateTask]);

  const updateTaskProgress = useCallback(async (taskId, newProgress) => {
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

    await updateTask(taskId, payload);
  }, [tasks, updateTask]);

  return {
    formErrors,
    setFormErrors,
    editingErrors,
    setEditingErrors,
    editingTask,
    setEditingTask,
    editingId,
    addTask,
    updateTask,
    deleteTask,
    saveEdit,
    startEditing,
    cancelEdit,
    toggleComplete,
    updateTaskProgress
  };
};