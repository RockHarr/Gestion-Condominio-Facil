import React, { useState, useEffect } from 'react';
import type { Page, User } from '../../types';
import { Card } from '../../components/common/Card';
import Icons from '../../components/Icons';

export const AdminUnitsScreen: React.FC<{
    users: User[];
    onNavigate: (page: Page, params?: any) => void;
    onDeleteUser: (id: number) => void;
}> = ({ users, onNavigate, onDeleteUser }) => {
    const residents = users.filter(u => u.role === 'resident');
    const [menuOpen, setMenuOpen] = useState<number | null>(null);

    const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
        e.stopPropagation();
        setMenuOpen(prev => (prev === id ? null : id));
    };

    useEffect(() => {
        const closeMenu = () => setMenuOpen(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    return (
        <div className="relative min-h-full" onClick={() => setMenuOpen(null)}>
            <div className="p-4 md:p-6 space-y-4">
                {residents.map(resident => (
                    <button key={resident.id} onClick={() => onNavigate('admin-unit-detail', { id: resident.id })} className="w-full text-left">
                        <Card className="relative hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{resident.unidad}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">{resident.nombre}</p>
                                    {resident.email && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{resident.email}</p>
                                    )}
                                </div>
                                <div className="text-right flex items-start">
                                    <div className="mr-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">G. Común: <span className="font-semibold text-green-600 dark:text-green-400">Sí</span></p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Estacionam.: {
                                            resident.hasParking
                                            ? <span className="font-semibold text-green-600 dark:text-green-400">Sí</span>
                                            : <span className="font-semibold text-red-600 dark:text-red-400">No</span>
                                        }</p>
                                    </div>
                                    <button onClick={(e) => toggleMenu(e, resident.id)} className="p-1 -mr-1 -mt-1 rounded_full hover:bg-gray-200 dark:hover:bg-gray-700 z-10">
                                        <Icons name="ellipsis-vertical" className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                    </button>
                                </div>
                            </div>
                            {menuOpen === resident.id && (
                                <div className="absolute top-10 right-4 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                                    <ul className="py-1">
                                        <li>
                                            <button onClick={() => { onNavigate('admin-unit-edit', { id: resident.id }); setMenuOpen(null); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <Icons name="pencil" className="w-5 h-5 mr-3" /> Editar
                                            </button>
                                        </li>
                                        <li>
                                            <button onClick={() => { onDeleteUser(resident.id); setMenuOpen(null); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <Icons name="trash" className="w-5 h-5 mr-3" /> Eliminar
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </Card>
                    </button>
                ))}
            </div>
             <div className="fixed bottom-24 right-4 z-10 md:bottom-6 md:right-6">
                <button
                    onClick={() => onNavigate('admin-unit-create')}
                    className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    aria-label="Añadir nueva unidad"
                >
                    <Icons name="plus" className="w-8 h-8"/>
                </button>
            </div>
        </div>
    )
};
