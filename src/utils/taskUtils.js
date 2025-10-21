import { PRIORITY_CLASSES, STATUS_CLASSES } from './constants';

/**
 * Format date for display
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'No deadline';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get priority styling class
 */
export const getPriorityClass = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high': return PRIORITY_CLASSES.high;
    case 'medium': return PRIORITY_CLASSES.medium;
    case 'low': return PRIORITY_CLASSES.low;
    default: return PRIORITY_CLASSES.medium;
  }
};

/**
 * Get status styling class
 */
export const getStatusClass = (status, completed) => {
  if (completed) return STATUS_CLASSES.completed;
  switch (status?.toLowerCase()) {
    case 'to do': return STATUS_CLASSES['to do'];
    case 'in progress': return STATUS_CLASSES['in progress'];
    case 'done': return STATUS_CLASSES.done;
    default: return STATUS_CLASSES['to do'];
  }
};

/**
 * Check if task is overdue
 */
export const isTaskOverdue = (deadline, completed) => {
  if (!deadline || completed) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  deadlineDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return deadlineDate < today;
};

/**
 * Get status from progress percentage
 */
export const getStatusFromProgress = (progress) => {
  if (progress === 0) return 'To Do';
  if (progress >= 100) return 'Done';
  return 'In Progress';
};

/**
 * Get status color for progress bar
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'To Do': return 'text-slate-500';
    case 'In Progress': return 'text-yellow-600';
    case 'Done': return 'text-green-600';
    default: return 'text-slate-500';
  }
};

/**
 * Validate task data
 */
export const validateTask = (task) => {
  const errors = {};
  
  if (!task.text?.trim()) {
    errors.text = 'Task title is required';
  } else if (task.text.trim().length > 100) {
    errors.text = 'Task title must be 100 characters or less';
  }
  
  if (!task.description?.trim()) {
    errors.description = 'Description is required';
  } else if (task.description.trim().length > 500) {
    errors.description = 'Description must be 500 characters or less';
  }
  
  if (!task.assignee || task.assignee.length === 0) {
    errors.assignee = 'Please assign this task to someone';
  }
  
  if (!task.deadline) {
    errors.deadline = 'Deadline is required';
  } else {
    const deadlineDate = new Date(task.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      errors.deadline = 'Deadline cannot be in the past';
    }
  }
  
  return errors;
};