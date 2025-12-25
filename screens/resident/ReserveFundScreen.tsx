import React from 'react';
import type { ReserveFund } from '../../types';
import { Card } from '../../components/common/Card';

// Helper function from App.tsx
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

export const ReserveFundScreen: React.FC<{ fund: ReserveFund }> = ({ fund }) => {
    const percentage = (fund.montoActual / fund.meta) * 100;
    return (
        <div className="p-4">
            <Card>
                <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Fondo de Reserva</h2>
                <div className="my-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monto Actual</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{formatCurrency(fund.montoActual)}</p>
                </div>
                <div>
                    <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progreso</span>
                        <span>Meta: {formatCurrency(fund.meta)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <p className="text-center text-sm font-semibold mt-2 text-gray-700 dark:text-gray-300">{percentage.toFixed(1)}% completado</p>
                </div>
            </Card>
        </div>
    )
}
