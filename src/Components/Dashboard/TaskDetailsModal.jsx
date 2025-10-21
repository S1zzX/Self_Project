import { useState, useRef, useEffect } from 'react';
import { X, Edit2, Check, Trash2, CheckCircle, Flag, ChevronDown } from 'lucide-react';
import { STATUSES, PRIORITIES } from '../../utils/constants';
import { formatDate, getPriorityClass, getStatusClass } from '../../utils/taskUtils';
import AssigneeDropdown from './AssigneeDropdown';
import TaskProgressBar from './TaskProgressBar';

// Custom Dropdown Component with Icons
const CustomDropdown = ({ label, icon: Icon, iconColor, options, value, onChange, renderOption }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="flex flex-col gap-2" ref={dropdownRef}>
      <label className={`font-semibold ${iconColor} text-sm uppercase tracking-wide flex items-center gap-2`}>
        <Icon size={16} />
        {label}
      </label>
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 pr-10 rounded-lg border-2 border-gray-200 bg-white text-sm text-slate-700 outline-none transition-all duration-200 cursor-pointer hover:border-[#2563eb] flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {selectedOption?.icon}
            <span>{renderOption(value)}</span>
          </div>
          <ChevronDown 
            size={18} 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-[slideDown_0.2s_ease-out]">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`p-3 px-4 cursor-pointer transition-all duration-150 flex items-center gap-2 hover:bg-blue-50 ${
                  value === option.value ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-700'
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function TaskDetailsModal({ 
  task, 
  onClose, 
  onUpdateTask, 
  onDelete, 
  isAdmin, 
  users, 
  getMemberNameById, 
  validateTask, 
  apiRequest,
  updateTask // Add this prop for the API update function
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [modalErrors, setModalErrors] = useState({});
  const [currentTask, setCurrentTask] = useState(task); // Add local task state

  if (!currentTask) return null;

  // Prepare options for custom dropdowns
  const statusOptions = [
    { value: 'To Do', label: 'To Do', icon: <CheckCircle size={16} className="text-blue-600" /> },
    { value: 'In Progress', label: 'In Progress', icon: <CheckCircle size={16} className="text-yellow-600" /> },
    { value: 'Done', label: 'Done', icon: <CheckCircle size={16} className="text-green-600" /> }
  ];

  const priorityOptions = [
    { value: 'High', label: 'High', icon: <Flag size={16} className="text-red-600" /> },
    { value: 'Medium', label: 'Medium', icon: <Flag size={16} className="text-orange-600" /> },
    { value: 'Low', label: 'Low', icon: <Flag size={16} className="text-green-600" /> }
  ];

  const getOptionLabel = (options, value) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const updateTaskProgressInModal = async (newProgress) => {
    if (!currentTask) return;

    if (!isAdmin && currentTask.deadline && !currentTask.completed) {
      const deadlineDate = new Date(currentTask.deadline);
      const today = new Date();
      deadlineDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        alert('Task is overdue. Only admin can modify overdue tasks.');
        return;
      }
    }

    let newStatus = currentTask.status;
    let newCompleted = currentTask.completed;

    if (newProgress === 0) {
      newStatus = 'To Do';
      newCompleted = false;
    } else if (newProgress === 100) {
      newStatus = 'Done';
      newCompleted = true;
    } else {
      newStatus = 'In Progress';
      newCompleted = false;
    }

    const payload = {
      ...currentTask,
      progress: newProgress,
      status: newStatus,
      completed: newCompleted
    };

    // Update local state immediately
    setCurrentTask(payload);

    try {
      await updateTask(currentTask.id, payload);
      // Also update parent component state
      onUpdateTask(currentTask.id, payload);
    } catch (error) {
      console.error('Error updating task progress:', error);
      alert('Error updating task progress: ' + error.message);
      // Revert local state if API call failed
      setCurrentTask(currentTask);
    }
  };

  const enterEditMode = () => {
    setEditingTask({
      text: currentTask.text,
      description: currentTask.description || '',
      assignee: currentTask.assignees || [],
      deadline: currentTask.deadline || '',
      priority: currentTask.priority || 'Medium',
      status: currentTask.status || 'To Do',
      completed: currentTask.completed,
      progress: currentTask.progress || 0
    });
    setIsEditing(true);
    setModalErrors({});
  };

  const saveModalEdit = async () => {
    const validationErrors = validateTask(editingTask);
    setModalErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      text: editingTask.text.trim(),
      description: editingTask.description?.trim() || '',
      assignees: editingTask.assignee,
      deadline: editingTask.deadline || '',
      priority: editingTask.priority || 'Medium',
      status: editingTask.status || 'To Do',
      completed: editingTask.completed,
      progress: editingTask.progress || 0,
      requesterType: 'admin'
    };

    // Update local state immediately for instant UI update
    const updatedTask = { ...currentTask, ...payload };
    setCurrentTask(updatedTask);
    setIsEditing(false);
    setEditingTask(null);
    setModalErrors({});

    try {
      // Update through API in background
      await updateTask(task.id, payload);
      // Also update parent component state
      onUpdateTask(task.id, updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task: ' + error.message);
      // Revert local state if API call failed
      setCurrentTask(task);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingTask(null);
    setModalErrors({});
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-[600px] w-[90%] max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[slideIn_0.3s_ease-out] relative [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-[#2563eb]/10">
          <h2 className="text-2xl font-bold text-black m-0 flex-1 mr-4 leading-tight">
            {isEditing ? (
              <div className="w-full">
                <input
                  type="text"
                  value={editingTask.text}
                  onChange={e => setEditingTask({ ...editingTask, text: e.target.value })}
                  className="w-full p-1 px-2 border-2 border-gray-200 rounded text-2xl font-bold m-0 outline-none transition-all duration-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)] text-black"
                  autoFocus
                />
                {modalErrors.text && <span className="text-red-600 text-xs mt-1 block">{modalErrors.text}</span>}
              </div>
            ) : (
              currentTask.text
            )}
          </h2>
          <button className="bg-transparent border-none text-2xl text-slate-500 cursor-pointer p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:bg-red-600/10 hover:text-red-600" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-5">
          {/* Description */}
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-blue-600 text-sm uppercase tracking-wide">Description</div>
            {isEditing ? (
              <>
                <textarea
                  value={editingTask.description}
                  onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="min-h-[80px] resize-y p-1 px-2 border-2 border-gray-200 rounded text-base outline-none transition-all duration-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
                  placeholder="Task description..."
                />
                {modalErrors.description && <span className="text-red-600 text-xs mt-1 block">{modalErrors.description}</span>}
              </>
            ) : (
              <div className="p-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg text-[#64748b] text-base leading-normal min-h-[20px] whitespace-pre-wrap">
                {currentTask.description || 'No description provided'}
              </div>
            )}
          </div>

          {/* Assignees */}
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-purple-600 text-sm uppercase tracking-wide">Assigned To</div>
            {isEditing ? (
              <>
                <AssigneeDropdown
                  value={editingTask.assignee}
                  onChange={assignee => setEditingTask({ ...editingTask, assignee })}
                  options={users}
                  getMemberNameById={getMemberNameById}
                  hasError={!!modalErrors.assignee}
                />
                {modalErrors.assignee && <span className="text-red-600 text-xs mt-1 block">{modalErrors.assignee}</span>}
              </>
            ) : (
              <div className="p-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg text-[#64748b] text-base leading-normal min-h-[20px]">
                {Array.isArray(currentTask.assignees) && currentTask.assignees.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(currentTask.assigneeNames || currentTask.assignees.map(id => getMemberNameById(id, currentTask))).map((name, index) => (
                      <span key={index} className="bg-[#2563eb] text-white px-3 py-1.5 rounded-2xl text-sm font-medium">
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-red-600 italic">Unassigned</span>
                )}
              </div>
            )}
          </div>

          {/* Deadline */}
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-orange-600 text-sm uppercase tracking-wide">Deadline</div>
            {isEditing ? (
              <>
                <input
                  type="date"
                  value={editingTask.deadline}
                  onChange={e => setEditingTask({ ...editingTask, deadline: e.target.value })}
                  className="p-1 px-2 border-2 border-gray-200 rounded text-base outline-none transition-all duration-200 focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
                  min={new Date().toISOString().split('T')[0]}
                />
                {modalErrors.deadline && <span className="text-red-600 text-xs mt-1 block">{modalErrors.deadline}</span>}
              </>
            ) : (
              <div className="p-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg text-[#64748b] text-base leading-normal min-h-[20px]">
                {formatDate(currentTask.deadline)}
                {currentTask.deadline && (() => {
                  const deadlineDate = new Date(currentTask.deadline);
                  const today = new Date();
                  deadlineDate.setHours(0, 0, 0, 0);
                  today.setHours(0, 0, 0, 0);
                  return deadlineDate < today && !currentTask.completed;
                })() && (
                  <span className="text-red-600 ml-2 font-bold">(Overdue)</span>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          {isEditing ? (
            <CustomDropdown
              label="Status"
              icon={CheckCircle}
              iconColor="text-green-600"
              options={statusOptions}
              value={editingTask.status}
              onChange={(newStatus) => {
                let newProgress = editingTask.progress;
                let newCompleted = editingTask.completed;
                
                // Automatically set progress based on status
                if (newStatus === 'To Do') {
                  newProgress = 0;
                  newCompleted = false;
                } else if (newStatus === 'In Progress') {
                  newProgress = newProgress === 0 || newProgress === 100 ? 50 : newProgress;
                  newCompleted = false;
                } else if (newStatus === 'Done') {
                  newProgress = 100;
                  newCompleted = true;
                }
                
                setEditingTask({ 
                  ...editingTask, 
                  status: newStatus,
                  progress: newProgress,
                  completed: newCompleted
                });
              }}
              renderOption={(val) => getOptionLabel(statusOptions, val)}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="font-semibold text-green-600 text-sm uppercase tracking-wide flex items-center gap-2">
                <CheckCircle size={16} />
                Status
              </div>
              <div className={`p-3 px-4 border-2 border-[#2563eb]/10 rounded-lg text-base leading-normal min-h-[20px] flex items-center gap-2 ${getStatusClass(currentTask.status, currentTask.completed)}`}>
                {currentTask.status === 'To Do' && <CheckCircle size={16} className="text-blue-600" />}
                {currentTask.status === 'In Progress' && <CheckCircle size={16} className="text-yellow-600" />}
                {(currentTask.status === 'Done' || currentTask.completed) && <CheckCircle size={16} className="text-green-600" />}
                <span>{currentTask.completed ? 'Completed ✓' : currentTask.status || 'To Do'}</span>
              </div>
            </div>
          )}

          {/* Priority */}
          {isEditing ? (
            <CustomDropdown
              label="Priority"
              icon={Flag}
              iconColor="text-red-600"
              options={priorityOptions}
              value={editingTask.priority}
              onChange={(newPriority) => setEditingTask({ ...editingTask, priority: newPriority })}
              renderOption={(val) => getOptionLabel(priorityOptions, val)}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="font-semibold text-red-600 text-sm uppercase tracking-wide flex items-center gap-2">
                <Flag size={16} />
                Priority
              </div>
              <div className="p-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg text-[#64748b] text-base leading-normal min-h-[20px] flex items-center gap-2">
                {currentTask.priority === 'High' && <Flag size={16} className="text-red-600" />}
                {currentTask.priority === 'Medium' && <Flag size={16} className="text-orange-600" />}
                {currentTask.priority === 'Low' && <Flag size={16} className="text-green-600" />}
                <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${getPriorityClass(currentTask.priority)}`}>
                  {currentTask.priority || 'Medium'}
                </span>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-blue-600 text-sm uppercase tracking-wide">Progress</div>
            {isEditing ? (
              <div className="p-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg text-[#64748b] text-base leading-normal min-h-[20px]">
                <TaskProgressBar 
                  progress={editingTask.progress || 0}
                  onProgressChange={(newProgress) => {
                    let newStatus = editingTask.status;
                    if (newProgress === 0) {
                      newStatus = 'To Do';
                    } else if (newProgress === 100) {
                      newStatus = 'Done';
                    } else {
                      newStatus = 'In Progress';
                    }
                    
                    setEditingTask({ 
                      ...editingTask, 
                      progress: newProgress,
                      status: newStatus,
                      completed: newProgress === 100
                    });
                  }}
                  disabled={false}
                />
              </div>
            ) : (
              <div className="p-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg text-[#64748b] text-base leading-normal min-h-[20px]">
                <TaskProgressBar 
                  progress={currentTask.progress || 0}
                  onProgressChange={updateTaskProgressInModal}
                  disabled={!isAdmin && currentTask.deadline && !currentTask.completed && (() => {
                    const deadlineDate = new Date(currentTask.deadline);
                    const today = new Date();
                    deadlineDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    return deadlineDate < today;
                  })()}
                />
              </div>
            )}
          </div>

          {/* Task ID */}
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-slate-600 text-sm uppercase tracking-wide">Task ID</div>
            <div className="p-3 px-4 bg-slate-200/10 border-2 border-[#2563eb]/10 rounded-lg text-slate-500 text-base leading-normal min-h-[20px]">
              #{currentTask.id}
            </div>
          </div>
        </div>

        {/* Footer */}
        {isAdmin && (
          <div className="flex justify-end gap-3 mt-8 pt-5 border-t-2 border-[#2563eb]/10">
            {isEditing ? (
              <>
                <button className="px-6 py-3 bg-[#f1f5f9] text-[#1e293b] border-2 border-[#e2e8f0] rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 flex items-center gap-2 hover:bg-[#e8eef9] hover:border-[#2563eb] hover:text-white" onClick={cancelEdit}>
                  <X size={16} />Cancel
                </button>
                <button className="px-6 py-3 bg-[#2563eb] text-white border-none rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.12)] flex items-center gap-2 hover:bg-[#2563eb] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(37,99,235,0.18)]" onClick={saveModalEdit}>
                  <Check size={16} />Save Changes
                </button>
              </>
            ) : (
              <>
                <button className="px-6 py-3 bg-[#f1f5f9] text-[#1e293b] border-2 border-[#e2e8f0] rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 hover:bg-[#e8eef9] hover:border-[#2563eb] hover:text-white" onClick={onClose}>
                  Close
                </button>
                <button className="px-6 py-3 bg-[#2563eb] text-white border-none rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.12)] flex items-center gap-2 hover:bg-[#2563eb] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(37,99,235,0.18)]" onClick={enterEditMode}>
                  <Edit2 size={16} />Edit
                </button>
                <button
                  className="px-6 py-3 bg-red-600 text-white border-none rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 shadow-[0_4px_12px_rgba(220,38,38,0.3)] flex items-center gap-2 hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(220,38,38,0.4)]"
                  onClick={() => {
                    onClose();
                    onDelete(currentTask.id);
                  }}
                >
                  <Trash2 size={16} />Delete Task
                </button>
              </>
            )}
          </div>
        )}
        {!isAdmin && (
          <div className="flex justify-end gap-3 mt-8 pt-5 border-t-2 border-[#2563eb]/10">
            <button className="px-6 py-3 bg-[#f1f5f9] text-[#1e293b] border-2 border-[#e2e8f0] rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 hover:bg-[#e8eef9] hover:border-[#2563eb] hover:text-white" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDetailsModal;