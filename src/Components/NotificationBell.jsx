import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, GripVertical, MailOpen, Mail } from 'lucide-react';
import { useNotifications } from '../hook/useNotifications'; // Add this import

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dropdownRef = useRef(null);
  
  // Use the actual hook instead of mock data
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotification 
  } = useNotifications();

  // Center the dropdown when first opened
  useEffect(() => {
    if (isOpen && position.x === 0 && position.y === 0) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const dropdownWidth = Math.min(400, windowWidth * 0.9);
      const dropdownHeight = Math.min(500, windowHeight * 0.8);
      
      setPosition({
        x: (windowWidth - dropdownWidth) / 2,
        y: (windowHeight - dropdownHeight) / 2
      });
    }
  }, [isOpen, position.x, position.y]);

  const updatePosition = (clientX, clientY) => {
    if (!dropdownRef.current) return;
    
    const newX = clientX - dragOffset.x;
    const newY = clientY - dragOffset.y;
    
    const dropdownWidth = dropdownRef.current.offsetWidth;
    const dropdownHeight = dropdownRef.current.offsetHeight;
    const maxX = window.innerWidth - dropdownWidth;
    const maxY = window.innerHeight - dropdownHeight;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      const rect = dropdownRef.current.getBoundingClientRect();
      const clientX = e.clientX || e.touches?.[0]?.clientX;
      const clientY = e.clientY || e.touches?.[0]?.clientY;
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
    }
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const rect = dropdownRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      const clientX = e.clientX || e.touches?.[0]?.clientX;
      const clientY = e.clientY || e.touches?.[0]?.clientY;
      updatePosition(clientX, clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      const touch = e.touches[0];
      updatePosition(touch.clientX, touch.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-600';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300 relative ${
            unreadCount > 0
              ? 'bg-red-600/10 border border-red-600/30 hover:bg-red-600/20'
              : 'bg-[#2F6FA6]/10 border border-[#DDEAF8] hover:bg-[#2F6FA6]/12'
          } hover:-translate-y-0.5 hover:shadow-lg`}
          style={{ color: '#DDEAF8' }}
      >
        <Bell size={24} className={unreadCount > 0 ? 'animate-pulse' : ''} />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1.5 -right-1.5 bg-[#06283B] text-white rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center border-2 animate-pulse"
                    style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: '#123F66' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 z-[999] backdrop-blur-sm animate-fade-in"
          />
          
          {/* Dropdown */}
          <div
            ref={dropdownRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`fixed z-[1000] w-[400px] max-w-[90vw] max-h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-transform ${
              isDragging ? 'cursor-grabbing scale-105' : 'cursor-default'
            }`}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)',
              touchAction: 'none'
            }}
          >
            {/* Drag Handle */}
            <div
              className="drag-handle py-3.5 px-5 flex items-center justify-center gap-2.5 cursor-grab active:cursor-grabbing border-b-2 select-none min-h-[48px]"
                style={{
                  background: 'linear-gradient(135deg, #123F66, #2F6FA6)',
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: 'rgba(93,140,207,0.22)'
                }}
            >
              <GripVertical size={20} className="opacity-80" style={{ color: '#DDE6ED' }} />
              <span className="text-[13px] font-medium opacity-90 tracking-wide" style={{ color: '#DDE6ED' }}>
                Drag to move
              </span>
            </div>

            {/* Header */}
            <div 
              className="flex items-center justify-between px-5 py-4 border-b border-black/10"
              style={{ background: 'linear-gradient(135deg, #5D8CCF, #123F66)' }}
            >
              <h3 className="m-0 text-base font-bold" style={{ color: '#DDE6ED' }}>
                Notifications
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="rounded-md px-2.5 py-2 flex items-center gap-1 min-h-[32px] transition-all duration-200 hover:scale-105"
                  style={{
                      background: 'rgba(221, 230, 237, 0.2)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: 'rgba(221, 230, 237, 0.3)',
                      color: '#DDE6ED'
                    }}
                >
                  <CheckCheck size={16} />
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1 bg-[#F7F6F6] min-h-[200px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-15 px-5 text-gray-400 text-center min-h-[200px]">
                  <Bell size={40} className="text-gray-300 mb-4" />
                  <p className="m-0 text-sm font-medium">No notifications yet</p>
                </div>
              ) : (
                notifications
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map(notification => (
                    <div
                      key={notification.id}
                      className={`py-3.5 px-4 border-b border-black/5 transition-all duration-200 ${
                          notification.read
                            ? 'bg-white opacity-65'
                            : 'bg-[#DDEAF8] border-l-4 border-l-[#2F6FA6]'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Priority Indicator */}
                        <div 
                          className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${getPriorityColor(notification.priority)}`}
                          style={{ boxShadow: `0 0 8px currentColor` }}
                        />
                        
                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          <p className="m-0 mb-1.5 text-sm font-medium text-slate-800 leading-relaxed break-words">
                            {notification.message}
                          </p>
                          <span className="text-xs text-slate-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-1">
                          {/* Toggle Read/Unread */}
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="bg-transparent border-none text-gray-400 cursor-pointer p-1.5 rounded transition-all duration-200 flex items-center justify-center min-w-[28px] min-h-[28px] hover:bg-[#2F6FA6]/10 hover:text-[#2F6FA6] hover:scale-110"
                          >
                            {notification.read ? <Mail size={14} /> : <MailOpen size={14} />}
                          </button>
                          
                          {/* Delete */}
                          <button
                            onClick={() => clearNotification(notification.id)}
                            className="bg-transparent border-none text-gray-400 cursor-pointer p-1.5 rounded transition-all duration-200 flex items-center justify-center min-w-[28px] min-h-[28px] hover:bg-red-500/10 hover:text-red-600 hover:scale-110"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;