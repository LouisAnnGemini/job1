import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-48 flex items-center justify-between border border-slate-300 rounded-lg py-2 pl-3 pr-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-shadow"
      >
        <span className="truncate mr-2 text-slate-700">
          {selected.length === 0 ? `所有${placeholder}` : `${placeholder} (${selected.length})`}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full sm:w-64 bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 flex flex-col">
          {selected.length > 0 && (
            <div className="p-2 border-b border-slate-100">
              <button
                onClick={clearAll}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors w-full text-left"
              >
                清除已选 ({selected.length})
              </button>
            </div>
          )}
          <div className="overflow-y-auto p-1 flex-1">
            {options.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-500 text-center">暂无选项</div>
            ) : (
              options.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <div
                    key={option}
                    onClick={() => toggleOption(option)}
                    className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded border mr-3 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm truncate ${isSelected ? 'text-indigo-700 font-medium' : 'text-slate-700'}`} title={option}>
                      {option}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
