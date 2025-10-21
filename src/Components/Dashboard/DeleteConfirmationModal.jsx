import { Trash2, X } from 'lucide-react';

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, taskName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-[450px] w-[90%] shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[slideIn_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="text-red-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1e293b] m-0">Delete Task?</h2>
            <p className="text-sm text-slate-500 m-0">This action cannot be undone</p>
          </div>
        </div>

        {/* Content */}
        <div className="my-5 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-sm text-slate-700 m-0">
            Are you sure you want to delete <strong className="text-red-600">"{taskName}"</strong>?
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button 
            className="px-5 py-2.5 bg-slate-100 text-slate-700 border-2 border-slate-200 rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 hover:bg-slate-200 hover:border-slate-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-5 py-2.5 bg-red-600 text-white border-none rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 shadow-[0_2px_6px_rgba(220,38,38,0.3)] hover:bg-red-700 hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(220,38,38,0.4)] flex items-center gap-2"
            onClick={onConfirm}
          >
            <Trash2 size={16} />
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;