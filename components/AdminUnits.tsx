import * as React from 'react';
import { useState, useEffect } from 'react';
import { User, Page, PaymentRecord, CommonExpenseDebt, ParkingDebt } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';

// Helper
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
};

interface AdminUnitsScreenProps {
    users: User[];
    paymentHistory: PaymentRecord[];
    onNavigate: (page: Page, params?: any) => void;
    onDeleteUser: (id: string | number) => void;
}

export const AdminUnitsScreen: React.FC<AdminUnitsScreenProps> = ({ users, paymentHistory, onNavigate, onDeleteUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const residents = users.filter(u =>
        u.role === 'resident' &&
        (u.unidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const [menuOpen, setMenuOpen] = useState<string | number | null>(null);

    const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>, id: string | number) => {
        e.stopPropagation();
        setMenuOpen(prev => (prev === id ? null : id));
    };

    useEffect(() => {
        const closeMenu = () => setMenuOpen(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    return (
        <div className="relative min-h-full pb-24" onClick={() => setMenuOpen(null)}>
            <div className="p-6 max-w-7xl mx-auto space-y-6 animate-page">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Directorio de Unidades</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los residentes y sus propiedades</p>
                    </div>
                    <div className="hidden md:block">
                        <Button onClick={() => onNavigate('admin-unit-create')} className="shadow-lg shadow-blue-500/30">
                            <Icons name="plus" className="w-5 h-5 mr-2" />
                            Nueva Unidad
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icons name="magnifying-glass" className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por unidad o nombre..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {residents.map(resident => {
                        const lastPayment = paymentHistory
                            .filter(p => p.userId === resident.id)
                            .sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime())[0];

                        return (
                            <div key={resident.id} className="group relative">
                                <div
                                    onClick={() => onNavigate('admin-unit-detail', { id: resident.id })}
                                    className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer h-full flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                                            {resident.unidad.split('-')[0]}
                                        </div>
                                        <button
                                            onClick={(e) => toggleMenu(e, resident.id)}
                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        >
                                            <Icons name="ellipsis-vertical" className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{resident.unidad}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-4">{resident.nombre}</p>

                                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <Icons name="envelope" className="w-4 h-4" /> Email
                                            </span>
                                            <span className={`font-medium ${resident.email ? 'text-gray-900 dark:text-white' : 'text-gray-400 italic'}`}>
                                                {resident.email ? 'Registrado' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <Icons name="currency-dollar" className="w-4 h-4" /> Último Pago
                                            </span>
                                            <span className={`font-medium ${lastPayment ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                                {lastPayment ? new Date(lastPayment.fechaPago).toLocaleDateString('es-CL') : 'Sin pagos'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <Icons name="truck" className="w-4 h-4" /> Estacionamiento
                                            </span>
                                            <span className={`font-medium px-2 py-0.5 rounded text-xs ${resident.hasParking ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                                {resident.hasParking ? 'Asignado' : 'No'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {menuOpen === resident.id && (
                                    <div className="absolute top-14 right-4 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-20 border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                                        <div className="py-1">
                                            <button onClick={() => { onNavigate('admin-unit-edit', { id: resident.id }); setMenuOpen(null); }} className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <Icons name="pencil" className="w-4 h-4 mr-3 text-gray-400" /> Editar Unidad
                                            </button>
                                            <button onClick={() => { onDeleteUser(resident.id); setMenuOpen(null); }} className="w-full text-left flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                <Icons name="trash" className="w-4 h-4 mr-3" /> Eliminar Unidad
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {residents.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Icons name="user-group" className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay unidades registradas</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                                Los usuarios creados en Supabase aparecerán aquí automáticamente si el trigger está configurado.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="fixed bottom-24 right-4 z-10 md:hidden">
                <button
                    onClick={() => onNavigate('admin-unit-create')}
                    className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-transform hover:scale-105 active:scale-95"
                    aria-label="Añadir nueva unidad"
                >
                    <Icons name="plus" className="w-7 h-7" />
                </button>
            </div>
        </div>
    )
};

// ... (AdminCreateUnitScreen and AdminEditUnitScreen remain unchanged)

// ... (AdminUnitDetailScreen)



interface AdminCreateUnitScreenProps {
    onAddUser: (user: Omit<User, 'id' | 'role'>) => void;
}

export const AdminCreateUnitScreen: React.FC<AdminCreateUnitScreenProps> = ({ onAddUser }) => {
    const [unidad, setUnidad] = useState('');
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [hasParking, setHasParking] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (unidad.trim() && nombre.trim()) {
            onAddUser({ unidad, nombre, hasParking, email });
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto animate-page">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Registrar Nueva Unidad</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="unidad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Unidad</label>
                            <input
                                type="text"
                                id="unidad"
                                value={unidad}
                                onChange={e => setUnidad(e.target.value)}
                                required
                                placeholder="Ej: A-101"
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                            />
                        </div>
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Residente</label>
                            <input
                                type="text"
                                id="nombre"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                required
                                placeholder="Nombre completo"
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico (Opcional)</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="contacto@ejemplo.com"
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                            />
                        </div>
                        <div className="pt-2">
                            <label className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex-1">
                                    <span className="block text-sm font-medium text-gray-900 dark:text-white">Estacionamiento Asignado</span>
                                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">Incluir cobro de estacionamiento en gastos comunes</span>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer ml-4">
                                    <input type="checkbox" className="sr-only peer" checked={hasParking} onChange={() => setHasParking(!hasParking)} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                        </div>
                    </div>
                </Card>
                <div className="flex gap-4">
                    <Button type="submit" className="shadow-lg shadow-blue-500/30">Registrar Unidad</Button>
                </div>
            </form>
        </div>
    );
};

interface AdminEditUnitScreenProps {
    user: User;
    onUpdateUser: (id: string | number, data: Partial<Pick<User, 'nombre' | 'hasParking' | 'email' | 'unidad' | 'alicuota'>>) => void;
}

export const AdminEditUnitScreen: React.FC<AdminEditUnitScreenProps> = ({ user, onUpdateUser }) => {
    const [unidad, setUnidad] = useState(user.unidad);
    const [nombre, setNombre] = useState(user.nombre);
    const [email, setEmail] = useState(user.email || '');
    const [hasParking, setHasParking] = useState(user.hasParking);
    const [alicuota, setAlicuota] = useState(user.alicuota?.toString() || '0');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nombre.trim() && unidad.trim()) {
            onUpdateUser(user.id, {
                nombre,
                hasParking,
                email,
                unidad,
                alicuota: parseFloat(alicuota) || 0
            });
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto animate-page">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Editar Unidad {user.unidad}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidad</label>
                            <input
                                type="text"
                                value={unidad}
                                onChange={(e) => setUnidad(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                            />
                        </div>
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Residente</label>
                            <input
                                type="text"
                                id="nombre"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alícuota (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={alicuota}
                                onChange={(e) => setAlicuota(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                            />
                            <p className="text-xs text-gray-500 mt-1">Porcentaje de participación en gastos comunes.</p>
                        </div>
                        <div className="pt-2">
                            <label className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex-1">
                                    <span className="block text-sm font-medium text-gray-900 dark:text-white">Estacionamiento Asignado</span>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer ml-4">
                                    <input type="checkbox" className="sr-only peer" checked={hasParking} onChange={() => setHasParking(!hasParking)} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                        </div>
                    </div>
                </Card>
                <Button type="submit">Guardar Cambios</Button>
            </form>
        </div>
    );
};

interface AdminUnitDetailScreenProps {
    user: User;
    paymentHistory: PaymentRecord[];
    commonExpenseDebts: CommonExpenseDebt[];
    parkingDebts: ParkingDebt[];
}

import { PaymentReceiptModal } from './PaymentReceiptModal';

// ... (existing AdminUnitsScreen and AdminCreateUnitScreen and AdminEditUnitScreen)

export const AdminUnitDetailScreen: React.FC<AdminUnitDetailScreenProps> = ({ user, paymentHistory, commonExpenseDebts, parkingDebts }) => {
    const [printingPayment, setPrintingPayment] = useState<PaymentRecord | null>(null);

    const userCommonDebts = commonExpenseDebts.filter(d => d.userId === user.id && !d.pagado);
    const userParkingDebts = parkingDebts.filter(d => d.userId === user.id && !d.pagado);
    const totalDebt = userCommonDebts.reduce((sum, d) => sum + d.monto, 0) + userParkingDebts.reduce((sum, d) => sum + d.monto, 0);

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-page">
            <div className="flex flex-col md:flex-row gap-6">
                {/* User Profile Card */}
                <Card className="flex-1">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl">
                                {user.unidad.split('-')[0]}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.unidad}</h2>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">{user.nombre}</p>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl border ${totalDebt > 0 ? 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'}`}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1">Deuda Total</p>
                            <p className="text-xl font-bold">{formatCurrency(totalDebt)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                                <Icons name="envelope" className="w-4 h-4" /> Email
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white truncate">{user.email || 'No registrado'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                                <Icons name="truck" className="w-4 h-4" /> Estacionamiento
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">{user.hasParking ? 'Asignado' : 'No asignado'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                                <Icons name="chart-pie" className="w-4 h-4" /> Alícuota
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">{user.alicuota ? `${user.alicuota}%` : '0%'}</p>
                        </div>
                    </div>
                </Card>

                {/* Quick Stats / Actions could go here */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Debts Column */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Icons name="exclamation-circle" className="w-5 h-5 text-red-500" />
                        Deudas Pendientes
                    </h3>
                    {userCommonDebts.length === 0 && userParkingDebts.length === 0 ? (
                        <Card className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-dashed">
                            <Icons name="check-circle" className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                            <p>No hay deudas pendientes</p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {userCommonDebts.map(debt => (
                                <Card key={`common-${debt.id}`} className="flex justify-between items-center border-l-4 border-l-red-500">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">Gasto Común</p>
                                        <p className="text-sm text-gray-500">{formatPeriod(debt.mes)}</p>
                                    </div>
                                    <p className="font-bold text-red-600 dark:text-red-400">{formatCurrency(debt.monto)}</p>
                                </Card>
                            ))}
                            {userParkingDebts.map(debt => (
                                <Card key={`parking-${debt.id}`} className="flex justify-between items-center border-l-4 border-l-red-500">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">Estacionamiento</p>
                                        <p className="text-sm text-gray-500">{formatPeriod(debt.mes)}</p>
                                    </div>
                                    <p className="font-bold text-red-600 dark:text-red-400">{formatCurrency(debt.monto)}</p>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Payment History Column */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Icons name="clock" className="w-5 h-5 text-blue-500" />
                        Historial de Pagos
                    </h3>
                    <Card className="max-h-[400px] overflow-y-auto">
                        {paymentHistory.length > 0 ? (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paymentHistory.map(payment => (
                                    <li key={payment.id} className="py-3 first:pt-0 last:pb-0 group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">{payment.type}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatPeriod(payment.periodo)} • {new Date(payment.fechaPago).toLocaleDateString('es-CL')}</p>
                                                {payment.metodoPago && (
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">{payment.metodoPago}</p>
                                                )}
                                                {payment.observacion && (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic max-w-[200px] truncate">{payment.observacion}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatCurrency(payment.monto)}</p>
                                                <button
                                                    onClick={() => setPrintingPayment(payment)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                                                    title="Imprimir Comprobante"
                                                >
                                                    <Icons name="printer" className="w-3.5 h-3.5" />
                                                    Comprobante
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">No hay registros de pagos.</p>
                        )}
                    </Card>
                </div>
            </div>

            {printingPayment && (
                <PaymentReceiptModal
                    payment={printingPayment}
                    user={user}
                    onClose={() => setPrintingPayment(null)}
                />
            )}
        </div>
    );
};
