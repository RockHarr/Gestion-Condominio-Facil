import React from 'react';
import type { Page, CommonExpenseDebt, ParkingDebt } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

// Helper function from App.tsx
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
};

export const PaymentsScreen: React.FC<{ commonExpenseDebts: CommonExpenseDebt[], parkingDebts: ParkingDebt[], onNavigate: (page: Page, params?: any) => void }> = ({ commonExpenseDebts, parkingDebts, onNavigate }) => {
    const unpaidCommonExpenses = commonExpenseDebts.filter(d => !d.pagado);
    const unpaidParking = parkingDebts.filter(d => !d.pagado);

    const itemsToPay = [
        ...unpaidCommonExpenses.map(d => ({ description: `Gasto Común (${formatPeriod(d.mes)})`, amount: d.monto })),
        ...unpaidParking.map(d => ({ description: `Estacionamiento (${formatPeriod(d.mes)})`, amount: d.monto }))
    ];

    const totalAmount = itemsToPay.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="p-4 space-y-6">
            <Card>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Detalle de tu Deuda</h2>
                <div className="mt-4 space-y-3">
                    {itemsToPay.length > 0 ? itemsToPay.map((item, index) => (
                         <div key={index} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{item.description}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.amount)}</span>
                        </div>
                    )) : (
                        <p className="text-center text-gray-600 dark:text-gray-400">No tienes deudas pendientes.</p>
                    )}

                    {itemsToPay.length > 0 && (
                        <>
                            <hr className="my-2 border-gray-200 dark:border-gray-700"/>
                            <div className="flex justify-between items-baseline">
                                <span className="text-xl font-bold text-gray-800 dark:text-white">Total a Pagar</span>
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalAmount)}</span>
                            </div>
                        </>
                    )}
                </div>
            </Card>
            <Button onClick={() => onNavigate('payment-method', { totalAmount, itemsToPay })} disabled={totalAmount === 0}>
                Proceder al Pago
            </Button>
        </div>
    );
};
