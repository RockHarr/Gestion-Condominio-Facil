import React from 'react';

export const Button: React.FC<{ onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, children: React.ReactNode, variant?: 'primary' | 'secondary' | 'danger', className?: string, type?: 'button' | 'submit', disabled?: boolean, 'data-testid'?: string, 'aria-label'?: string }> = ({ onClick, children, variant = 'primary', className = '', type = 'button', disabled = false, ...rest }) => {
    const baseClasses = 'w-full text-center px-4 py-3 rounded-lg font-semibold text-base focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-transform transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    };
    return <button type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`} disabled={disabled} {...rest}>{children}</button>;
};
