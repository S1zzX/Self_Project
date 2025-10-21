import { useMemo, useState, useEffect } from 'react';

/**
 * Custom hook for managing task filtering logic
 */
export const useTaskFiltering = (tasks, searchQuery, filter, priorityFilter, assigneeFilter, deadlineFilter) => {
  const filteredTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    // Search filter
    const searchFilteredTasks = tasks.filter(task => {
      const searchLower = searchQuery.toLowerCase().trim();
      const taskTitle = (task.text || '').toLowerCase();
      return taskTitle.includes(searchLower);
    });

    // Apply all filters
    const result = searchFilteredTasks.filter(t => {
      const statusMatch = filter === 'All' || t.status === filter;
      const priorityMatch = priorityFilter === 'All' || t.priority === priorityFilter;
      const assigneeMatch = assigneeFilter === 'All' || 
        (Array.isArray(t.assignees) && t.assignees.includes(parseInt(assigneeFilter)));
      
      let deadlineMatch = true;
      if (deadlineFilter === 'Overdue') {
        if (!t.deadline || t.completed) {
          deadlineMatch = false;
        } else {
          const deadlineDate = new Date(t.deadline);
          const today = new Date();
          deadlineDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          deadlineMatch = deadlineDate < today;
        }
      } else if (deadlineFilter === 'Today') {
        if (!t.deadline) {
          deadlineMatch = false;
        } else {
          const deadlineDate = new Date(t.deadline);
          const today = new Date();
          deadlineDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          deadlineMatch = deadlineDate.getTime() === today.getTime();
        }
      } else if (deadlineFilter === 'This Week') {
        if (!t.deadline) {
          deadlineMatch = false;
        } else {
          const deadlineDate = new Date(t.deadline);
          const today = new Date();
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          deadlineDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          weekFromNow.setHours(23, 59, 59, 999);
          deadlineMatch = deadlineDate >= today && deadlineDate <= weekFromNow;
        }
      }
      
      return statusMatch && priorityMatch && assigneeMatch && deadlineMatch;
    });

    return result;
  }, [tasks, searchQuery, filter, priorityFilter, assigneeFilter, deadlineFilter]);

  return filteredTasks;
};

/**
 * Custom hook for pagination logic
 */
export const usePagination = (filteredTasks, itemsPerPage) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Only reset to page 1 when the number of filtered tasks changes significantly
  // or when going beyond available pages
  useEffect(() => {
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredTasks.length, itemsPerPage, currentPage]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirst, indexOfLast);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    currentTasks
  };
};