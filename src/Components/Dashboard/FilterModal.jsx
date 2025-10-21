import { useState, useEffect } from 'react';
import { X, CheckCircle, Flag, User, Calendar, ChevronDown } from 'lucide-react';
import { STATUSES, PRIORITIES } from '../../utils/constants';

// Custom Dropdown Component
function CustomDropdown({ label, icon: Icon, iconColor, options, value, onChange, renderOption }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <label className={`font-semibold ${iconColor} text-sm uppercase tracking-wide flex items-center gap-2`}>
        <Icon size={16} />
        {label}
      </label>
      <div className="relative">
        <div
          className="w-full p-3 pl-10 pr-10 rounded-lg border-2 border-gray-200 bg-white text-sm text-slate-700 outline-none transition-all duration-200 cursor-pointer hover:border-[#2563eb] flex items-center justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <Icon size={18} className={`${iconColor} flex-shrink-0`} />
            <span>{renderOption ? renderOption(value) : value}</span>
          </div>
          <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#2563eb] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className={`p-3 pl-10 cursor-pointer transition-all duration-200 hover:bg-blue-50 flex items-center gap-2 relative ${
                  value === option.value ? 'bg-blue-100 font-semibold' : ''
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.icon && (
                  <span className="absolute left-3">{option.icon}</span>
                )}
                <span className={option.icon ? '' : 'ml-0'}>{option.label}</span>
                {value === option.value && (
                  <CheckCircle size={16} className="ml-auto text-blue-600" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterModal({ 
  isOpen, 
  onClose, 
  filter, 
  setFilter,
  priorityFilter,
  setPriorityFilter,
  assigneeFilter,
  setAssigneeFilter,
  deadlineFilter,
  setDeadlineFilter,
  users 
}) {
  const [tempFilter, setTempFilter] = useState(filter);
  const [tempPriorityFilter, setTempPriorityFilter] = useState(priorityFilter);
  const [tempAssigneeFilter, setTempAssigneeFilter] = useState(assigneeFilter);
  const [tempDeadlineFilter, setTempDeadlineFilter] = useState(deadlineFilter);

  useEffect(() => {
    if (isOpen) {
      setTempFilter(filter);
      setTempPriorityFilter(priorityFilter);
      setTempAssigneeFilter(assigneeFilter);
      setTempDeadlineFilter(deadlineFilter);
    }
  }, [isOpen, filter, priorityFilter, assigneeFilter, deadlineFilter]);

  if (!isOpen) return null;

  const clearAllFilters = () => {
    setTempFilter('All');
    setTempPriorityFilter('All');
    setTempAssigneeFilter('All');
    setTempDeadlineFilter('All');
  };

  const applyFilters = () => {
    setFilter(tempFilter);
    setPriorityFilter(tempPriorityFilter);
    setAssigneeFilter(tempAssigneeFilter);
    setDeadlineFilter(tempDeadlineFilter);
    onClose();
  };

  const hasActiveFilters = tempFilter !== 'All' || tempPriorityFilter !== 'All' || 
                          tempAssigneeFilter !== 'All' || tempDeadlineFilter !== 'All';

  // Prepare options with icons
  const statusOptions = [
    { value: 'All', label: 'All Status', icon: <CheckCircle size={16} className="text-green-600" /> },
    ...STATUSES.map(s => ({ 
      value: s, 
      label: s,
      icon: s === 'Done' ? <CheckCircle size={16} className="text-green-600" /> : 
            s === 'In Progress' ? <CheckCircle size={16} className="text-blue-600" /> :
            <CheckCircle size={16} className="text-slate-600" />
    }))
  ];

  const priorityOptions = [
    { value: 'All', label: 'All Priorities', icon: <Flag size={16} className="text-red-600" /> },
    ...PRIORITIES.map(p => ({ 
      value: p, 
      label: p,
      icon: p === 'High' ? <Flag size={16} className="text-red-600" /> : 
            p === 'Medium' ? <Flag size={16} className="text-orange-600" /> :
            <Flag size={16} className="text-green-600" />
    }))
  ];

  const assigneeOptions = [
    { value: 'All', label: 'All Assignees', icon: <User size={16} className="text-purple-600" /> },
    ...users.map(u => ({ 
      value: u.id, 
      label: u.name,
      icon: <User size={16} className="text-purple-600" />
    }))
  ];

  const deadlineOptions = [
    { value: 'All', label: 'All Dates', icon: <Calendar size={16} className="text-orange-600" /> },
    { value: 'Overdue', label: 'Overdue', icon: <Calendar size={16} className="text-red-600" /> },
    { value: 'Today', label: 'Today', icon: <Calendar size={16} className="text-blue-600" /> },
    { value: 'This Week', label: 'This Week', icon: <Calendar size={16} className="text-green-600" /> }
  ];

  const getOptionLabel = (options, value) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-[500px] w-[90%] shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[slideIn_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-5 pb-4 border-b-2 border-[#2563eb]/10">
          <h2 className="text-2xl font-bold text-[#2563eb] m-0 flex-1 mr-4 leading-tight">Filter Tasks</h2>
          <button className="bg-transparent border-none text-2xl text-slate-500 cursor-pointer p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:bg-red-600/10 hover:text-red-600" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-5 my-5">
          <CustomDropdown
            label="Status"
            icon={CheckCircle}
            iconColor="text-green-600"
            options={statusOptions}
            value={tempFilter}
            onChange={setTempFilter}
            renderOption={(val) => getOptionLabel(statusOptions, val)}
          />

          <CustomDropdown
            label="Priority"
            icon={Flag}
            iconColor="text-red-600"
            options={priorityOptions}
            value={tempPriorityFilter}
            onChange={setTempPriorityFilter}
            renderOption={(val) => getOptionLabel(priorityOptions, val)}
          />

          <CustomDropdown
            label="Assignee"
            icon={User}
            iconColor="text-purple-600"
            options={assigneeOptions}
            value={tempAssigneeFilter}
            onChange={setTempAssigneeFilter}
            renderOption={(val) => getOptionLabel(assigneeOptions, val)}
          />

          <CustomDropdown
            label="Deadline"
            icon={Calendar}
            iconColor="text-orange-600"
            options={deadlineOptions}
            value={tempDeadlineFilter}
            onChange={setTempDeadlineFilter}
            renderOption={(val) => getOptionLabel(deadlineOptions, val)}
          />
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-5 border-t-2 border-[#2563eb]/10">
          {hasActiveFilters && (
            <button 
              className="px-5 py-2.5 bg-red-600/10 text-red-600 border-2 border-red-600/20 rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 hover:bg-red-600/20 hover:border-red-600"
              onClick={clearAllFilters}
            >
              Clear All Filters
            </button>
          )}
          <button 
            className="px-6 py-2.5 bg-[#2563eb] text-white border-none rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 shadow-[0_2px_6px_rgba(37,99,235,0.12)] hover:bg-[#2563eb] hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(37,99,235,0.18)]"
            onClick={applyFilters}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterModal;