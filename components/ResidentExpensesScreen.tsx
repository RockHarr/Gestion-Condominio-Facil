import React, { useState, useMemo } from 'react';
import { Expense, ExpenseStatus } from '../types';
import { Card } from './Shared';
import Icons from './Icons';

// Helper function (duplicated for now, should be in a utils file)
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
};

interface ResidentExpensesScreenProps {
    expenses: Expense[];
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ResidentExpensesScreen: React.FC<ResidentExpensesScreenProps> = ({ expenses, showToast }) => {
    const approvedExpenses = useMemo(() => expenses.filter(e => e.status === ExpenseStatus.APROBADO), [expenses]);
    const availableMonths = useMemo(() => {
        const months = new Set(approvedExpenses.map(e => e.fecha.slice(0, 7)));
        return Array.from(months).sort().reverse();
    }, [approvedExpenses]);

    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredExpenses = useMemo(() => {
        return approvedExpenses
            .filter(e => e.fecha.startsWith(selectedMonth))
            .filter(e =>
                e.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.numeroDocumento?.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [approvedExpenses, selectedMonth, searchTerm]);

    const totalForMonth = filteredExpenses.reduce((sum, e) => sum + e.monto, 0);

    return (
        <div className="p-4 space-y-4">
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mes</label>
                        <select id="month-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="mt-1 block w-full input-field">
                            {availableMonths.map(month => <option key={month} value={month}>{formatPeriod(month)}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buscar</label>
                        <div className="relative mt-1">
                            <input type="text" id="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Proveedor, descripción..." className="w-full input-field pl-10" />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Icons name="magnifying-glass" className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="flex justify-between items-baseline mb-4">
                    <h2 className="text-lg font-bold">Total del Periodo</h2>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalForMonth)}</p>
                </div>
                {filteredExpenses.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredExpenses.map(expense => (
                            <li key={expense.id} className="py-3">
                                <div className="flex justify-between items-center gap-4">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{expense.descripcion}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{expense.proveedor} - {new Date(expense.fecha).toLocaleDateString('es-CL')}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-bold">{formatCurrency(expense.monto)}</p>
                                        <button onClick={() => showToast('Simulando vista de boleta...', 'info')} className="text-xs font-semibold text-blue-600 dark:text-blue-400">Ver Boleta</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-600 dark:text-gray-400 py-6">No se encontraron gastos para los criterios seleccionados.</p>
                )}
            </Card>
        </div>
    );
};
