import React, { useState } from 'react';
import type { Page } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

// Helper function from App.tsx
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

export const PaymentMethodScreen: React.FC<{ onNavigate: (page: Page, params?: any) => void, params: { totalAmount: number, itemsToPay: any[] } }> = ({ onNavigate, params }) => {
    const [selectedMethod, setSelectedMethod] = useState('webpay');

    return (
        <div className="p-4 space-y-6">
            <Card>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Selecciona un Método de Pago</h2>
                <div className="mt-4 space-y-3">
                    {['webpay', 'transferencia', 'khipu'].map(method => (
                        <label key={method} className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedMethod === method ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600'}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value={method}
                                checked={selectedMethod === method}
                                onChange={() => setSelectedMethod(method)}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-3 text-base font-medium text-gray-900 dark:text-white capitalize">{method.replace('_', ' ')}</span>
                        </label>
                    ))}
                </div>
            </Card>
            <div className="sticky bottom-4 px-4 pb-20 sm:pb-4">
                 <Button onClick={() => onNavigate('payment-confirm', params)}>
                    Pagar {formatCurrency(params.totalAmount)}
                </Button>
            </div>
        </div>
    );
};
