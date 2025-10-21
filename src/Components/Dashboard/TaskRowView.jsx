import React from 'react';
import { Check, Eye, Trash2, Calendar, User, Flag, TrendingUp } from 'lucide-react';
import { TaskProgressBar } from '../index';
import { formatDate } from '../../utils/taskUtils';

export default function TaskRowView({
  task,
  index,
  isOverdue,
  isAdmin,
  selectedTaskIds,
  users,
  getMemberNameById,
  updateTaskProgress,
  toggleComplete,
  toggleTaskSelection,
  openTaskDetails,
  openDeleteModal
}) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'text-green-700 bg-green-100 border-green-300';
      case 'In Progress': return 'text-blue-700 bg-blue-100 border-blue-300';
      case 'To Do': return 'text-slate-700 bg-slate-100 border-slate-300';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div
      className={`relative flex items-center gap-4 p-4 border-2 rounded-xl transition-all duration-200 shadow-sm mb-3 animate-fadeInUp cursor-pointer ${
        task.completed
          ? 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-300 opacity-100'
          : isAdmin && isOverdue
          ? 'border-red-600 bg-red-50'
          : isOverdue && !isAdmin
          ? 'border-[#2563eb]/20 bg-white/90'
          : 'border-[#2563eb]/20 bg-white hover:-translate-y-0.5 hover:shadow-md hover:border-[#2563eb]'
      } ${selectedTaskIds.includes(task.id) ? 'ring-2 ring-[#2563eb] ring-offset-2' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => openTaskDetails(task)}
    >
      {/* Overdue overlay for non-admin users */}
      {isOverdue && !isAdmin && (
        <>
          <div className="absolute inset-0 bg-white/15 backdrop-blur-[1px] rounded-xl z-[1]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600/95 text-white px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap z-10 pointer-events-none">
            OVERDUE - Contact Admin
          </div>
        </>
      )}

      {/* Overdue badge for admin */}
      {isAdmin && isOverdue && (
        <div className="absolute -top-2.5 -right-2.5 bg-red-600 text-white px-3 py-1 rounded-xl text-[11px] font-bold z-[5] animate-pulse shadow-lg">
          OVERDUE
        </div>
      )}

      {/* Selection checkbox */}
      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selectedTaskIds.includes(task.id)}
          onChange={() => toggleTaskSelection(task.id)}
          className="w-5 h-5 cursor-pointer accent-[#2563eb]"
        />
      </div>

      {/* Task Number Badge */}
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#2563eb] to-[#3b82f6] text-white font-bold text-lg shadow-md flex-shrink-0">
        {task.id}
      </div>

      {/* Complete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleComplete(task.id);
        }}
        className={`w-8 h-8 rounded-full border-2 border-slate-500 bg-transparent cursor-pointer flex items-center justify-center transition-all duration-200 hover:border-[#2563eb] hover:scale-110 active:scale-90 flex-shrink-0 ${
          task.completed ? 'bg-gradient-to-br from-[#2563eb] to-[#2563eb] border-[#2563eb] text-white animate-checkBounce' : ''
        } ${isOverdue && !isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
        disabled={isOverdue && !isAdmin}
      >
        {task.completed && <Check size={18} className="animate-checkmark" />}
      </button>

      {/* Task Title - Flex 1 */}
      <div className="flex-1 min-w-[200px]">
        <div className="font-bold text-[#1e293b] text-base break-words" style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
          {task.text}
        </div>
        <div className="text-sm text-slate-500 mt-1 line-clamp-1">
          {task.description || 'No description'}
        </div>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-2 min-w-[180px] px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
        <User size={16} className="text-purple-600 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-[10px] text-purple-600 font-semibold uppercase">Assignee</div>
          <div className="text-sm text-[#1e293b] font-medium truncate">
            {task.assigneeNames && task.assigneeNames.length > 0
              ? task.assigneeNames.join(', ')
              : (task.assignees?.map(id => getMemberNameById(id, task)).join(', ') || 'Unassigned')}
          </div>
        </div>
      </div>

      {/* Deadline */}
      <div className="flex items-center gap-2 min-w-[150px] px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
        <Calendar size={16} className="text-orange-600 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-[10px] text-orange-600 font-semibold uppercase">Deadline</div>
          <div className="text-sm text-[#1e293b] font-medium">
            {formatDate(task.deadline)}
          </div>
        </div>
      </div>

      {/* Priority */}
      <div className={`flex items-center gap-2 min-w-[120px] px-3 py-2 rounded-lg border ${getPriorityColor(task.priority)}`}>
        <Flag size={16} className="flex-shrink-0" />
        <div className="flex-1">
          <div className="text-[10px] font-semibold uppercase opacity-70">Priority</div>
          <div className="text-sm font-bold">
            {task.priority}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className={`flex items-center gap-2 min-w-[130px] px-3 py-2 rounded-lg border ${getStatusColor(task.status)}`}>
        <TrendingUp size={16} className="flex-shrink-0" />
        <div className="flex-1">
          <div className="text-[10px] font-semibold uppercase opacity-70">Status</div>
          <div className="text-sm font-bold">
            {task.status}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="min-w-[120px]" onClick={(e) => e.stopPropagation()}>
        <TaskProgressBar
          progress={task.progress || 0}
          onProgressChange={(newProgress) => updateTaskProgress(task.id, newProgress)}
          disabled={isOverdue && !isAdmin}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openTaskDetails(task);
          }}
          className="p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-[#2563eb] hover:bg-[#2563eb]/10"
          title="View Details"
        >
          <Eye size={18} />
        </button>
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(task.id, task.text);
            }}
            className="p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-red-600 hover:bg-red-100"
            title="Delete Task"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
