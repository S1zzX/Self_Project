// hooks/useNotifications.js - Database Version with Mark as Unread
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { apiRequest, user } = useAuth();

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const response = await apiRequest('http://localhost:3001/notifications');
      if (response.ok) {
        const notifs = await response.json();
        setNotifications(notifs);
        
        const unread = notifs.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [apiRequest, user]);

  // Initial load and periodic refresh
  useEffect(() => {
    if (!user) return;

    // Fetch immediately
    fetchNotifications();

    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, user]);

  // Toggle read/unread status
const markAsRead = useCallback(async (notificationId) => {
  try {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    // Toggle the read state
    const newReadState = !notification.read;

    // Choose correct endpoint
    const endpoint = newReadState
      ? `http://localhost:3001/notifications/${notificationId}/read`
      : `http://localhost:3001/notifications/${notificationId}/unread`;

    const response = await apiRequest(endpoint, { method: 'PUT' });

    if (response.ok) {
      const updatedNotifs = notifications.map(n =>
        n.id === notificationId ? { ...n, read: newReadState } : n
      );
      setNotifications(updatedNotifs);

      const unread = updatedNotifs.filter(n => !n.read).length;
      setUnreadCount(unread);
    }
  } catch (error) {
    console.error('Error toggling notification read status:', error);
  }
}, [apiRequest, notifications]);


  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiRequest(
        'http://localhost:3001/notifications/read-all',
        { method: 'PUT' }
      );
      
      if (response.ok) {
        // Update local state
        const updatedNotifs = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updatedNotifs);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [apiRequest, notifications]);

  const clearNotifications = useCallback(async () => {
    try {
      const response = await apiRequest(
        'http://localhost:3001/notifications',
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, [apiRequest]);

  const clearNotification = useCallback(async (notificationId) => {
    try {
      const response = await apiRequest(
        `http://localhost:3001/notifications/${notificationId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        // Update local state
        const updatedNotifs = notifications.filter(n => n.id !== notificationId);
        setNotifications(updatedNotifs);
        
        const unread = updatedNotifs.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [apiRequest, notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearNotification,
    checkForNewTasks: fetchNotifications // Rename for compatibility
  };
};