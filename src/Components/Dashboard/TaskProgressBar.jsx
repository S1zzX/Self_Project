import { useState, useEffect, useRef } from 'react';
import { getStatusFromProgress, getStatusColor } from '../../utils/taskUtils';

function TaskProgressBar({ progress, onProgressChange, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);
  const progressRef = useRef(null);
  const initialProgressRef = useRef(progress);
  const rafRef = useRef(null);
  const dragProgressRef = useRef(progress); // Track drag progress without re-renders

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  const updateProgress = (clientX) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const newProgress = Math.max(0, Math.min(100, (x / rect.width) * 100));
    dragProgressRef.current = newProgress;
    
    // Update visual immediately via DOM manipulation for smoother animation
    const progressBar = progressRef.current.querySelector('.progress-fill');
    const handle = progressRef.current.querySelector('.progress-handle');
    const percentText = progressRef.current.querySelector('.progress-percent');
    
    if (progressBar) {
      progressBar.style.transition = 'none'; // Disable transitions during drag
      progressBar.style.width = `${newProgress}%`;
    }
    if (handle) {
      handle.style.transition = 'none'; // Disable transitions during drag
      handle.style.left = `calc(${newProgress}% - 8px)`;
    }
    if (percentText) {
      percentText.textContent = `${Math.round(newProgress)}%`;
    }
    
    return newProgress;
  };

  const handleMouseDown = (e) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    initialProgressRef.current = Math.round(progress);
    dragProgressRef.current = progress;
    updateProgress(e.clientX);
  };

  const handleTouchStart = (e) => {
    if (disabled) return;
    e.stopPropagation();
    setIsDragging(true);
    initialProgressRef.current = Math.round(progress);
    dragProgressRef.current = progress;
    
    const touch = e.touches[0];
    updateProgress(touch.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        updateProgress(e.clientX);
      });
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        updateProgress(touch.clientX);
      });
    };

    const handleEnd = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      const roundedProgress = Math.round(dragProgressRef.current);
      
      // Smooth transition to final position
      const progressBar = progressRef.current?.querySelector('.progress-fill');
      const handle = progressRef.current?.querySelector('.progress-handle');
      const percentText = progressRef.current?.querySelector('.progress-percent');
      
      // Re-enable transitions for smooth final animation with bounce effect
      if (progressBar) {
        progressBar.style.transition = 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        progressBar.style.width = `${roundedProgress}%`;
      }
      if (handle) {
        handle.style.transition = 'left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease-out';
        handle.style.left = `calc(${roundedProgress}% - 8px)`;
      }
      if (percentText) {
        percentText.textContent = `${roundedProgress}%`;
      }
      
      // Update React state after a short delay to let animation complete
      setTimeout(() => {
        setIsDragging(false);
        setLocalProgress(roundedProgress);
        
        // Clear inline transitions to let CSS classes take over
        if (progressBar) progressBar.style.transition = '';
        if (handle) handle.style.transition = '';
      }, 100);
      
      if (roundedProgress !== initialProgressRef.current && !disabled) {
        onProgressChange?.(roundedProgress);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isDragging, localProgress, disabled, onProgressChange]);

  return (
    <div className="mt-3 p-3 bg-slate-200/10 rounded-lg border border-[#2563eb]/20">
      <div className="flex justify-between mb-2 text-xs font-semibold">
        <span className="text-slate-500 uppercase tracking-wider">Progress</span>
        <span className="text-[#2563eb] font-bold progress-percent">{Math.round(localProgress)}%</span>
      </div>
      <div 
        ref={progressRef}
        className={`relative w-full h-5 bg-slate-400/20 rounded-full mb-2 touch-none group select-none ${
          isDragging 
            ? 'cursor-grabbing' 
            : disabled 
              ? 'cursor-not-allowed opacity-60' 
              : 'cursor-pointer hover:bg-slate-400/30 transition-colors duration-200'
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        title={disabled ? "Task is overdue - Contact admin to modify" : "Drag to update progress"}
        style={{ willChange: isDragging ? 'auto' : 'auto' }}
      >
        <div 
          className={`progress-fill h-full bg-gradient-to-r from-[#2563eb] to-[#3b82f6] rounded-full relative ${
            isDragging ? '' : 'transition-[width] duration-200 ease-out'
          }`}
          style={{ width: `${localProgress}%` }}
        />
        <div 
          className={`progress-handle absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#2563eb] rounded-full shadow-md z-10 ${
            isDragging 
              ? 'cursor-grabbing scale-110 shadow-lg border-[#1d4ed8]' 
              : disabled 
                ? 'cursor-not-allowed opacity-50 transition-all duration-200' 
                : 'cursor-grab hover:scale-105 hover:border-[#1d4ed8] hover:shadow-lg active:cursor-grabbing transition-all duration-200 ease-out'
          }`}
          style={{ left: `calc(${localProgress}% - 8px)` }}
        />
        {disabled && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-red-600/95 text-white px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200 z-[100] group-hover:opacity-100">
            Task is overdue - Contact admin to modify
          </div>
        )}
      </div>
      <div className={`text-center text-[11px] font-semibold uppercase tracking-wider ${getStatusColor(getStatusFromProgress(localProgress))}`}>
        {getStatusFromProgress(localProgress)}
      </div>
    </div>
  );
}

export default TaskProgressBar;