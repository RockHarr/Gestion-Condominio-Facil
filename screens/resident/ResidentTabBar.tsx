import React from 'react';
import type { Page } from '../../types';
import Icons from '../../components/Icons';

export const ResidentTabBar: React.FC<{ currentPage: Page, onNavigate: (page: Page) => void, unreadNotices: number }> = ({ currentPage, onNavigate, unreadNotices }) => {
    const navItems = [
        { page: 'home', icon: 'home', label: 'Inicio' },
        { page: 'payments', icon: 'wallet', label: 'Pagos' },
        { page: 'tickets', icon: 'ticket', label: 'Tickets' },
        { page: 'notices', icon: 'bell', label: 'Avisos' },
        { page: 'more', icon: 'ellipsis-horizontal-circle', label: 'Más' },
    ];
    const mainPages = ['home', 'payments', 'tickets', 'notices', 'more'];

    const getActiveTab = () => {
        if (mainPages.includes(currentPage)) return currentPage;
        if (['profile', 'reservations', 'financial-statements', 'reserve-fund', 'resident-expenses'].includes(currentPage)) return 'home'; // Default to home for sub-pages
        return null;
    }
    const activeTab = getActiveTab();

    if (!activeTab) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-20 max-w-lg mx-auto">
            <div className="flex justify-around">
                {navItems.map(item => {
                    const isActive = activeTab === item.page;
                    return (
                        <button
                              key={item.page}
                              data-testid={`tab-${item.page}`}
                              onClick={() => onNavigate(item.page as Page)}
                              className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-sm font-medium focus:outline-none transition-colors duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
                              aria-current={isActive ? 'page' : undefined}
                            >
                              <div className="relative">
                                <Icons name={item.icon} className="w-7 h-7" />
                                {item.page === 'notices' && unreadNotices > 0 && (
                                  <span
                                    data-testid="tab-notices-badge"
                                    className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full"
                                  >
                                    {unreadNotices}
                                  </span>
                                )}
                              </div>
                              <span className="mt-1">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
