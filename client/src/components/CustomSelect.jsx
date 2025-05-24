import React, { useState, useRef, useEffect } from 'react';

function CustomSelect({ value, onChange, options, disabled, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white text-left
          focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent 
          transition-all duration-200 cursor-pointer backdrop-filter backdrop-blur-md
          hover:bg-white/30 hover:border-white/40
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isOpen ? 'bg-white/30 shadow-xl' : ''}
        `}
      >
        <div className="flex justify-between items-center">
          <span>{selectedOption?.label || 'Select duration'}</span>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

            {isOpen && (        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/30 rounded-lg shadow-xl overflow-hidden">          {options.map((option) => (            <button              key={option.value}              type="button"              onClick={() => handleSelect(option.value)}              className={`                w-full px-4 py-3 text-left text-white hover:bg-primary-600 transition-all duration-150                ${value === option.value ? 'bg-primary-700' : 'hover:bg-primary-600'}                first:rounded-t-lg last:rounded-b-lg              `}            >              {option.label}            </button>          ))}        </div>      )}
    </div>
  );
}

export default CustomSelect; 