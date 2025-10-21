import { useState, useEffect, useRef } from 'react';
import { TrendingUp } from 'lucide-react';

function StatusDropdown({ value, onChange, options, hasError }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-yellow-100 text-yellow-700';
      case 'To Do': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="relative min-w-[130px]" ref={ref}>
      <div
        className={`bg-white border-2 rounded-lg p-3 text-base select-none transition-all duration-200 cursor-pointer ${
          hasError ? 'border-red-600' : 'border-gray-200 hover:border-[#2563eb]'
        }`}
        onClick={() => setOpen(o => !o)}
      >
        {value || 'Select status...'}
        <span className="float-right font-bold">▼</span>
      </div>
      {open && (
        <div className="absolute top-[110%] left-0 bg-white border-2 border-[#2563eb] rounded-lg shadow-[0_12px_32px_rgba(37,99,235,0.25)] z-50 min-w-[130px] py-2 max-h-[300px] overflow-y-auto">
          {options && options.length > 0 ? (
            options.map(status => (
              <label key={status} className="flex items-center justify-between px-4 py-2 text-[15px] cursor-pointer transition-colors duration-200 hover:bg-slate-100 group">
                <div className="flex items-center flex-1">
                  <input
                    type="checkbox"
                    checked={value === status}
                    onChange={() => onChange(status)}
                    className="mr-2 accent-[#2563eb]"
                  />
                  <span className={value === status ? 'font-semibold text-slate-700' : 'text-slate-600'}>{status}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 ${getStatusColor(status)}`}>
                  <TrendingUp size={10} />
                  {status}
                </span>
              </label>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-slate-500 text-center">
              No statuses available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StatusDropdown;
