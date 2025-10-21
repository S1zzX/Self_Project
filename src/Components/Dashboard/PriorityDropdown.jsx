import { useState, useEffect, useRef } from 'react';
import { Flag } from 'lucide-react';

function PriorityDropdown({ value, onChange, options, hasError }) {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-orange-100 text-orange-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="relative min-w-[120px]" ref={ref}>
      <div
        className={`bg-white border-2 rounded-lg p-3 text-base select-none transition-all duration-200 cursor-pointer ${
          hasError ? 'border-red-600' : 'border-gray-200 hover:border-[#2563eb]'
        }`}
        onClick={() => setOpen(o => !o)}
      >
        {value || 'Select priority...'}
        <span className="float-right font-bold">▼</span>
      </div>
      {open && (
        <div className="absolute top-[110%] left-0 bg-white border-2 border-[#2563eb] rounded-lg shadow-[0_12px_32px_rgba(37,99,235,0.25)] z-50 min-w-[120px] py-2 max-h-[300px] overflow-y-auto">
          {options && options.length > 0 ? (
            options.map(priority => (
              <label key={priority} className="flex items-center justify-between px-4 py-2 text-[15px] cursor-pointer transition-colors duration-200 hover:bg-slate-100 group">
                <div className="flex items-center flex-1">
                  <input
                    type="checkbox"
                    checked={value === priority}
                    onChange={() => onChange(priority)}
                    className="mr-2 accent-[#2563eb]"
                  />
                  <span className={value === priority ? 'font-semibold text-slate-700' : 'text-slate-600'}>{priority}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 ${getPriorityColor(priority)}`}>
                  <Flag size={10} />
                  {priority}
                </span>
              </label>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-slate-500 text-center">
              No priorities available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PriorityDropdown;
