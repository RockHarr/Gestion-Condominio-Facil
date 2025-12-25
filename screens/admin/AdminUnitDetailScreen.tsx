import React from 'react';
import type { User, PaymentRecord, CommonExpenseDebt, ParkingDebt } from '../../types';
import { Card } from '../../components/common/Card';
import Icons from '../../components/Icons';

// Helper function from App.tsx
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
};

export const AdminUnitDetailScreen: React.FC<{
    user: User;
    paymentHistory: PaymentRecord[];
    commonExpenseDebts: CommonExpenseDebt[];
    parkingDebts: ParkingDebt[];
}> = ({ user, paymentHistory, commonExpenseDebts, parkingDebts }) => {

    const unpaidCommonExpenses = commonExpenseDebts.filter(d => d.userId === user.id && !d.pagado);
    const unpaidParking = parkingDebts.filter(d => d.userId === user.id && !d.pagado);
    const pendingDebts = [...unpaidCommonExpenses, ...unpaidParking];
    const totalArrears = pendingDebts.reduce((sum, debt) => sum + debt.monto, 0);

    return (
        <div className="p-4 md:p-6 space-y-4">
            <Card>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.unidad}</h2>
                        <p className="text-gray-600 dark:text-gray-400">{user.nombre}</p>
                        {user.email && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
                        )}
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        pendingDebts.length > 0
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                        {pendingDebts.length > 0 ? 'Pendiente' : 'Al día'}
                    </span>
                </div>
            </Card>

            {pendingDebts.length > 0 && (
                <Card>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Deudas Pendientes</h3>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {unpaidCommonExpenses.map(debt => (
                             <li key={`gc-${debt.id}`} className="py-2 flex justify-between">
                                 <span>Gasto Común - {formatPeriod(debt.mes)}</span>
                                 <span className="font-semibold">{formatCurrency(debt.monto)}</span>
                             </li>
                        ))}
                        {unpaidParking.map(debt => (
                             <li key={`pk-${debt.id}`} className="py-2 flex justify-between">
                                 <span>Estacionamiento - {formatPeriod(debt.mes)}</span>
                                 <span className="font-semibold">{formatCurrency(debt.monto)}</span>
                             </li>
                        ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between font-bold text-lg">
                        <span>Total Mora</span>
                        <span className="text-red-600 dark:text-red-400">{formatCurrency(totalArrears)}</span>
                    </div>
                </Card>
            )}

            <Card>
                <div className="flex items-center mb-4">
                     <Icons name="receipt-long" className="w-6 h-6 mr-3 text-gray-600 dark:text-gray-400" />
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white">Historial de Pagos</h3>
                </div>
                {paymentHistory.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paymentHistory.map(payment => (
                            <li key={payment.id} className="py-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{payment.type} - {formatPeriod(payment.periodo)}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Pagado el: {new Date(payment.fechaPago).toLocaleDateString('es-CL')}</p>
                                    </div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(payment.monto)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-600 dark:text-gray-400">No hay registros de pagos para esta unidad.</p>
                )}
            </Card>
        </div>
    );
};
