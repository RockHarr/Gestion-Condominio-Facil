import React from 'react';

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: (e: React.MouseEvent<HTMLDivElement>) => void }> = ({ children, className, onClick }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 ${className}`} onClick={onClick}>
        {children}
    </div>
);
