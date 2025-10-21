function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-2 my-8 mb-6 flex-wrap">
      <button
        className="min-w-[40px] h-10 flex items-center justify-center border-2 border-gray-200 bg-white text-[#2563eb] rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 px-2 hover:border-[#2563eb] hover:bg-[#2563eb]/10 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-slate-400 disabled:hover:transform-none disabled:hover:border-gray-200 disabled:hover:bg-gray-50"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &lt;
      </button>

      {getPageNumbers().map((page, idx) => (
        <button
          key={idx}
          className={`min-w-[40px] h-10 flex items-center justify-center border-2 rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 px-2 ${
          page === currentPage
            ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-[0_4px_8px_rgba(37,99,235,0.18)]'
              : page === '...' 
              ? 'border-gray-200 bg-white text-slate-500 cursor-default' 
              : 'border-gray-200 bg-white text-[#2563eb] hover:border-[#2563eb] hover:bg-[#2563eb]/10 hover:-translate-y-px'
          }`}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
        >
          {page}
        </button>
      ))}

      <button
        className="min-w-[40px] h-10 flex items-center justify-center border-2 border-gray-200 bg-white text-[#2563eb] rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 px-2 hover:border-[#2563eb] hover:bg-[#2563eb]/10 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-slate-400 disabled:hover:transform-none disabled:hover:border-gray-200 disabled:hover:bg-gray-50"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        &gt;
      </button>
    </div>
  );
}

export default Pagination;