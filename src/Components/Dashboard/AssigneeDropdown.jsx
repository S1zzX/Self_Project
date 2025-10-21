import { useState, useEffect, useRef } from 'react';

function AssigneeDropdown({ value, onChange, options, getMemberNameById, hasError }) {
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

  return (
    <div className="relative min-w-[120px]" ref={ref}>
      <div
        className={`bg-white border-2 rounded-lg p-3 text-base select-none transition-all duration-200 cursor-pointer ${
          hasError ? 'border-red-600' : 'border-gray-200 hover:border-[#2563eb]'
        }`}
        onClick={() => setOpen(o => !o)}
      >
        {value.length
          ? value.map(id => getMemberNameById(id)).join(', ')
          : 'Assign to...'}
        <span className="float-right font-bold">▼</span>
      </div>
      {open && (
        <div className="absolute top-[110%] left-0 bg-white border-2 border-[#2563eb] rounded-lg shadow-[0_12px_32px_rgba(37,99,235,0.25)] z-50 min-w-[120px] py-2 max-h-[300px] overflow-y-auto">
          {options && options.length > 0 ? (
            options.map(member => (
              <label key={member.id} className="flex items-center justify-between px-4 py-2 text-[15px] cursor-pointer transition-colors duration-200 hover:bg-slate-100 group">
                <div className="flex items-center flex-1">
                  <input
                    type="checkbox"
                    checked={value.includes(member.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        onChange([...value, member.id]);
                      } else {
                        onChange(value.filter(id => id !== member.id));
                      }
                    }}
                    className="mr-2 accent-[#2563eb]"
                  />
                  <span className={value.includes(member.id) ? 'font-semibold text-slate-700' : 'text-slate-600'}>{member.name}</span>
                </div>
                {member.userType && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    member.userType === 'admin' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {member.userType}
                  </span>
                )}
              </label>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-slate-500 text-center">
              No users available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AssigneeDropdown;