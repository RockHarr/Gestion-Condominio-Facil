import React from 'react';
import type { Page } from '../../types';
import Icons from '../../components/Icons';

export const AdminTabBar: React.FC<{ currentPage: Page, onNavigate: (page: Page) => void }> = ({ currentPage, onNavigate }) => {
    const navItems = [
        { page: 'admin-dashboard', icon: 'speedometer', label: 'Dashboard' },
        { page: 'admin-units', icon: 'building-office', label: 'Unidades' },
        { page: 'admin-tickets', icon: 'ticket', label: 'Tickets' },
        { page: 'admin-notices', icon: 'bell', label: 'Avisos' },
        { page: 'admin-config', icon: 'cog-6-tooth', label: 'Config' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-20 md:hidden">
            <div className="flex justify-around">
                {navItems.map(item => {
                    const isActive = currentPage === item.page;
                    return (
                        <button
                            key={item.page}
                            onClick={() => onNavigate(item.page as Page)}
                            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-sm font-medium focus:outline-none transition-colors duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
                        >
                            <Icons name={item.icon} className="w-7 h-7" />
                            <span className="mt-1">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
