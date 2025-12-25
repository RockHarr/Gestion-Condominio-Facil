import React from 'react';
import { Page } from '../types';
import { Card } from './Shared';
import Icons from './Icons';

export const MoreScreen: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const menuItems = [
        { page: 'profile', icon: 'user', label: 'Mi Perfil' },
        { page: 'reservations', icon: 'calendar', label: 'Reservar Espacios' },
        { page: 'financial-statements', icon: 'document-text', label: 'Cartola Financiera' },
        { page: 'reserve-fund', icon: 'banknotes', label: 'Fondo de Reserva' },
    ];

    return (
        <div className="p-4 grid grid-cols-2 gap-4">
            {menuItems.map(item => (
                <button key={item.page} onClick={() => onNavigate(item.page as Page)} className="text-left">
                    <Card className="h-full flex flex-col items-center justify-center p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <Icons name={item.icon} className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-3" />
                        <span className="font-semibold text-gray-900 dark:text-white text-center">{item.label}</span>
                    </Card>
                </button>
            ))}
        </div>
    );
};
