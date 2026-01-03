/**
 * PaymentReceiptModal Component
 * 
 * Displays a printable receipt for a specific payment record.
 * Features:
 * - Printable view with specific print styles (hides UI, shows only receipt).
 * - Responsive modal layout (top-aligned to prevent clipping).
 * - Download/Print functionality via browser print API.
 */
import * as React from 'react';
import { PaymentRecord, User } from '../types';
import Icons from './Icons';

interface PaymentReceiptModalProps {
    payment: PaymentRecord;
    user: User;
    onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({ payment, user, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 sm:p-6 overflow-y-auto print:p-0 print:block print:static">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm print:hidden" onClick={onClose} />

            {/* Modal Container - Top Aligned with Margin */}
            <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col my-10 print:my-0 print:shadow-none print:w-full print:max-w-none print:rounded-none print:h-auto print:block animate-in fade-in zoom-in-95 duration-200">

                {/* Toolbar - Sticky at top */}
                <div className="flex-none bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center rounded-t-xl print:hidden">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2">
                        <Icons name="receipt-long" className="w-5 h-5 text-blue-600" />
                        Vista Previa del Recibo
                    </h2>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors hover:bg-gray-100 rounded-lg"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2"
                        >
                            <Icons name="printer" className="w-4 h-4" />
                            Imprimir
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 print:p-0 bg-white rounded-b-xl" id="receipt-content">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wider">Comprobante de Pago</h1>
                            <p className="text-gray-500 text-sm mt-1">Gestión Condominio Fácil</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Folio</p>
                            <p className="text-xl font-mono font-bold text-gray-900">#{payment.id.toString().padStart(6, '0')}</p>
                            <p className="text-sm text-gray-500 mt-1">Fecha de Emisión</p>
                            <p className="font-medium text-gray-900">{new Date().toLocaleDateString('es-CL')}</p>
                        </div>
                    </div>

                    {/* Payer Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Recibido De</p>
                            <p className="text-lg font-bold text-gray-900">{user.nombre}</p>
                            <p className="text-gray-600">Unidad: {user.unidad}</p>
                            {user.email && <p className="text-gray-600 text-sm">{user.email}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Detalles del Pago</p>
                            <p className="text-gray-900"><span className="font-medium">Fecha Pago:</span> {new Date(payment.fechaPago).toLocaleDateString('es-CL')}</p>
                            <p className="text-gray-900"><span className="font-medium">Método:</span> {payment.metodoPago || 'No especificado'}</p>
                            <p className="text-gray-900"><span className="font-medium">Periodo:</span> {payment.periodo}</p>
                        </div>
                    </div>

                    {/* Amount Table */}
                    <div className="mb-8">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-y border-gray-200">
                                    <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Concepto</th>
                                    <th className="py-3 px-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="py-4 px-4 text-gray-900">
                                        <p className="font-medium">{payment.type}</p>
                                        {payment.observacion && <p className="text-sm text-gray-500 mt-1">{payment.observacion}</p>}
                                    </td>
                                    <td className="py-4 px-4 text-right font-bold text-gray-900 text-lg">
                                        {formatCurrency(payment.monto)}
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-gray-900">
                                    <td className="py-4 px-4 text-right font-bold text-gray-900 uppercase">Total Pagado</td>
                                    <td className="py-4 px-4 text-right font-bold text-gray-900 text-xl">
                                        {formatCurrency(payment.monto)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer / Signatures */}
                    <div className="mt-16 pt-8 border-t border-gray-200 grid grid-cols-2 gap-12">
                        <div className="text-center">
                            <div className="h-16 border-b border-gray-300 mb-2"></div>
                            <p className="text-sm font-medium text-gray-500">Firma Administración</p>
                        </div>
                        <div className="text-center">
                            <div className="h-16 border-b border-gray-300 mb-2"></div>
                            <p className="text-sm font-medium text-gray-500">Recibí Conforme</p>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-xs text-gray-400">Este documento es un comprobante válido de pago para la administración del condominio.</p>
                    </div>
                </div>
            </div>

            {/* Print Styles - Robust Fix */}
            <style>{`
                @media print {
                    body { 
                        visibility: hidden; 
                        height: auto;
                        overflow: visible;
                    }
                    #receipt-content { 
                        visibility: visible;
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 40px;
                        background: white;
                        z-index: 99999;
                    }
                    #receipt-content * { 
                        visibility: visible; 
                    }
                }
            `}</style>
        </div>
    );
};
