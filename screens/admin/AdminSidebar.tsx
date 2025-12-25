import React from 'react';
import type { Page } from '../../types';
import { Button } from '../../components/common/Button';
import Icons from '../../components/Icons';

export const AdminSidebar: React.FC<{ currentPage: Page, onNavigate: (page: Page) => void, onLogout: () => void }> = ({ currentPage, onNavigate, onLogout }) => {
    const navItems = [
        { page: 'admin-dashboard', icon: 'speedometer', label: 'Dashboard' },
        { page: 'admin-units', icon: 'building-office', label: 'Unidades' },
        { page: 'admin-tickets', icon: 'ticket', label: 'Tickets' },
        { page: 'admin-notices', icon: 'bell', label: 'Avisos' },
        { page: 'admin-config', icon: 'cog-6-tooth', label: 'Configuración' },
    ];

    return (
        <aside className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Admin</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map(item => {
                    const isActive = currentPage === item.page;
                    return (
                        <button
                            key={item.page}
                            onClick={() => onNavigate(item.page as Page)}
                            className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            <Icons name={item.icon} className="w-5 h-5 mr-3" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    )
                })}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={onLogout} variant="secondary">Cerrar Sesión</Button>
            </div>
        </aside>
    );
};
