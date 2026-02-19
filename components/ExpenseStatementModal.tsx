import * as React from 'react';
import { User, Expense, PaymentRecord } from '../types';
import Icons from './Icons';

interface ExpenseStatementModalProps {
    user: User;
    month: string; // YYYY-MM
    communityExpenses: Expense[];
    payments: PaymentRecord[];
    previousBalance: number;
    onClose: () => void;
}

export const ExpenseStatementModal: React.FC<ExpenseStatementModalProps> = ({
    user,
    month,
    communityExpenses,
    payments,
    previousBalance,
    onClose
}) => {
    // Format helpers
    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-CL');

    // Derived Data
    const [yearStr, monthStr] = month.split('-');
    const monthName = new Date(parseInt(yearStr), parseInt(monthStr) - 1).toLocaleString('es-CL', { month: 'long' });
    const periodLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${yearStr}`;

    // Community Totals
    const totalExpenses = communityExpenses.reduce((sum, e) => sum + e.monto, 0);

    // Unit Calculation
    const alicuota = user.alicuota || 0;
    const unitShareRaw = totalExpenses * (alicuota / 100);
    const unitShare = Math.round(unitShareRaw);

    // Fixed Charges (Simulated for now, ideally from settings)
    const parkingFee = user.hasParking ? 12000 : 0;
    const reserveFundPct = 5; // 5% of common expense
    const reserveFund = Math.round(unitShare * (reserveFundPct / 100));

    const monthCharges = unitShare + parkingFee + reserveFund;

    // Payments in this period
    const monthPayments = payments.filter(p => p.periodo === month);
    const totalPaid = monthPayments.reduce((sum, p) => sum + p.monto, 0);

    const totalToPay = previousBalance + monthCharges - totalPaid;

    // Categorized Expenses
    const expensesByCategory = communityExpenses.reduce((acc, expense) => {
        const cat = expense.categoria || 'Otros';
        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += expense.monto;
        return acc;
    }, {} as Record<string, number>);

    // Handle Print
    const handlePrint = () => {
        document.body.classList.add('printing');
        window.print();
        document.body.classList.remove('printing');
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 sm:p-6 overflow-y-auto print:p-0 print:block print:static">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm print:hidden" onClick={onClose} />

            {/* Modal Container */}
            <div
                data-print-root
                className="relative bg-white w-full max-w-3xl rounded-xl shadow-2xl flex flex-col my-10 print:my-0 print:shadow-none print:w-full print:max-w-none print:rounded-none animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Toolbar */}
                <div className="flex-none bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center rounded-t-xl print:hidden">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2">
                        <Icons name="document-text" className="w-5 h-5 text-blue-600" />
                        Estado de Gasto Común
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            Cerrar
                        </button>
                        <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors">
                            <Icons name="printer" className="w-4 h-4" />
                            Imprimir / Guardar PDF
                        </button>
                    </div>
                </div>

                {/* Statement Content */}
                <div className="p-8 md:p-12 print:p-10 bg-white rounded-b-xl text-gray-900">

                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                    C
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold uppercase tracking-wide">Condominio Fácil</h1>
                                    <p className="text-xs text-gray-500">RUT: 76.543.210-K</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">Av. Las Torres 1234, Santiago</p>
                            <p className="text-sm text-gray-600">contacto@condominiofacil.cl</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-gray-900 uppercase mb-1">Estado de Cuenta</h2>
                            <p className="text-sm text-gray-500 mb-4">Gasto Común</p>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <span className="text-gray-500 font-medium">Periodo:</span>
                                <span className="font-bold">{periodLabel}</span>

                                <span className="text-gray-500 font-medium">Fecha Emisión:</span>
                                <span>{new Date().toLocaleDateString('es-CL')}</span>

                                <span className="text-gray-500 font-medium">Folio:</span>
                                <span className="font-mono">#{Date.now().toString().slice(-6)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Resident Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 print:bg-white print:border-gray-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Residente</p>
                                <p className="font-bold text-lg">{user.nombre}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Unidad</p>
                                <p className="font-bold text-lg">{user.unidad}</p>
                                <p className="text-sm text-gray-600">
                                    Estacionamiento: {user.hasParking ? 'Sí' : 'No'}
                                </p>
                            </div>
                            <div className="md:text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Alícuota</p>
                                <p className="font-bold text-lg">{alicuota}%</p>
                                <p className="text-xs text-gray-500">Participación en gastos</p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Box (The "Bill") */}
                    <div className="flex flex-col md:flex-row gap-8 mb-10">
                        {/* Calculation Explanation */}
                        <div className="flex-1 text-sm text-gray-600">
                            <h3 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">Detalle del Cálculo</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Gasto Común Total:</span>
                                    <span>{formatCurrency(totalExpenses)}</span>
                                </div>
                                <div className="flex justify-between pl-4 border-l-2 border-gray-200">
                                    <span>× Alícuota ({alicuota}%):</span>
                                    <span className="font-medium text-gray-900">{formatCurrency(unitShare)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>+ Fondo Reserva ({reserveFundPct}%):</span>
                                    <span>{formatCurrency(reserveFund)}</span>
                                </div>
                                {user.hasParking && (
                                    <div className="flex justify-between">
                                        <span>+ Estacionamiento:</span>
                                        <span>{formatCurrency(parkingFee)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-gray-300 pt-2 mt-2 font-bold text-gray-900">
                                    <span>= Total Cargos del Mes:</span>
                                    <span>{formatCurrency(monthCharges)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Big Total */}
                        <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-6 print:bg-gray-50 print:border-gray-300">
                            <h3 className="font-bold text-blue-900 mb-4 text-center uppercase tracking-wider print:text-black">Resumen a Pagar</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Saldo Anterior:</span>
                                    <span className="font-medium">{formatCurrency(previousBalance)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Cargos del Mes:</span>
                                    <span className="font-medium">{formatCurrency(monthCharges)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600 print:text-black">
                                    <span>Pagos Realizados:</span>
                                    <span className="font-medium">-{formatCurrency(totalPaid)}</span>
                                </div>
                                <div className="border-t-2 border-blue-200 pt-3 mt-2 flex justify-between items-baseline print:border-gray-400">
                                    <span className="font-bold text-blue-900 print:text-black">Total a Pagar:</span>
                                    <span className="text-3xl font-bold text-blue-600 print:text-black">{formatCurrency(totalToPay)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expenses Detail Table */}
                    <div className="mb-10 break-inside-avoid">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Icons name="chart-pie" className="w-5 h-5 text-gray-400" />
                            Desglose de Gastos de la Comunidad
                        </h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100 border-y border-gray-200 print:bg-gray-200">
                                    <th className="py-2 px-4 text-left font-bold text-gray-600">Categoría</th>
                                    <th className="py-2 px-4 text-right font-bold text-gray-600">Monto Total</th>
                                    <th className="py-2 px-4 text-right font-bold text-gray-600">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(expensesByCategory).map(([cat, amount]) => (
                                    <tr key={cat} className="border-b border-gray-100">
                                        <td className="py-2 px-4 text-gray-900">{cat}</td>
                                        <td className="py-2 px-4 text-right font-medium">{formatCurrency(amount)}</td>
                                        <td className="py-2 px-4 text-right text-gray-500">
                                            {((amount / totalExpenses) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 font-bold border-t border-gray-300">
                                    <td className="py-2 px-4 text-gray-900">TOTAL GASTOS</td>
                                    <td className="py-2 px-4 text-right text-gray-900">{formatCurrency(totalExpenses)}</td>
                                    <td className="py-2 px-4 text-right">100%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Movements / Payments Table */}
                    {monthPayments.length > 0 && (
                        <div className="mb-8 break-inside-avoid">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Icons name="credit-card" className="w-5 h-5 text-gray-400" />
                                Pagos Recibidos
                            </h3>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-100 border-y border-gray-200 print:bg-gray-200">
                                        <th className="py-2 px-4 text-left font-bold text-gray-600">Fecha</th>
                                        <th className="py-2 px-4 text-left font-bold text-gray-600">Método</th>
                                        <th className="py-2 px-4 text-left font-bold text-gray-600">Observación</th>
                                        <th className="py-2 px-4 text-right font-bold text-gray-600">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthPayments.map((p) => (
                                        <tr key={p.id} className="border-b border-gray-100">
                                            <td className="py-2 px-4 text-gray-900">{formatDate(p.fechaPago)}</td>
                                            <td className="py-2 px-4 text-gray-600">{p.metodoPago}</td>
                                            <td className="py-2 px-4 text-gray-500 italic">{p.observacion || '-'}</td>
                                            <td className="py-2 px-4 text-right font-medium text-green-600 print:text-black">
                                                {formatCurrency(p.monto)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 break-inside-avoid">
                        <p className="mb-1">¿Dudas con tu cobro? Escríbenos a contacto@condominiofacil.cl o llama al +56 2 2345 6789.</p>
                        <p>Este documento es un estado de cuenta informativo generado el {new Date().toLocaleString('es-CL')}.</p>
                    </div>

                </div>
            </div>
        </div>
    );
};
