import React from 'react';
import Icons from '../Icons';

export const Header: React.FC<{ title: string; onBack?: () => void; onLogout?: () => void; children?: React.ReactNode }> = ({ title, onBack, onLogout, children }) => (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center min-w-0">
            {onBack && (
                <button onClick={onBack} className="mr-3 p-2 -ml-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0" aria-label="Volver">
                    <Icons name="chevronLeft" className="w-6 h-6" />
                </button>
            )}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
            {children}
            {onLogout && (
                <button onClick={onLogout} className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Cerrar sesión">
                    <Icons name="logout" className="w-6 h-6" />
                </button>
            )}
        </div>
    </header>
);
