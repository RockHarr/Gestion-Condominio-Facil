import React from 'react';
import Icons from '../Icons';

export const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-md text-white shadow-lg animate-fade-in-down ${typeClasses[type]}`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 -mr-2 p-1 rounded-full hover:bg-white/20">
          <Icons name="xmark" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
