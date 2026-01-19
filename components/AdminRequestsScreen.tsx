import React from 'react';
import { Page } from '../types';
import Icons from './Icons';
import { Card } from './Shared';

interface AdminRequestsScreenProps {
    onNavigate: (page: Page) => void;
    pendingTicketsCount: number;
    pendingReservationsCount: number;
}

export const AdminRequestsScreen: React.FC<AdminRequestsScreenProps> = ({ onNavigate, pendingTicketsCount, pendingReservationsCount }) => {
    return (
        <div className="p-4 space-y-6 animate-page pb-24">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Solicitudes Pendientes</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Gestinona las peticiones de la comunidad</p>

            <div className="grid gap-4">
                {/* Reservations Card */}
                <button
                    onClick={() => onNavigate('admin-reservations')}
                    className="text-left w-full group focus:outline-none"
                >
                    <Card className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-visible">
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-4 group-hover:scale-105 transition-transform shadow-inner">
                            <Icons name="calendar-days" className="w-7 h-7" />
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Reservas Espacios</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Solicitudes de quinchos y salas</p>
                        </div>

                        {pendingReservationsCount > 0 && (
                            <div className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-red-500 text-white text-sm font-bold rounded-full shadow-lg border-2 border-white dark:border-gray-900 animate-bounce">
                                {pendingReservationsCount}
                            </div>
                        )}

                        {pendingReservationsCount === 0 && (
                            <div className="text-gray-300 dark:text-gray-600">
                                <Icons name="chevronRight" className="w-6 h-6" />
                            </div>
                        )}
                    </Card>
                </button>

                {/* Tickets Card */}
                <button
                    onClick={() => onNavigate('admin-tickets')}
                    className="text-left w-full group focus:outline-none"
                >
                    <Card className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-visible">
                        <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 mr-4 group-hover:scale-105 transition-transform shadow-inner">
                            <Icons name="ticket" className="w-7 h-7" />
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Tickets de Soporte</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Reportes de incidentes</p>
                        </div>

                        {pendingTicketsCount > 0 && (
                            <div className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-red-500 text-white text-sm font-bold rounded-full shadow-lg border-2 border-white dark:border-gray-900 animate-bounce">
                                {pendingTicketsCount}
                            </div>
                        )}

                        {pendingTicketsCount === 0 && (
                            <div className="text-gray-300 dark:text-gray-600">
                                <Icons name="chevronRight" className="w-6 h-6" />
                            </div>
                        )}
                    </Card>
                </button>
            </div>
        </div>
    );
};
