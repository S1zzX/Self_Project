import { useState, useCallback } from 'react';

/**
 * Custom hook for managing bulk task operations
 */
export const useBulkActions = (apiRequest, isAdmin, tasks, setTasks) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(null);

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

  const bulkMarkAsDone = useCallback(async () => {
    if (selectedTaskIds.length === 0) return;
    if (showBulkConfirm !== 'done') {
      setShowBulkConfirm('done');
      return;
    }

    try {
      const updatePromises = selectedTaskIds.map(async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || task.completed) return;

        const payload = {
          ...task,
          completed: true,
          status: 'Done',
          progress: 100
        };

        return apiRequest(`http://localhost:3001/tasks/${taskId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      });

      await Promise.all(updatePromises);
      
      // Update local state
      setTasks(prev => prev.map(task => 
        selectedTaskIds.includes(task.id) 
          ? { ...task, completed: true, status: 'Done', progress: 100 }
          : task
      ));

      setSelectedTaskIds([]);
      setShowBulkConfirm(null);
    } catch (error) {
      alert('Error updating tasks: ' + error.message);
    }
  }, [selectedTaskIds, showBulkConfirm, tasks, apiRequest, setTasks]);

  const bulkDelete = useCallback(async () => {
    if (!isAdmin) return;
    if (selectedTaskIds.length === 0) return;
    if (showBulkConfirm !== 'delete') {
      setShowBulkConfirm('delete');
      return;
    }

    try {
      const deletePromises = selectedTaskIds.map(taskId =>
        apiRequest(`http://localhost:3001/tasks/${taskId}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      
      setTasks(prev => prev.filter(task => !selectedTaskIds.includes(task.id)));
      setSelectedTaskIds([]);
      setShowBulkConfirm(null);
    } catch (error) {
      alert('Error deleting tasks: ' + error.message);
    }
  }, [isAdmin, selectedTaskIds, showBulkConfirm, apiRequest, setTasks]);

  const resetBulkSelection = useCallback(() => {
    if (selectedTaskIds.length === 0) {
      setShowBulkConfirm(null);
    }
  }, [selectedTaskIds.length]);

  return {
    selectedTaskIds,
    setSelectedTaskIds,
    showBulkConfirm,
    setShowBulkConfirm,
    toggleTaskSelection,
    toggleSelectAll,
    bulkMarkAsDone,
    bulkDelete,
    resetBulkSelection
  };
};