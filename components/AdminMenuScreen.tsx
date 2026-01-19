import React from 'react';
import { Page } from '../types';
import Icons from './Icons';
import { Card } from './Shared';

interface AdminMenuScreenProps {
    onNavigate: (page: Page) => void;
}

export const AdminMenuScreen: React.FC<AdminMenuScreenProps> = ({ onNavigate }) => {
    const menuItems = [
        {
            page: 'admin-units',
            icon: 'building-office',
            label: 'Unidades y Residentes',
            description: 'Directorio y gestión de usuarios',
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
            page: 'admin-notices',
            icon: 'bell',
            label: 'Mural de Avisos',
            description: 'Publicar noticias comunidad',
            color: 'text-yellow-600 dark:text-yellow-400',
            bg: 'bg-yellow-50 dark:bg-yellow-900/20'
        },
        {
            page: 'admin-amenities',
            icon: 'home',
            label: 'Espacios Comunes',
            description: 'Configurar quinchos, salas, etc.',
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-900/20'
        },
        {
            page: 'admin-config',
            icon: 'cog-6-tooth',
            label: 'Configuración General',
            description: 'Valores, multas y sistema',
            color: 'text-gray-600 dark:text-gray-400',
            bg: 'bg-gray-100 dark:bg-gray-800'
        },
        {
            page: 'profile',
            icon: 'user',
            label: 'Mi Perfil Admin',
            description: 'Cuenta y seguridad',
            color: 'text-gray-600 dark:text-gray-400',
            bg: 'bg-gray-100 dark:bg-gray-800'
        }
    ];

    return (
        <div className="p-4 space-y-6 animate-page pb-24">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Menú de Administración</h2>

            <div className="grid gap-3">
                {menuItems.map((item) => (
                    <button
                        key={item.page}
                        onClick={() => onNavigate(item.page as Page)}
                        className="text-left w-full group focus:outline-none"
                    >
                        <Card className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center ${item.color} mr-4`}>
                                <Icons name={item.icon} className="w-5 h-5" />
                            </div>

                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">{item.label}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                            </div>

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
