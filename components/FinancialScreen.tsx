import React from 'react';
import { FinancialStatement, ReserveFund } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';

// Helper
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

export const FinancialStatementsScreen: React.FC<{ statements: FinancialStatement[], showToast: (message: string, type?: 'success' | 'error' | 'info') => void; }> = ({ statements, showToast }) => {
    return (
        <div className="p-4 space-y-4">
            {statements.map(statement => (
                <Card key={statement.id}>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{statement.mes}</h3>
                    <div className="mt-2 text-sm space-y-1">
                        <div className="flex justify-between"><span className="text-green-600 dark:text-green-400">Ingresos:</span><span>{formatCurrency(statement.ingresos)}</span></div>
                        <div className="flex justify-between"><span className="text-red-600 dark:text-red-400">Egresos:</span><span>{formatCurrency(statement.egresos)}</span></div>
                        <div className="flex justify-between font-semibold"><span className="text-gray-800 dark:text-gray-200">Saldo:</span><span>{formatCurrency(statement.saldo)}</span></div>
                    </div>
                    <Button onClick={() => showToast('Simulando descarga de informe...', 'info')} variant="secondary" className="mt-4 !py-2 !text-sm">
                        <div className="flex items-center justify-center"><Icons name="download" className="w-4 h-4 mr-2" /> Descargar Informe</div>
                    </Button>
                </Card>
            ))}
        </div>
    );
};

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
