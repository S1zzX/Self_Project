// Task management constants
export const PRIORITIES = ['High', 'Medium', 'Low'];
export const STATUSES = ['To Do', 'In Progress', 'Done'];
export const ITEMS_PER_PAGE_OPTIONS = [6, 9, 12, 18, 24];
export const TASKS_PER_PAGE = 9;

// Status and priority styling classes
export const PRIORITY_CLASSES = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
};

export const STATUS_CLASSES = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  'to do': 'bg-slate-100 text-slate-700 border-slate-200',
  'in progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  done: 'bg-green-100 text-green-800 border-green-200'
};