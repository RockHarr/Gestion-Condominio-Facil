import React from 'react';
import { Page } from '../types';
import Icons from './Icons';
import { Card } from './Shared';

interface MoreScreenProps {
    onNavigate: (page: Page) => void;
    unreadNotices: number;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ onNavigate, unreadNotices }) => {
    const menuItems = [
        {
            page: 'notices',
            icon: 'bell',
            label: 'Mural de Avisos',
            description: 'Noticias y anuncios de la comunidad',
            badge: unreadNotices
        },
        {
            page: 'tickets',
            icon: 'ticket',
            label: 'Mis Tickets',
            description: 'Reportar problemas y ver estado',
            badge: 0
        },
        {
            page: 'polls',
            icon: 'chartBar',
            label: 'Votaciones',
            description: 'Participar en decisiones',
            badge: 0
        },
        {
            page: 'profile',
            icon: 'user',
            label: 'Mi Perfil',
            description: 'Datos personales y configuración',
            badge: 0
        }
    ];

    return (
        <div className="p-4 space-y-6 animate-page pb-24">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Más Opciones</h2>

            <div className="grid gap-4">
                {menuItems.map((item) => (
                    <button
                        key={item.page}
                        onClick={() => onNavigate(item.page as Page)}
                        className="text-left w-full group focus:outline-none"
                    >
                        <Card className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4 group-hover:scale-110 transition-transform">
                                <Icons name={item.icon} className="w-6 h-6" />
                            </div>

                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{item.label}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                            </div>

                            {item.badge > 0 && (
                                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
                                    {item.badge}
                                </div>
                            )}

                            <div className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400">
                                <Icons name="chevronRight" className="w-5 h-5" />
                            </div>
                        </Card>
                    </button>
                ))}
            </div>
        </div>
    );
};
