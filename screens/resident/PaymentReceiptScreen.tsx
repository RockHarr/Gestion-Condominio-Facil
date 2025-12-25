import React from 'react';
import type { Page, User } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import Icons from '../../components/Icons';

// Helper function from App.tsx
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

export const PaymentReceiptScreen: React.FC<{ onNavigate: (page: Page) => void; user: User; params: { totalAmount: number; itemsToPay: any[] }; showToast: (message: string, type?: 'success' | 'error' | 'info') => void; }> = ({ onNavigate, user, params, showToast }) => {

    return (
        <div className="p-4 space-y-6">
            <Card className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                    <Icons name="check" className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">¡Pago Exitoso!</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Tu pago ha sido procesado correctamente.</p>

                <div className="mt-6 text-left bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Resumen de la Transacción</h3>
                     <div className="flex justify-between py-1 font-bold">
                        <span>Total Pagado:</span>
                        <span>{formatCurrency(params.totalAmount)}</span>
                    </div>
                    <div className="text-sm space-y-1 mt-2">
                        {params.itemsToPay.map((item, index) => (
                             <div key={index} className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">{item.description}</span>
                                <span>{formatCurrency(item.amount)}</span>
                            </div>
                        ))}
                    </div>
                     <div className="flex justify-between py-1 mt-2 border-t pt-2 border-gray-200 dark:border-gray-600">
                        <span>Fecha de Pago:</span>
                        <span>{new Date().toLocaleDateString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span>ID Transacción:</span>
                        <span>{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                    </div>
                     <div className="flex justify-between py-1">
                        <span>Pagado por:</span>
                        <span>{user.nombre} ({user.unidad})</span>
                    </div>
                </div>
            </Card>
            <div className="space-y-3">
                <Button onClick={() => showToast('Simulando descarga de comprobante PDF...', 'info')}>
                    <div className="flex items-center justify-center">
                        <Icons name="download" className="w-5 h-5 mr-2"/> Descargar Comprobante
                    </div>
                </Button>
                <Button onClick={() => showToast('Simulando compartir...', 'info')} variant="secondary">
                     <div className="flex items-center justify-center">
                        <Icons name="share" className="w-5 h-5 mr-2"/> Compartir
                    </div>
                </Button>
                 <Button onClick={() => onNavigate('home')} variant="secondary">
                    Volver al Inicio
                </Button>
            </div>
        </div>
    );
}
