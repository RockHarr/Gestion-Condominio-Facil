import * as React from 'react';
import { useState, useMemo } from 'react';
import { Expense, ExpenseStatus, ExpenseCategory, Page, PaymentRecord, User, Reservation } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';
import { FinancialCharts } from './FinancialCharts';

// Helper
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

interface AdminDashboardProps {
    expenses: Expense[];
    paymentHistory: PaymentRecord[];
    users: User[];
    onNavigate: (page: Page, params?: any) => void;
    onAddExpense: (expense: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>) => void;
    onApproveExpense: (id: number) => void;
    onRejectExpense: (id: number, motivo: string) => void;
    onCloseMonth: () => void;
    theme: 'light' | 'dark';
    reservations: Reservation[];
}

export const AdminCreateExpenseModal: React.FC<{
    onClose: () => void;
    onAddExpense: (expense: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>) => void
}> = ({ onClose, onAddExpense }) => {
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [categoria, setCategoria] = useState<ExpenseCategory>(ExpenseCategory.OTROS);
    const [proveedor, setProveedor] = useState('');
    const [numeroDocumento, setNumeroDocumento] = useState('');

    const todayISO = new Date().toISOString().slice(0, 10);
    const [fechaGasto, setFechaGasto] = useState<string>(todayISO);
    const [fechaError, setFechaError] = useState<string>('');

    const [fileName, setFileName] = useState<string>('');
    const [fileError, setFileError] = useState<string>('');
    const [adjuntoOK, setAdjuntoOK] = useState<boolean>(false);

    const [hasEvidencia, setHasEvidencia] = useState(false);

    const MAX_BYTES = 5 * 1024 * 1024; // 5MB

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) {
            setFileName('');
            setFileError('');
            setAdjuntoOK(false);
            setHasEvidencia(false);
            return;
        }
        setFileName(f.name);
        if (f.size > MAX_BYTES) {
            setFileError('El adjunto supera 5 MB. Reduce el tamaño para continuar.');
            setAdjuntoOK(false);
            setHasEvidencia(false);
        } else {
            setFileError('');
            setAdjuntoOK(true);
            setHasEvidencia(true);
        }
    };

    const validateFecha = (value: string) => {
        const picked = new Date(value + 'T00:00:00');
        const today = new Date(todayISO + 'T00:00:00');
        if (picked.getTime() > today.getTime()) {
            setFechaError('La fecha no puede ser futura.');
            return false;
        }
        setFechaError('');
        return true;
    };

    const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFechaGasto(val);
        validateFecha(val);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const montoNum = parseInt(monto, 10);

        const okFecha = validateFecha(fechaGasto);
        if (!okFecha) return;

        if (fileError) return;
        if (isNaN(montoNum) || montoNum <= 0) return;
        if (!descripcion.trim()) return;

        const evidenciaUrl = (adjuntoOK || hasEvidencia) ? '#' : undefined;

        onAddExpense({
            descripcion,
            monto: montoNum,
            categoria,
            proveedor,
            numeroDocumento,
            evidenciaUrl,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
            <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cargar Nuevo Gasto</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500" aria-label="Cerrar modal">
                            <Icons name="xmark" className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div>
                            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                            <input id="descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} required className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3" placeholder="Ej: Reparación portón principal" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="monto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto (CLP)</label>
                                <input id="monto" type="number" value={monto} onChange={e => setMonto(e.target.value)} required className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3" placeholder="0" />
                            </div>
                            <div>
                                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                                <select id="categoria" value={categoria} onChange={e => setCategoria(e.target.value as ExpenseCategory)} className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3">
                                    {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="proveedor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proveedor</label>
                                <input id="proveedor" value={proveedor} onChange={e => setProveedor(e.target.value)} className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3" />
                            </div>
                            <div>
                                <label htmlFor="numeroDocumento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">N° Documento</label>
                                <input id="numeroDocumento" value={numeroDocumento} onChange={e => setNumeroDocumento(e.target.value)} className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="fechaGasto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha del gasto</label>
                            <input
                                id="fechaGasto"
                                type="date"
                                value={fechaGasto}
                                max={todayISO}
                                onChange={handleFechaChange}
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                                aria-invalid={!!fechaError}
                                aria-describedby={fechaError ? 'fechaGasto-error' : undefined}
                            />
                            {fechaError && <p id="fechaGasto-error" className="mt-1 text-sm text-red-600">{fechaError}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adjuntar evidencia (máx. 5MB)</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer relative">
                                <div className="space-y-1 text-center">
                                    <Icons name="document-plus" className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                            <span>Subir un archivo</span>
                                            <input id="file-upload" name="file-upload" type="file" accept=".pdf,image/*" className="sr-only" onChange={handleFileChange} />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">PDF, PNG, JPG hasta 5MB</p>
                                    {fileName && !fileError && <p className="text-sm font-medium text-green-600 mt-2">Seleccionado: {fileName}</p>}
                                    {fileError && <p className="text-sm text-red-600 mt-2">{fileError}</p>}
                                </div>
                            </div>

                            <div className="flex items-center mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="hasEvidencia"
                                    checked={hasEvidencia}
                                    onChange={e => {
                                        if (fileError) {
                                            setHasEvidencia(false);
                                            return;
                                        }
                                        setHasEvidencia(e.target.checked);
                                        setAdjuntoOK(e.target.checked || adjuntoOK);
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="hasEvidencia" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                    Marcar como “con evidencia” (simulado)
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
                        <Button
                            type="submit"
                            className="flex-[2] shadow-lg shadow-blue-500/30"
                            disabled={
                                !!fileError ||
                                !!fechaError ||
                                !descripcion.trim() ||
                                isNaN(parseInt(monto, 10)) ||
                                parseInt(monto, 10) <= 0
                            }
                        >
                            Enviar a Revisión
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export const AdminRejectExpenseModal: React.FC<{
    expense: Expense;
    onClose: () => void;
    onReject: (id: number, motivo: string) => void;
}> = ({ expense, onClose, onReject }) => {
    const [motivo, setMotivo] = React.useState('');

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
            <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Rechazar Gasto</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    "{expense?.descripcion ?? ''}"
                </p>

                <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Motivo del Rechazo</label>
                <textarea
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={4}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-red-500 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4 mb-6"
                    placeholder="Describe por qué se rechaza este gasto..."
                />

                <div className="flex gap-3">
                    <Button onClick={onClose} variant="secondary" className="flex-1">Cancelar</Button>
                    <Button
                        variant="danger"
                        className="flex-1 shadow-lg shadow-red-500/30"
                        onClick={() => {
                            if (!expense || typeof expense.id !== 'number') return;
                            if (!motivo.trim()) return;
                            onReject(expense.id, motivo.trim());
                        }}
                    >
                        Confirmar Rechazo
                    </Button>
                </div>
            </Card>
        </div>
    );
};

import { dataService } from '../services/data';
import { FinancialKpis } from '../types';

// ... (imports remain the same)

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ expenses, paymentHistory, users, onNavigate, onAddExpense, onApproveExpense, onRejectExpense, onCloseMonth, theme, reservations }) => {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isRejectModalOpen, setRejectModalOpen] = useState<Expense | null>(null);
    const [financialKpis, setFinancialKpis] = useState<FinancialKpis | null>(null);

    // Fetch Financial KPIs
    React.useEffect(() => {
        const fetchKpis = async () => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

            try {
                const kpis = await dataService.getFinancialKpis(startOfMonth, endOfMonth);
                setFinancialKpis(kpis);
            } catch (error) {
                console.error("Error fetching financial KPIs:", error);
            }
        };
        fetchKpis();
    }, [expenses, paymentHistory]); // Re-fetch when data changes

    const stats = useMemo(() => {
        const approvedExpenses = expenses.filter(e => e.status === ExpenseStatus.APROBADO);
        const totalApprovedAmount = approvedExpenses.reduce((sum, e) => sum + e.monto, 0);
        const reviewCount = expenses.filter(e => e.status === ExpenseStatus.EN_REVISION).length;
        const totalExpensesCount = expenses.length;
        const expensesWithEvidence = expenses.filter(e => !!e.evidenciaUrl).length;
        const evidencePercentage = totalExpensesCount > 0 ? (expensesWithEvidence / totalExpensesCount) * 100 : 100;

        return { totalApprovedAmount, reviewCount, totalExpensesCount, evidencePercentage };
    }, [expenses]);

    const expensesToReview = useMemo(() => expenses.filter(e => e.status === ExpenseStatus.EN_REVISION), [expenses]);
    const recentPayments = useMemo(() => paymentHistory.slice(0, 5), [paymentHistory]);

    const currentMonthName = useMemo(() => {
        const now = new Date();
        const str = now.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
        return str.charAt(0).toUpperCase() + str.slice(1);
    }, []);

    const StatCard: React.FC<{ title: string, value: string | number, icon: string, colorClass: string, trend?: string }> = ({ title, value, icon, colorClass, trend }) => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-start justify-between relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass.replace('bg-', 'text-')}`}>
                <Icons name={icon} className="w-16 h-16" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
                {trend && <p className="text-xs text-green-500 mt-2 font-medium flex items-center gap-1"><Icons name="arrow-trending-up" className="w-3 h-3" /> {trend}</p>}
            </div>
            <div className={`p-3 rounded-xl ${colorClass} text-white shadow-lg shadow-blue-500/20`}>
                <Icons name={icon} className="w-6 h-6" />
            </div>
        </div>
    );

    return (
        <>
            <div className="p-6 max-w-7xl mx-auto space-y-8 animate-page pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Resumen financiero y operativo • <span className="font-medium text-blue-600 dark:text-blue-400">{currentMonthName}</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => onNavigate('admin-notice-create')} variant="secondary" className="!w-auto shadow-sm">
                            <Icons name="pencil" className="w-4 h-4 mr-2" /> Nuevo Aviso
                        </Button>
                        <Button onClick={() => setCreateModalOpen(true)} className="!w-auto shadow-lg shadow-blue-500/30">
                            <Icons name="plus" className="w-4 h-4 mr-2" /> Cargar Gasto
                        </Button>
                    </div>
                </div>

                {stats.reviewCount > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg flex items-start justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex gap-3">
                            <Icons name="exclamation-triangle" className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                            <div>
                                <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                                    Acción Requerida: {stats.reviewCount} {stats.reviewCount === 1 ? 'gasto pendiente' : 'gastos pendientes'}
                                </h3>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                    Hay gastos reportados que requieren tu aprobación para cerrar el mes correctamente.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            className="!w-auto !text-xs !py-1.5 !px-3 bg-white dark:bg-gray-800 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900"
                            onClick={() => {
                                const element = document.getElementById('approval-queue');
                                element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            Ver Pendientes
                        </Button>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title={`Recaudación ${currentMonthName}`}
                        value={financialKpis ? formatCurrency(financialKpis.total_collected) : '...'}
                        icon="currency-dollar"
                        colorClass="bg-emerald-500"
                        trend="Ingresos al día"
                    />
                    <StatCard
                        title="Garantías en Custodia"
                        value={financialKpis ? formatCurrency(financialKpis.deposits_custody) : '...'}
                        icon="lock-closed"
                        colorClass="bg-purple-500"
                        trend="Saldo vivo"
                    />
                    <StatCard
                        title="Gasto Aprobado"
                        value={formatCurrency(stats.totalApprovedAmount)}
                        icon="cash"
                        colorClass="bg-blue-500"
                    />
                    <StatCard
                        title="En Revisión"
                        value={stats.reviewCount}
                        icon="hourglass"
                        colorClass="bg-yellow-500"
                    />
                </div>

                {/* Financial Charts */}
                <FinancialCharts expenses={expenses} payments={paymentHistory} theme={theme} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Payments Section */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Icons name="banknotes" className="w-5 h-5 text-emerald-500" />
                                Últimos Pagos
                            </h2>
                            <button onClick={() => onNavigate('admin-units')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Ver todos</button>
                        </div>
                        <Card className="!p-0 overflow-hidden border-0 shadow-md mb-6">
                            {recentPayments.length > 0 ? (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {recentPayments.map(payment => {
                                        const user = users.find(u => u.id === payment.userId);
                                        return (
                                            <div key={payment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                                        <Icons name="currency-dollar" className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                            {user ? `Unidad ${user.unidad}` : payment.type === 'Reserva' ? 'Reserva' : 'Unidad Desconocida'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {new Date(payment.fechaPago).toLocaleDateString('es-CL')} • {payment.type === 'Reserva' ? 'Pago de Reserva' : (payment.metodoPago || 'Pago')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(payment.monto)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">No hay pagos recientes.</div>
                            )}
                        </Card>

                        {/* Upcoming Reservations */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Icons name="calendar" className="w-5 h-5 text-blue-500" />
                                Próximas Reservas
                            </h2>
                            <button onClick={() => onNavigate('admin-reservations')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Ver todas</button>
                        </div>
                        <Card className="!p-0 overflow-hidden border-0 shadow-md">
                            {reservations && reservations.filter(r => new Date(r.startAt) >= new Date()).length > 0 ? (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {reservations
                                        .filter(r => new Date(r.startAt) >= new Date())
                                        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
                                        .slice(0, 5)
                                        .map(reservation => {
                                            const startDate = new Date(reservation.startAt);
                                            return (
                                                <div key={reservation.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex flex-col items-center justify-center w-10 h-10">
                                                            <span>{startDate.getDate()}</span>
                                                            <span className="text-[9px] uppercase">{startDate.toLocaleString('es-CL', { month: 'short' }).slice(0, 3)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                                {reservation.user?.unidad || 'Admin'} - {reservation.user?.nombre || 'Uso Interno'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {startDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} - {new Date(reservation.endAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${reservation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                        reservation.status === 'REQUESTED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {reservation.status === 'CONFIRMED' ? 'Confirmada' :
                                                            reservation.status === 'REQUESTED' ? 'Pendiente' : reservation.status}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">No hay reservas próximas.</div>
                            )}
                        </Card>

                        <div className="flex items-center justify-between" id="approval-queue">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Icons name="clipboard-document-check" className="w-5 h-5 text-blue-500" />
                                Cola de Aprobación
                            </h2>
                            {stats.reviewCount > 0 && (
                                <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                    {stats.reviewCount} pendientes
                                </span>
                            )}
                        </div>

                        <Card className="!p-0 overflow-hidden border-0 shadow-md">
                            {expensesToReview.length > 0 ? (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {expensesToReview.map(expense => (
                                        <div key={expense.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                                        <Icons name="receipt-percent" className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{expense.descripcion}</h3>
                                                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                            <span className="flex items-center gap-1"><Icons name="tag" className="w-3 h-3" /> {expense.categoria}</span>
                                                            <span className="flex items-center gap-1"><Icons name="calendar" className="w-3 h-3" /> {new Date(expense.fecha).toLocaleDateString('es-CL')}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                            {expense.proveedor || 'Proveedor no especificado'} • {expense.numeroDocumento || 'S/D'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-xl text-gray-900 dark:text-white">{formatCurrency(expense.monto)}</p>
                                                    {expense.evidenciaUrl ? (
                                                        <a href={expense.evidenciaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1">
                                                            <Icons name="paper-clip" className="w-3 h-3" /> Ver Evidencia
                                                        </a>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-600 dark:text-yellow-400 mt-1">
                                                            <Icons name="exclamation-triangle" className="w-3 h-3" /> Sin Evidencia
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <Button onClick={() => setRejectModalOpen(expense)} variant="danger" className="!w-auto !py-2 !px-4 !text-xs shadow-sm">
                                                    <Icons name="xmark" className="w-3 h-3 mr-1.5" /> Rechazar
                                                </Button>
                                                <Button onClick={() => onApproveExpense(expense.id)} className="!w-auto !py-2 !px-4 !text-xs shadow-sm bg-green-600 hover:bg-green-700 focus:ring-green-500">
                                                    <Icons name="check" className="w-3 h-3 mr-1.5" /> Aprobar
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 px-4">
                                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                                        <Icons name="check-badge" className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">¡Todo al día!</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">No hay gastos pendientes de revisión en este momento.</p>
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Shortcuts Section - Moved to top for better visibility */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <Icons name="squares-2x2" className="w-5 h-5 text-blue-500" />
                                Accesos Directos
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => onNavigate('admin-units')} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all text-center group">
                                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Icons name="building-office" className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Unidades</span>
                                </button>
                                <button onClick={() => onNavigate('admin-tickets')} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all text-center group">
                                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Icons name="ticket" className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tickets</span>
                                </button>
                                <button onClick={() => onNavigate('admin-amenities')} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all text-center group col-span-2">
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Icons name="key" className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Administrar Espacios</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Icons name="cog" className="w-5 h-5 text-gray-400" />
                            Gestión Mensual
                        </h2>
                        <Card className="space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Cierre de Mes</h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                                    Finaliza el periodo contable actual y genera los gastos comunes.
                                </p>
                                <Button
                                    onClick={onCloseMonth}
                                    disabled={stats.reviewCount > 0 || expenses.filter(e => e.status === ExpenseStatus.APROBADO).length === 0}
                                    className="w-full shadow-sm"
                                >
                                    <Icons name="lock-closed" className="w-4 h-4 mr-2" /> Cerrar Mes
                                </Button>
                                {stats.reviewCount > 0 && (
                                    <p className="text-xs text-red-500 mt-2 text-center">
                                        * Debes revisar todos los gastos pendientes
                                    </p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div >

            {isCreateModalOpen && (
                <AdminCreateExpenseModal
                    onClose={() => setCreateModalOpen(false)}
                    onAddExpense={(data) => {
                        onAddExpense(data);
                        setCreateModalOpen(false);
                    }}
                />
            )}
            {
                isRejectModalOpen && (
                    <AdminRejectExpenseModal
                        expense={isRejectModalOpen}
                        onClose={() => setRejectModalOpen(null)}
                        onReject={(id, motivo) => {
                            onRejectExpense(id, motivo);
                            setRejectModalOpen(null);
                        }}
                    />
                )
            }
        </>
    );
};
