import React from 'react';
import type { Page } from '../../types';
import { Card } from '../../components/common/Card';
import Icons from '../../components/Icons';

export const MoreScreen: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const menuItems = [
        { page: 'reservations', icon: 'user', label: 'Reservas' },
        { page: 'financial-statements', icon: 'document-text', label: 'Rendición de Cuentas' },
        { page: 'reserve-fund', icon: 'chart-pie', label: 'Fondo de Reserva' },
        { page: 'profile', icon: 'user', label: 'Mi Perfil' },
    ];

    return (
        <div className="p-4">
            <Card>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {menuItems.map(item => (
                        <li key={item.page}>
                            <button onClick={() => onNavigate(item.page as Page)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center">
                                    <Icons name={item.icon} className="w-6 h-6 mr-4 text-gray-600 dark:text-gray-400" />
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{item.label}</span>
                                </div>
                                <Icons name="chevronRight" className="w-5 h-5 text-gray-400" />
                            </button>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    )
};
