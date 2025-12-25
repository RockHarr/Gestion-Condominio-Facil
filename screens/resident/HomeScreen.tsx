import React from 'react';
import type { Page, User, CommonExpenseDebt, ParkingDebt, Expense } from '../../types';
import { ExpenseStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import Icons from '../../components/Icons';

// Helper function from App.tsx
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
};

export const HomeScreen: React.FC<{ user: User; commonExpenseDebts: CommonExpenseDebt[]; parkingDebts: ParkingDebt[]; expenses: Expense[]; onNavigate: (page: Page) => void; showToast: (message: string, type?: 'success' | 'error' | 'info') => void; }> = ({ user, commonExpenseDebts, parkingDebts, expenses, onNavigate, showToast }) => {

    const unpaidCommonExpenses = commonExpenseDebts.filter(d => !d.pagado);
    const unpaidParking = parkingDebts.filter(d => !d.pagado);
    const totalDebt = unpaidCommonExpenses.reduce((sum, d) => sum + d.monto, 0) + unpaidParking.reduce((sum, d) => sum + d.monto, 0);

    const currentMonthPeriod = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const currentMonthCommonExpense = commonExpenseDebts.find(d => d.mes === currentMonthPeriod);
    const approvedExpensesThisMonth = expenses.filter(e => e.status === ExpenseStatus.APROBADO && e.fecha.startsWith(currentMonthPeriod));
    const totalApprovedAmount = approvedExpensesThisMonth.reduce((sum, e) => sum + e.monto, 0);

    return (
        <div className="space-y-6">
            <div className="px-4 pt-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Hola, {user.nombre.split(' ')[0]}</h1>
                <p className="text-gray-600 dark:text-gray-400">Unidad {user.unidad}</p>
            </div>

            <div className="px-4 space-y-6">
                {totalDebt > 0 ? (
                    <Card>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Deuda Pendiente</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalDebt)}</p>
                                <p className="text-sm text-red-600 dark:text-red-400">{unpaidCommonExpenses.length + unpaidParking.length} ítem(s) por pagar</p>
                            </div>
                            <button
                              onClick={() => onNavigate('payments')}
                              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-transform transform active:scale-95"
                              aria-label="Marcar pago"
                            >
                              Pagar Ahora
                            </button>
                        </div>
                    </Card>
                ) : (
                    <Card className="border-l-4 border-green-500 text-center">
                        <Icons name="check-badge" className="w-10 h-10 mx-auto text-green-500" />
                        <p className="text-lg font-semibold text-gray-800 dark:text-white mt-2">¡Estás al día con tus pagos!</p>
                    </Card>
                 )}

                <Card>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Gastos de la Comunidad ({formatPeriod(currentMonthPeriod)})</h2>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Gastos Aprobados</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalApprovedAmount)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Tu parte se calcula según los m² de tu unidad.</p>
                        {currentMonthCommonExpense && (
                             <p className="font-bold text-blue-600 dark:text-blue-400 mt-2">Tu Gasto Común del mes: {formatCurrency(currentMonthCommonExpense.monto)}</p>
                        )}
                    </div>
                     {approvedExpensesThisMonth.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {approvedExpensesThisMonth.slice(0, 3).map(expense => (
                                <li key={expense.id} className="py-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-700 dark:text-gray-300">{expense.descripcion}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{expense.proveedor}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(expense.monto)}</p>
                                            <button onClick={() => showToast('Simulando vista de boleta...', 'info')} className="text-xs font-semibold text-blue-600 dark:text-blue-400">Ver Boleta</button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                     ) : (
                        <p className="text-center text-gray-600 dark:text-gray-400">Aún no hay gastos aprobados para este mes.</p>
                     )}
                     <Button onClick={() => onNavigate('resident-expenses')} variant="secondary" className="!w-full !mt-4 !py-2 !text-sm">
                        Ver todos los gastos del mes
                    </Button>
                </Card>
            </div>
        </div>
    );
};
