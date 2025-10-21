import React from 'react';
import { Grid, List } from 'lucide-react';

export default function LayoutToggle({ layout, onLayoutChange }) {
  return (
    <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-lg p-1 shadow-sm">
      <button
        onClick={() => onLayoutChange('grid')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
          layout === 'grid'
            ? 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-md'
            : 'bg-transparent text-slate-600 hover:bg-slate-100'
        }`}
        title="Grid View"
      >
        <Grid size={18} />
        Grid
      </button>
      <button
        onClick={() => onLayoutChange('row')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
          layout === 'row'
            ? 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-md'
            : 'bg-transparent text-slate-600 hover:bg-slate-100'
        }`}
        title="Row View"
      >
        <List size={18} />
        Row
      </button>
    </div>
  );
}
