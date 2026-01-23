import * as React from 'react';
import { Page } from '../types';
import Icons from './Icons';
import { Button } from './Shared';

interface AdminTabBarProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    pendingRequestsCount?: number;
}

export const AdminTabBar: React.FC<AdminTabBarProps> = ({ currentPage, onNavigate, pendingRequestsCount = 0 }) => {
    // 4 Main Items for Admin
    const navItems = [
        { page: 'admin-dashboard', icon: 'speedometer', label: 'Inicio' },
        { page: 'admin-payment-entry', icon: 'currency-dollar', label: 'Pagos' },
        {
            page: 'admin-requests',
            icon: 'inbox-stack',
            label: 'Solicitudes',
            badge: pendingRequestsCount
        },
        { page: 'admin-menu', icon: 'bars-3', label: 'Menú' },
    ];

    const getActiveTab = () => {
        // Direct match
        if (['admin-dashboard', 'admin-payment-entry', 'admin-requests', 'admin-menu'].includes(currentPage)) return currentPage;

        // Requests sub-pages
        if (['admin-tickets', 'admin-reservations', 'admin-ticket-detail'].includes(currentPage)) return 'admin-requests';

        // Menu sub-pages
        if (['admin-units', 'admin-notices', 'admin-amenities', 'admin-config', 'profile', 'admin-unit-create', 'admin-unit-edit', 'admin-unit-detail', 'admin-notice-create', 'admin-notice-detail', 'admin-reservation-types'].includes(currentPage)) return 'admin-menu';

        return 'admin-dashboard';
    };

    const activeTab = getActiveTab();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:hidden pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map(item => {
                    const isActive = activeTab === item.page;
                    return (
                        <button
                            key={item.page}
                            onClick={() => onNavigate(item.page as Page)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${isActive
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            <div className="relative">
                                <Icons name={item.icon} className={`w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} />
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border border-white dark:border-gray-900">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

interface AdminSidebarProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    onLogout: () => void;
    pendingTicketsCount?: number;
    pendingReservationsCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentPage, onNavigate, onLogout, pendingTicketsCount = 0, pendingReservationsCount = 0 }) => {
    const navItems = [
        { page: 'admin-dashboard', icon: 'speedometer', label: 'Dashboard' },
        { page: 'admin-units', icon: 'building-office', label: 'Directorio de Unidades' },
        { page: 'admin-payment-entry', icon: 'currency-dollar', label: 'Registrar Pago' },
        { page: 'admin-amenities', icon: 'home', label: 'Espacios Comunes' },
        { page: 'admin-reservations', icon: 'calendar-days', label: 'Gestión de Reservas', badge: pendingReservationsCount },
        { page: 'admin-tickets', icon: 'ticket', label: 'Gestión de Tickets', badge: pendingTicketsCount },
        { page: 'admin-notices', icon: 'bell', label: 'Mural de Avisos' },
        { page: 'admin-config', icon: 'cog-6-tooth', label: 'Configuración' },
        { page: 'profile', icon: 'user', label: 'Mi Perfil' },
    ];

    return (
        <aside className="hidden md:flex md:flex-col md:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl z-30">
            <div className="flex items-center h-20 px-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-950">
                <div className="flex items-center gap-3 text-white">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Icons name="building-office" className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-none tracking-tight">Admin Panel</h1>
                        <p className="text-xs text-blue-100/80 font-medium mt-1">Gestión Condominio</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Menu Principal</p>
                {navItems.map(item => {
                    const isActive = currentPage === item.page || (currentPage as string).startsWith(item.page);
                    return (
                        <button
                            key={item.page}
                            onClick={() => onNavigate(item.page as Page)}
                            className={`w-full flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                        >
                            <Icons
                                name={item.icon}
                                className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                    }`}
                            />
                            {item.label}
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    {item.badge}
                                </span>
                            )}
                            {isActive && !item.badge && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                            )}
                        </button>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3 px-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold">
                        AD
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Administrador</p>
                    </div>
                </div>
                <Button onClick={onLogout} variant="secondary" className="w-full justify-center text-sm">
                    <Icons name="arrow-left-on-rectangle" className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                </Button>
            </div>
        </aside>
    );
};
