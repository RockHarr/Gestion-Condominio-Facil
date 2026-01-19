import React from 'react';
import Icons from './Icons';

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: (e: React.MouseEvent<HTMLDivElement>) => void }> = ({ children, className, onClick }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 ${className}`} onClick={onClick}>
        {children}
    </div>
);

export const Button: React.FC<{ onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, children: React.ReactNode, variant?: 'primary' | 'secondary' | 'danger' | 'ghost', className?: string, type?: 'button' | 'submit' | 'reset', disabled?: boolean, isLoading?: boolean, 'data-testid'?: string, 'aria-label'?: string }> = ({ onClick, children, variant = 'primary', className = '', type = 'button', disabled = false, isLoading = false, ...rest }) => {
    const baseClasses = 'w-full text-center px-4 py-3 rounded-lg font-semibold text-base focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-transform transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500'
    };
    return (
        <button
            type={type as "button" | "submit" | "reset"}
            onClick={onClick}
            className={`${baseClasses} ${variantClasses[variant as keyof typeof variantClasses]} ${className}`}
            disabled={disabled || isLoading}
            {...rest}
        >
            {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                    <Icons name="spinner" className="w-5 h-5 animate-spin" />
                    <span>{children}</span>
                </div>
            ) : (
                children
            )}
        </button>
    );
};

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

export const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`animate-pulse bg-gray-300 dark:bg-gray-700 rounded-md ${className}`} />
);

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
                <button onClick={onClose} className="ml-4 -mr-2 p-1 rounded-full hover:bg-white/20" aria-label="Cerrar notificación">
                    <Icons name="xmark" className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
