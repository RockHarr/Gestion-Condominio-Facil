import React, { useState } from 'react';
import type { Page } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import Icons from '../../components/Icons';

// Helper function from App.tsx
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

export const PaymentConfirmScreen: React.FC<{ onConfirm: () => void, onNavigate: (page: Page, params?: any) => void, params: { totalAmount: number, itemsToPay: any[] } }> = ({ onConfirm, onNavigate, params }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = () => {
        setIsLoading(true);
        setTimeout(() => {
            onConfirm();
            setIsLoading(false);
        }, 2000);
    };

    return (
        <div className="p-4 space-y-6 flex flex-col items-center text-center">
            <Card className="w-full">
                <Icons name="wallet" className="w-16 h-16 mx-auto text-blue-500" />
                <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">Confirmar Pago</h2>
                 <div className="my-4 text-left text-sm space-y-1">
                    {params.itemsToPay.map((item, index) => (
                         <div key={index} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{item.description}</span>
                            <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(item.amount)}</span>
                        </div>
                    ))}
                </div>
                <hr className="my-2 border-gray-200 dark:border-gray-700"/>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Total a Pagar</p>
                <p className="my-2 text-4xl font-bold text-gray-900 dark:text-white">{formatCurrency(params.totalAmount)}</p>
                <p className="text-sm text-gray-500">Se usará el método de pago seleccionado.</p>
            </Card>
            <Button onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? 'Procesando...' : 'Confirmar y Pagar'}
            </Button>
            <Button onClick={() => onNavigate('payment-method', params)} variant="secondary" disabled={isLoading}>
                Cambiar Método
            </Button>
        </div>
    );
};
