// hooks/useApi.js
import { useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';

export const useApi = () => {
  const { apiRequest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [apiRequest]);

  return { request, loading, error };
};

// Custom hook for user management
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const { apiRequest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('http://localhost:3001/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData) => {
    try {
      const response = await apiRequest('http://localhost:3001/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchUsers(); // Refresh the list
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (err) {
      console.error('Error adding user:', err);
      throw err;
    }
  };

  const updateUser = async (id, userData) => {
    try {
      const response = await apiRequest(`http://localhost:3001/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchUsers(); // Refresh the list
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  const deleteUser = async (id) => {
    try {
      const response = await apiRequest(`http://localhost:3001/users/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchUsers(); // Refresh the list
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser
  };
};

// Custom hook for task management
export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const { apiRequest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('http://localhost:3001/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData) => {
    try {
      const response = await apiRequest('http://localhost:3001/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchTasks(); // Refresh the list
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (err) {
      console.error('Error adding task:', err);
      throw err;
    }
  };

  const updateTask = async (id, taskData) => {
    try {
      const response = await apiRequest(`http://localhost:3001/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(taskData)
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchTasks(); // Refresh the list
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  const deleteTask = async (id) => {
    try {
      const response = await apiRequest(`http://localhost:3001/tasks/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchTasks(); // Refresh the list
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask
  };
};