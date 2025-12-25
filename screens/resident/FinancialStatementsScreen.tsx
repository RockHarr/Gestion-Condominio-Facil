import React from 'react';
import type { FinancialStatement } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import Icons from '../../components/Icons';

// Helper function from App.tsx
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
