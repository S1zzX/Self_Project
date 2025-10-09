import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, GripVertical, MailOpen, Mail } from 'lucide-react';
import { useNotifications } from '../hook/useNotifications';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dropdownRef = useRef(null);
  
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
      {/* Bell Button with Enhanced Animations */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full w-12 h-12 flex items-center justify-center cursor-pointer relative
          transition-all duration-300 ease-out
          ${unreadCount > 0
            ? 'bg-red-600/10 border border-red-600/30 hover:bg-red-600/20 hover:border-red-600/50'
            : 'bg-[#2563eb]/10 border border-[#e2e8f0] hover:bg-[#2563eb]/20'
          }
          hover:-translate-y-1 hover:shadow-xl
          active:scale-95 active:shadow-md
          group`}
        style={{ color: '#2563eb' }}
      >
        {/* Bell Icon with Swing Animation on Hover */}
        <Bell 
          size={24} 
          className={`transition-all duration-300
            ${unreadCount > 0 ? 'text-red-600' : 'text-[#2563eb]'}
            group-hover:animate-[swing_0.6s_ease-in-out]`}
        />
        
        {/* Badge with Pop Animation */}
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1.5 -right-1.5 bg-[#1e293b] text-white rounded-full 
              w-5 h-5 text-xs font-bold flex items-center justify-center border-2
              animate-[bounce_1s_ease-in-out_infinite]
              shadow-lg shadow-slate-900/50"
            style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: '#1e293b' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        
        {/* Ripple Effect */}
        {unreadCount > 0 && (
          <span className="absolute inset-0 rounded-full bg-red-600/20 animate-ping" />
        )}
      </button>

      {/* Custom Keyframes for Swing Animation */}
      <style>{`
        @keyframes swing {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(15deg); }
          50% { transform: rotate(-10deg); }
          75% { transform: rotate(5deg); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {isOpen && (
        <>
          {/* Overlay with Fade In */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 z-[999] backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          />
          
          {/* Dropdown with Slide Down Animation */}
          <div
            ref={dropdownRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`fixed z-[1000] w-[400px] max-w-[90vw] max-h-[500px] 
              bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden
              transition-all duration-300 ease-out
              ${isDragging ? 'cursor-grabbing scale-105 shadow-3xl' : 'cursor-default'}`}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)',
              touchAction: 'none',
              animation: 'slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Drag Handle with Gradient Animation */}
            <div
              className="drag-handle py-3.5 px-5 flex items-center justify-center gap-2.5 
                cursor-grab active:cursor-grabbing border-b-2 select-none min-h-[48px]
                transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #123F66, #2F6FA6)',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                borderBottomColor: 'rgba(93,140,207,0.22)'
              }}
            >
              <GripVertical 
                size={20} 
                className="opacity-80 transition-transform duration-300 hover:scale-110" 
                style={{ color: '#DDE6ED' }} 
              />
              <span 
                className="text-[13px] font-medium opacity-90 tracking-wide" 
                style={{ color: '#DDE6ED' }}
              >
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
                  className="rounded-md px-2.5 py-2 flex items-center gap-1 min-h-[32px] 
                    transition-all duration-300 ease-out
                    hover:scale-110 hover:rotate-12
                    active:scale-95"
                  style={{
                    background: 'rgba(37,99,235,0.08)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'rgba(37,99,235,0.12)',
                    color: '#1e293b'
                  }}
                >
                  <CheckCheck size={16} className="transition-transform duration-300" />
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1 bg-[#f8fafc] min-h-[200px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-15 px-5 text-[#64748b] text-center min-h-[200px]">
                  <Bell 
                    size={40} 
                    className="text-[#cbd5e1] mb-4 animate-[swing_2s_ease-in-out_infinite]" 
                  />
                  <p className="m-0 text-sm font-medium text-[#64748b] animate-pulse">
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`py-3.5 px-4 border-b border-black/5 
                        transition-all duration-300 ease-out
                        hover:translate-x-1 hover:shadow-md
                        ${notification.read
                          ? 'bg-white opacity-95 hover:bg-gray-50'
                          : 'bg-[#e6f0ff] border-l-4 border-l-[#2563eb] hover:bg-blue-50'
                        }`}
                      style={{
                        animation: `slideInRight 0.4s ease-out ${index * 0.05}s backwards`
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Priority Indicator with Pulse */}
                        <div 
                          className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 
                            ${getPriorityColor(notification.priority)}
                            ${!notification.read ? 'animate-pulse' : ''}`}
                          style={{ boxShadow: `0 0 8px currentColor` }}
                        />
                        
                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          <p className="m-0 mb-1.5 text-sm font-medium text-[#1e293b] leading-relaxed break-words">
                            {notification.message}
                          </p>
                          <span className="text-xs text-[#64748b]">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>

                        {/* Action Buttons with Enhanced Hover Effects */}
                        <div className="flex gap-1">
                          {/* Toggle Read/Unread */}
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="bg-transparent border-none text-[#64748b] cursor-pointer p-1.5 
                              rounded transition-all duration-300 ease-out
                              flex items-center justify-center min-w-[28px] min-h-[28px] 
                              hover:bg-[#2563eb]/10 hover:text-[#2563eb] 
                              hover:scale-125 hover:rotate-12
                              active:scale-95"
                          >
                            {notification.read ? <Mail size={14} /> : <MailOpen size={14} />}
                          </button>
                          
                          {/* Delete */}
                          <button
                            onClick={() => clearNotification(notification.id)}
                            className="bg-transparent border-none text-[#ef4444] cursor-pointer p-1.5 
                              rounded transition-all duration-300 ease-out
                              flex items-center justify-center min-w-[28px] min-h-[28px] 
                              hover:bg-red-500/10 hover:text-red-600 
                              hover:scale-125 hover:rotate-90
                              active:scale-95"
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