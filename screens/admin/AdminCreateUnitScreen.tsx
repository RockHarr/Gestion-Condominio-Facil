import React, { useState } from 'react';
import type { User } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const AdminCreateUnitScreen: React.FC<{ onAddUser: (user: Omit<User, 'id' | 'role'>) => void }> = ({ onAddUser }) => {
    const [unidad, setUnidad] = useState('');
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [hasParking, setHasParking] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (unidad.trim() && nombre.trim()) {
            onAddUser({ unidad, nombre, hasParking, email });
        }
    };

    return (
        <div className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="unidad" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unidad (Ej: A-101, B-302)</label>
                            <input type="text" id="unidad" value={unidad} onChange={e => setUnidad(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo del Residente</label>
                            <input type="text" id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required className="mt-1 block w_full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                         <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">¿Tiene estacionamiento?</span>
                            <label htmlFor="hasParkingToggle" className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="hasParkingToggle" className="sr-only peer" checked={hasParking} onChange={() => setHasParking(!hasParking)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </Card>
                <Button type="submit">Guardar Unidad</Button>
            </form>
        </div>
    );
};
