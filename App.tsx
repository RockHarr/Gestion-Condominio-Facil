import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { User, Ticket, Notice, Reservation, Amenity, Page, ParkingDebt, FinancialStatement, ReserveFund, PaymentRecord, CommonExpenseDebt, Expense, CommunitySettings } from './types';
import { TicketStatus, NoticeType, PaymentType, NoticeStatus, ExpenseStatus, ExpenseCategory } from './types';
import { db } from './data';
import Icons from './components/Icons';

// --- Helper Components ---

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
};


const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`animate-pulse bg-gray-300 dark:bg-gray-700 rounded-md ${className}`} />
);

// FIX: Added onClick prop to Card component to handle clicks on modal cards.
const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: (e: React.MouseEvent<HTMLDivElement>) => void }> = ({ children, className, onClick }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 ${className}`} onClick={onClick}>
        {children}
    </div>
);

const Button: React.FC<{ onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, children: React.ReactNode, variant?: 'primary' | 'secondary' | 'danger', className?: string, type?: 'button' | 'submit', disabled?: boolean, 'data-testid'?: string, 'aria-label'?: string }> = ({ onClick, children, variant = 'primary', className = '', type = 'button', disabled = false, ...rest }) => {
    const baseClasses = 'w-full text-center px-4 py-3 rounded-lg font-semibold text-base focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-transform transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    };
    return <button type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`} disabled={disabled} {...rest}>{children}</button>;
};

const Header: React.FC<{ title: string; onBack?: () => void; onLogout?: () => void; children?: React.ReactNode }> = ({ title, onBack, onLogout, children }) => (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center min-w-0">
            {onBack && (
                <button onClick={onBack} className="mr-3 p-2 -ml-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0" aria-label="Volver">
                    <Icons name="chevronLeft" className="w-6 h-6" />
                </button>
            )}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
            {children}
            {onLogout && (
                <button onClick={onLogout} className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Cerrar sesión">
                    <Icons name="logout" className="w-6 h-6" />
                </button>
            )}
        </div>
    </header>
);

const getStatusColors = (status: TicketStatus): string => {
    const statusColors: { [key in TicketStatus]: string } = {
        [TicketStatus.NUEVO]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        [TicketStatus.EN_PROCESO]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        [TicketStatus.RESUELTO]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        [TicketStatus.CERRADO]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return statusColors[status];
};

const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-md text-white shadow-lg animate-fade-in-down ${typeClasses[type]}`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 -mr-2 p-1 rounded-full hover:bg-white/20">
          <Icons name="xmark" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// --- Login Screen ---

const LoginScreen: React.FC<{ onLogin: (user: User) => void; users: User[] }> = ({ onLogin, users }) => {
    const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id.toString() || '');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const user = users.find(u => u.id.toString() === selectedUserId);
        if (user) {
            onLogin(user);
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <Card className="w-full max-w-sm">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bienvenido</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Selecciona un usuario para continuar</p>
                </div>
                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="user-select" className="sr-only">Seleccionar Usuario</label>
                        <select
                            id="user-select"
                            data-testid="select-usuario"                 // 👈 testid
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.nombre} ({user.role === 'admin' ? 'Admin' : user.unidad})</option>
                            ))}
                        </select>
                    </div>
                    <Button type="submit" data-testid="btn-ingresar">{/* 👈 testid */}
                        Ingresar
                    </Button>
                </form>
            </Card>
        </div>
    );
};


// --- RESIDENT APP ---

const ResidentTabBar: React.FC<{ currentPage: Page, onNavigate: (page: Page) => void, unreadNotices: number }> = ({ currentPage, onNavigate, unreadNotices }) => {
    const navItems = [
        { page: 'home', icon: 'home', label: 'Inicio' },
        { page: 'payments', icon: 'wallet', label: 'Pagos' },
        { page: 'tickets', icon: 'ticket', label: 'Tickets' },
        { page: 'notices', icon: 'bell', label: 'Avisos' },
        { page: 'more', icon: 'ellipsis-horizontal-circle', label: 'Más' },
    ];
    const mainPages = ['home', 'payments', 'tickets', 'notices', 'more'];
    
    const getActiveTab = () => {
        if (mainPages.includes(currentPage)) return currentPage;
        if (['profile', 'reservations', 'financial-statements', 'reserve-fund', 'resident-expenses'].includes(currentPage)) return 'home'; // Default to home for sub-pages
        return null;
    }
    const activeTab = getActiveTab();

    if (!activeTab) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-20 max-w-lg mx-auto">
            <div className="flex justify-around">
                {navItems.map(item => {
                    const isActive = activeTab === item.page;
                    return (
                        <button
                            key={item.page}
                            onClick={() => onNavigate(item.page as Page)}
                            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-sm font-medium focus:outline-none transition-colors duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className="relative">
                                <Icons name={item.icon} className="w-7 h-7" />
                                {item.page === 'notices' && unreadNotices > 0 && (
                                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                                        {unreadNotices}
                                    </span>
                                )}
                            </div>
                            <span className="mt-1">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

const HomeScreen: React.FC<{ user: User; commonExpenseDebts: CommonExpenseDebt[]; parkingDebts: ParkingDebt[]; expenses: Expense[]; onNavigate: (page: Page) => void; showToast: (message: string, type?: 'success' | 'error' | 'info') => void; }> = ({ user, commonExpenseDebts, parkingDebts, expenses, onNavigate, showToast }) => {
    
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
                              aria-label="Marcar pago"               // 👈 alias accesible para el test
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

const ResidentExpensesScreen: React.FC<{ expenses: Expense[]; showToast: (message: string, type?: 'success' | 'error' | 'info') => void; }> = ({ expenses, showToast }) => {
    const approvedExpenses = useMemo(() => expenses.filter(e => e.status === ExpenseStatus.APROBADO), [expenses]);
    const availableMonths = useMemo(() => {
        const months = new Set(approvedExpenses.map(e => e.fecha.slice(0, 7)));
        return Array.from(months).sort().reverse();
    }, [approvedExpenses]);
    
    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredExpenses = useMemo(() => {
        return approvedExpenses
            .filter(e => e.fecha.startsWith(selectedMonth))
            .filter(e => 
                e.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.numeroDocumento?.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [approvedExpenses, selectedMonth, searchTerm]);
    
    const totalForMonth = filteredExpenses.reduce((sum, e) => sum + e.monto, 0);

    return (
        <div className="p-4 space-y-4">
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mes</label>
                        <select id="month-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="mt-1 block w-full input-field">
                            {availableMonths.map(month => <option key={month} value={month}>{formatPeriod(month)}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                         <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buscar</label>
                         <div className="relative mt-1">
                             <input type="text" id="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Proveedor, descripción..." className="w-full input-field pl-10" />
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Icons name="magnifying-glass" className="w-5 h-5 text-gray-400"/>
                             </div>
                         </div>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="flex justify-between items-baseline mb-4">
                    <h2 className="text-lg font-bold">Total del Periodo</h2>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalForMonth)}</p>
                </div>
                 {filteredExpenses.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredExpenses.map(expense => (
                            <li key={expense.id} className="py-3">
                                <div className="flex justify-between items-center gap-4">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{expense.descripcion}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{expense.proveedor} - {new Date(expense.fecha).toLocaleDateString('es-CL')}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-bold">{formatCurrency(expense.monto)}</p>
                                        <button onClick={() => showToast('Simulando vista de boleta...', 'info')} className="text-xs font-semibold text-blue-600 dark:text-blue-400">Ver Boleta</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                 ) : (
                    <p className="text-center text-gray-600 dark:text-gray-400 py-6">No se encontraron gastos para los criterios seleccionados.</p>
                 )}
            </Card>
        </div>
    );
};


const PaymentsScreen: React.FC<{ commonExpenseDebts: CommonExpenseDebt[], parkingDebts: ParkingDebt[], onNavigate: (page: Page, params?: any) => void }> = ({ commonExpenseDebts, parkingDebts, onNavigate }) => {
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

const PaymentMethodScreen: React.FC<{ onNavigate: (page: Page, params?: any) => void, params: { totalAmount: number, itemsToPay: any[] } }> = ({ onNavigate, params }) => {
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

const PaymentConfirmScreen: React.FC<{ onConfirm: () => void, onNavigate: (page: Page, params?: any) => void, params: { totalAmount: number, itemsToPay: any[] } }> = ({ onConfirm, onNavigate, params }) => {
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

const PaymentReceiptScreen: React.FC<{ onNavigate: (page: Page) => void; user: User; params: { totalAmount: number; itemsToPay: any[] }; showToast: (message: string, type?: 'success' | 'error' | 'info') => void; }> = ({ onNavigate, user, params, showToast }) => {
    
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

const TicketItem: React.FC<{ ticket: Ticket; onClick: () => void }> = ({ ticket, onClick }) => {
    return (
        <button onClick={onClick} className="w-full text-left">
            <Card className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white pr-4">{ticket.titulo}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${getStatusColors(ticket.estado)}`}>{ticket.estado}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{new Date(ticket.fecha).toLocaleDateString('es-CL')}</p>
            </Card>
        </button>
    );
};

const TicketsScreen: React.FC<{ tickets: Ticket[]; onNavigate: (page: Page, params?: any) => void }> = ({ tickets, onNavigate }) => {
    return (
        <div className="p-4 space-y-4">
            {tickets.length > 0 ? (
                tickets.map(ticket => (
                    <TicketItem key={ticket.id} ticket={ticket} onClick={() => onNavigate('ticket-detail', { id: ticket.id })} />
                ))
            ) : (
                <Card className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">No tienes tickets abiertos.</p>
                </Card>
            )}
             <div className="fixed bottom-24 right-4 z-10">
                <button 
                    onClick={() => onNavigate('ticket-create')} 
                    className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    aria-label="Crear nuevo ticket"
                >
                    <Icons name="plus" className="w-8 h-8"/>
                </button>
            </div>
        </div>
    );
};


const TicketDetailScreen: React.FC<{ ticket: Ticket, onUpdateStatus: (id: number, status: TicketStatus) => void }> = ({ ticket, onUpdateStatus }) => {
    const isClosed = ticket.estado === TicketStatus.CERRADO || ticket.estado === TicketStatus.RESUELTO;

    return (
        <div className="p-4 space-y-4">
            <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ticket #{ticket.id} - {new Date(ticket.fecha).toLocaleDateString('es-CL')}</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{ticket.titulo}</h2>
                <p className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.descripcion}</p>
                {ticket.foto && (
                    <div className="mt-4">
                        <p className="font-semibold mb-2">Foto adjunta:</p>
                        <img src={ticket.foto} alt="Adjunto del ticket" className="rounded-lg max-w-full h-auto" />
                    </div>
                )}
            </Card>
             <div className="space-y-3">
                 {isClosed ? (
                    <Button onClick={() => onUpdateStatus(ticket.id, TicketStatus.NUEVO)} variant="secondary">Reabrir Ticket</Button>
                 ) : (
                    <Button onClick={() => onUpdateStatus(ticket.id, TicketStatus.CERRADO)} variant="primary">Marcar como Resuelto y Cerrar</Button>
                 )}
            </div>
        </div>
    );
};


const CreateTicketScreen: React.FC<{ onAddTicket: (ticket: { titulo: string; descripcion: string; foto?: string; }) => void }> = ({ onAddTicket }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState<string | undefined>(undefined);
    const [photoName, setPhotoName] = useState('');

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && description.trim()) {
            onAddTicket({ titulo: title, descripcion: description, foto: photo });
        }
    };
    
    return (
        <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={5} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adjuntar foto (opcional)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <Icons name="camera" className="mx-auto h-12 w-12 text-gray-400"/>
                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                        <span>Subir un archivo</span>
                                        <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange}/>
                                    </label>
                                    <p className="pl-1">o arrastrar y soltar</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                            </div>
                        </div>
                        {photoName && <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">Archivo seleccionado: {photoName}</p>}
                    </div>
                </Card>
                <Button type="submit">Enviar Ticket</Button>
            </form>
        </div>
    );
};

const NoticesScreen: React.FC<{ notices: Notice[]; onNavigate: (page: Page, params?: any) => void }> = ({ notices, onNavigate }) => {
    const typeColors: { [key in NoticeType]: string } = {
        [NoticeType.EMERGENCIA]: 'border-red-500',
        [NoticeType.MANTENIMIENTO]: 'border-yellow-500',
        [NoticeType.COMUNIDAD]: 'border-blue-500'
    };
    
    return (
        <div className="p-4 space-y-4">
            {notices.map(notice => (
                 <button key={notice.id} onClick={() => onNavigate('notice-detail', { id: notice.id })} className="w-full text-left">
                    <Card className={`border-l-4 ${typeColors[notice.tipo]} ${!notice.leido && 'bg-blue-50 dark:bg-blue-900/20'}`}>
                        <div className="flex justify-between items-start">
                             <div>
                                 <p className="text-sm text-gray-500 dark:text-gray-400">{notice.tipo}</p>
                                 <h3 className={`font-bold text-lg ${!notice.leido ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{notice.titulo}</h3>
                             </div>
                             {!notice.leido && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1 ml-2"></div>}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{new Date(notice.fecha).toLocaleDateString('es-CL')}</p>
                    </Card>
                 </button>
            ))}
        </div>
    );
};

const NoticeDetailScreen: React.FC<{ notice: Notice; showToast: (message: string, type?: 'success' | 'error' | 'info') => void; }> = ({ notice, showToast }) => {
    const typeColors: { [key in NoticeType]: string } = {
        [NoticeType.EMERGENCIA]: 'text-red-600 dark:text-red-400',
        [NoticeType.MANTENIMIENTO]: 'text-yellow-600 dark:text-yellow-400',
        [NoticeType.COMUNIDAD]: 'text-blue-600 dark:text-blue-400'
    };

    return (
        <div className="p-4">
            <Card>
                <p className={`font-semibold ${typeColors[notice.tipo]}`}>{notice.tipo}</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{notice.titulo}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Publicado el {new Date(notice.fecha).toLocaleDateString('es-CL')}</p>
                <hr className="my-4 border-gray-200 dark:border-gray-700"/>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{notice.contenido}</p>
                <div className="mt-6">
                    <Button variant="secondary" onClick={() => showToast('Simulación de descarga de adjunto.', 'info')}>Descargar Adjunto</Button>
                </div>
            </Card>
        </div>
    );
};

const ReservationsScreen: React.FC<{ amenities: Amenity[], reservations: Reservation[], user: User, onAddReservation: (res: Omit<Reservation, 'id'>) => boolean, onCancelReservation: (id: number) => void }> = ({ amenities, reservations, user, onAddReservation, onCancelReservation }) => {
    const [selectedAmenity, setSelectedAmenity] = useState(amenities[0].id);
    const [currentDate, setCurrentDate] = useState(new Date('2025-11-10'));
    
    const timeslots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    
    const changeDay = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + offset);
            return newDate;
        });
    };
    
    const dateString = currentDate.toISOString().split('T')[0];

    return (
        <div className="p-4 space-y-4">
            <Card>
                 <label htmlFor="amenity-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Seleccionar Espacio Común</label>
                 <select id="amenity-select" value={selectedAmenity} onChange={e => setSelectedAmenity(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                     {amenities.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                 </select>
            </Card>
            
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeDay(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><Icons name="chevronLeft" /></button>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{currentDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                    <button onClick={() => changeDay(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><Icons name="chevronRight" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {timeslots.map(time => {
                        const reservation = reservations.find(r => r.amenityId === selectedAmenity && r.fecha === dateString && r.hora === time);
                        const isMine = reservation?.userId === user.id;
                        const isAvailable = !reservation;

                        return (
                            <button 
                                key={time}
                                onClick={() => {
                                    if(isAvailable) {
                                        onAddReservation({ amenityId: selectedAmenity, fecha: dateString, hora: time, userId: user.id })
                                    } else if (isMine) {
                                        if (window.confirm('¿Seguro que quieres cancelar esta reserva?')) {
                                            onCancelReservation(reservation.id);
                                        }
                                    }
                                }}
                                disabled={reservation && !isMine}
                                className={`p-3 rounded-lg text-center font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isMine ? 'bg-red-500 text-white hover:bg-red-600' :
                                    isAvailable ? 'bg-green-500 text-white hover:bg-green-600' :
                                    'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                }`}
                            >
                                {time}
                            </button>
                        )
                    })}
                </div>
            </Card>
        </div>
    );
}

const ProfileScreen: React.FC<{ user: User; onLogout: () => void; onToggleTheme: () => void; theme: 'light' | 'dark' }> = ({ user, onLogout, onToggleTheme, theme }) => {
    return (
        <div className="p-4 space-y-4">
            <Card className="flex items-center space-x-4">
                 <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Icons name="user" className="w-10 h-10 text-gray-600 dark:text-gray-400"/>
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.nombre}</h2>
                    <p className="text-gray-600 dark:text-gray-400">Unidad {user.unidad}</p>
                 </div>
            </Card>
            
            <Card>
                <button onClick={onToggleTheme} className="flex justify-between items-center w-full p-2">
                    <span className="font-medium text-gray-800 dark:text-gray-200">Modo Oscuro</span>
                    <div className="relative">
                        <div className={`w-14 h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`}></div>
                    </div>
                </button>
            </Card>

            <Button onClick={onLogout} variant="danger">
                 <div className="flex items-center justify-center">
                    <Icons name="logout" className="w-5 h-5 mr-2"/> Cerrar Sesión
                 </div>
            </Button>
        </div>
    );
};

const MoreScreen: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const menuItems = [
        { page: 'reservations', icon: 'user', label: 'Reservas' },
        { page: 'financial-statements', icon: 'document-text', label: 'Rendición de Cuentas' },
        { page: 'reserve-fund', icon: 'chart-pie', label: 'Fondo de Reserva' },
        { page: 'profile', icon: 'user', label: 'Mi Perfil' },
    ];

    return (
        <div className="p-4">
            <Card>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {menuItems.map(item => (
                        <li key={item.page}>
                            <button onClick={() => onNavigate(item.page as Page)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center">
                                    <Icons name={item.icon} className="w-6 h-6 mr-4 text-gray-600 dark:text-gray-400" />
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{item.label}</span>
                                </div>
                                <Icons name="chevronRight" className="w-5 h-5 text-gray-400" />
                            </button>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    )
};

const FinancialStatementsScreen: React.FC<{ statements: FinancialStatement[], showToast: (message: string, type?: 'success' | 'error' | 'info') => void; }> = ({ statements, showToast }) => {
    return (
        <div className="p-4 space-y-4">
            {statements.map(statement => (
                <Card key={statement.id}>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{statement.mes}</h3>
                    <div className="mt-2 text-sm space-y-1">
                        <div className="flex justify-between"><span className="text-green-600 dark:text-green-400">Ingresos:</span><span>{formatCurrency(statement.ingresos)}</span></div>
                        <div className="flex justify-between"><span className="text-red-600 dark:text-red-400">Egresos:</span><span>{formatCurrency(statement.egresos)}</span></div>
                        <div className="flex justify-between font-semibold"><span className="text-gray-800 dark:text-gray-200">Saldo:</span><span>{formatCurrency(statement.saldo)}</span></div>
                    </div>
                    <Button onClick={() => showToast('Simulando descarga de informe...', 'info')} variant="secondary" className="mt-4 !py-2 !text-sm">
                        <div className="flex items-center justify-center"><Icons name="download" className="w-4 h-4 mr-2" /> Descargar Informe</div>
                    </Button>
                </Card>
            ))}
        </div>
    );
};

const ReserveFundScreen: React.FC<{ fund: ReserveFund }> = ({ fund }) => {
    const percentage = (fund.montoActual / fund.meta) * 100;
    return (
        <div className="p-4">
            <Card>
                <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Fondo de Reserva</h2>
                <div className="my-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monto Actual</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{formatCurrency(fund.montoActual)}</p>
                </div>
                <div>
                    <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progreso</span>
                        <span>Meta: {formatCurrency(fund.meta)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <p className="text-center text-sm font-semibold mt-2 text-gray-700 dark:text-gray-300">{percentage.toFixed(1)}% completado</p>
                </div>
            </Card>
        </div>
    )
}

const ResidentApp: React.FC<{
    page: Page,
    pageParams: any,
    currentUser: User,
    commonExpenseDebts: CommonExpenseDebt[],
    parkingDebts: ParkingDebt[],
    tickets: Ticket[],
    notices: Notice[],
    amenities: Amenity[],
    reservations: Reservation[],
    financialStatements: FinancialStatement[],
    reserveFund: ReserveFund,
    unreadNoticesCount: number,
    theme: 'light' | 'dark',
    expenses: Expense[],
    handleNavigate: (page: Page, params?: any) => void,
    handleLogout: () => void,
    toggleTheme: () => void,
    addTicket: (data: any) => void,
    updateTicketStatus: (id: number, status: TicketStatus) => void,
    addReservation: (data: any) => boolean,
    cancelReservation: (id: number) => void,
    handleConfirmPayment: () => void,
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void,
}> = (props) => {
    const { page, pageParams, currentUser, commonExpenseDebts, parkingDebts, tickets, notices, amenities, reservations, financialStatements, reserveFund, unreadNoticesCount, theme, expenses, handleNavigate, handleLogout, toggleTheme, addTicket, updateTicketStatus, addReservation, cancelReservation, handleConfirmPayment, showToast } = props;
    
    const publishedNotices = useMemo(() => notices.filter(n => n.status === NoticeStatus.PUBLICADO), [notices]);

    const renderPage = () => {
        switch (page) {
            case 'home': return <HomeScreen user={currentUser} commonExpenseDebts={commonExpenseDebts} parkingDebts={parkingDebts} expenses={expenses} onNavigate={handleNavigate} showToast={showToast} />;
            case 'payments': return <PaymentsScreen commonExpenseDebts={commonExpenseDebts} parkingDebts={parkingDebts} onNavigate={handleNavigate}/>;
            case 'payment-method': return <PaymentMethodScreen params={pageParams} onNavigate={handleNavigate}/>;
            case 'payment-confirm': return <PaymentConfirmScreen params={pageParams} onConfirm={handleConfirmPayment} onNavigate={handleNavigate}/>;
            case 'payment-receipt': return <PaymentReceiptScreen params={pageParams} user={currentUser} onNavigate={handleNavigate} showToast={showToast}/>;
            case 'tickets': return <TicketsScreen tickets={tickets} onNavigate={handleNavigate} />;
            case 'ticket-detail': {
                const ticket = tickets.find(t => t.id === pageParams?.id);
                return ticket ? <TicketDetailScreen ticket={ticket} onUpdateStatus={updateTicketStatus} /> : <div>Ticket no encontrado</div>;
            }
            case 'ticket-create': return <CreateTicketScreen onAddTicket={addTicket} />;
            case 'notices': return <NoticesScreen notices={publishedNotices} onNavigate={handleNavigate} />;
            case 'notice-detail': {
                const notice = publishedNotices.find(n => n.id === pageParams?.id);
                return notice ? <NoticeDetailScreen notice={notice} showToast={showToast} /> : <div>Aviso no encontrado</div>;
            }
            case 'reservations': return <ReservationsScreen amenities={amenities} reservations={reservations} user={currentUser} onAddReservation={addReservation} onCancelReservation={cancelReservation} />;
            case 'profile': return <ProfileScreen user={currentUser} onLogout={handleLogout} onToggleTheme={toggleTheme} theme={theme} />;
            case 'more': return <MoreScreen onNavigate={handleNavigate} />;
            case 'financial-statements': return <FinancialStatementsScreen statements={financialStatements} showToast={showToast} />;
            case 'reserve-fund': return <ReserveFundScreen fund={reserveFund} />;
            case 'resident-expenses': return <ResidentExpensesScreen expenses={expenses} showToast={showToast} />;
            default: return <HomeScreen user={currentUser} commonExpenseDebts={commonExpenseDebts} parkingDebts={parkingDebts} expenses={expenses} onNavigate={handleNavigate} showToast={showToast} />;
        }
    };
    
    const getPageTitle = () => {
        switch (page) {
            case 'home': return `Bienvenido`;
            case 'payments': case 'payment-method': case 'payment-confirm': case 'payment-receipt': return 'Pagos';
            case 'tickets': return 'Mis Tickets';
            case 'ticket-detail': return 'Detalle del Ticket';
            case 'ticket-create': return 'Crear Ticket';
            case 'notices': return 'Avisos';
            case 'notice-detail': return 'Detalle del Aviso';
            case 'reservations': return 'Reservas';
            case 'profile': return 'Mi Perfil';
            case 'more': return 'Más Opciones';
            case 'financial-statements': return 'Rendición de Cuentas';
            case 'reserve-fund': return 'Fondo de Reserva';
            case 'resident-expenses': return 'Detalle de Gastos';
            default: return 'Condominio';
        }
    };
    
    const showHeader = page !== 'home';
    const onBackHandler = useMemo(() => {
        if (!showHeader) return undefined;
        const backMap: { [key in Page]?: Page } = {
            'payment-method': 'payments', 'payment-confirm': 'payment-method', 'ticket-detail': 'tickets',
            'ticket-create': 'tickets', 'notice-detail': 'notices', 'profile': 'more',
            'reservations': 'more', 'financial-statements': 'more', 'reserve-fund': 'more',
            'resident-expenses': 'home'
        };
        const backTarget = backMap[page];
        if (backTarget) return () => handleNavigate(backTarget);
        if (page === 'payment-receipt') return () => handleNavigate('home');
        return undefined;
    }, [page, showHeader, handleNavigate]);

    return (
        <div className="max-w-lg mx-auto bg-gray-100 dark:bg-gray-900 min-h-screen pb-24">
            {showHeader && <Header title={getPageTitle()} onBack={onBackHandler} />}
            <main>{renderPage()}</main>
            <ResidentTabBar currentPage={page} onNavigate={handleNavigate} unreadNotices={unreadNoticesCount} />
        </div>
    );
};


// --- ADMIN APP ---

const AdminTabBar: React.FC<{ currentPage: Page, onNavigate: (page: Page) => void }> = ({ currentPage, onNavigate }) => {
    const navItems = [
        { page: 'admin-dashboard', icon: 'speedometer', label: 'Dashboard' },
        { page: 'admin-units', icon: 'building-office', label: 'Unidades' },
        { page: 'admin-tickets', icon: 'ticket', label: 'Tickets' },
        { page: 'admin-notices', icon: 'bell', label: 'Avisos' },
        { page: 'admin-config', icon: 'cog-6-tooth', label: 'Config' },
    ];
    
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-20 md:hidden">
            <div className="flex justify-around">
                {navItems.map(item => {
                    const isActive = currentPage === item.page;
                    return (
                        <button
                            key={item.page}
                            onClick={() => onNavigate(item.page as Page)}
                            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-sm font-medium focus:outline-none transition-colors duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
                        >
                            <Icons name={item.icon} className="w-7 h-7" />
                            <span className="mt-1">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

const AdminSidebar: React.FC<{ currentPage: Page, onNavigate: (page: Page) => void, onLogout: () => void }> = ({ currentPage, onNavigate, onLogout }) => {
    const navItems = [
        { page: 'admin-dashboard', icon: 'speedometer', label: 'Dashboard' },
        { page: 'admin-units', icon: 'building-office', label: 'Unidades' },
        { page: 'admin-tickets', icon: 'ticket', label: 'Tickets' },
        { page: 'admin-notices', icon: 'bell', label: 'Avisos' },
        { page: 'admin-config', icon: 'cog-6-tooth', label: 'Configuración' },
    ];

    return (
        <aside className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Admin</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map(item => {
                    const isActive = currentPage === item.page;
                    return (
                        <button 
                            key={item.page} 
                            onClick={() => onNavigate(item.page as Page)}
                            className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            <Icons name={item.icon} className="w-5 h-5 mr-3" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    )
                })}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={onLogout} variant="secondary">Cerrar Sesión</Button>
            </div>
        </aside>
    );
};

const AdminDashboard: React.FC<{
    expenses: Expense[];
    onNavigate: (page: Page, params?: any) => void;
    onAddExpense: (expense: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>) => void;
    onApproveExpense: (id: number) => void;
    onRejectExpense: (id: number, motivo: string) => void;
    onCloseMonth: () => void;
}> = ({ expenses, onNavigate, onAddExpense, onApproveExpense, onRejectExpense, onCloseMonth }) => {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isRejectModalOpen, setRejectModalOpen] = useState<Expense | null>(null);

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

    const StatCard: React.FC<{ title: string, value: string | number, icon: string, colorClass: string }> = ({ title, value, icon, colorClass }) => (
        <Card className="flex items-center p-4">
            <div className={`p-3 rounded-full mr-4 ${colorClass}`}>
                <Icons name={icon} className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
        </Card>
    );

    return (
        <>
            <div className="p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Gasto Aprobado" value={formatCurrency(stats.totalApprovedAmount)} icon="cash" colorClass="bg-green-500" />
                    <StatCard title="En Revisión" value={stats.reviewCount} icon="hourglass" colorClass="bg-yellow-500" />
                    <StatCard title="Total Cargados" value={stats.totalExpensesCount} icon="receipt-long" colorClass="bg-blue-500" />
                    <StatCard title="% con Evidencia" value={`${stats.evidencePercentage.toFixed(0)}%`} icon="document-check" colorClass="bg-indigo-500" />
                </div>
                
                <Card>
                     <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <h2 className="text-xl font-bold">Acciones del Mes</h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                             <Button
                               onClick={() => setCreateModalOpen(true)}
                               variant="secondary"
                               className="!w-auto flex-1"
                               aria-label="Agregar gasto"          // 👈 alias accesible
                               data-testid="add-expense"           // 👈 testid
                             >
                                 <div className="flex items-center justify-center"><Icons name="plus" className="w-5 h-5 mr-2" /> Cargar Gasto</div>
                             </Button>
                             <Button
                               onClick={onCloseMonth}
                               className="!w-auto flex-1"
                               disabled={stats.reviewCount > 0 || expenses.filter(e => e.status === ExpenseStatus.APROBADO).length === 0}
                               data-testid="btn-publicar"          // 👈 usado por el spec
                             >
                                 <div className="flex items-center justify-center"><Icons name="lock-closed" className="w-5 h-5 mr-2" /> Cerrar Mes</div>
                             </Button>
                             <Button onClick={() => onNavigate('admin-notice-create')} variant="secondary" className="!w-auto flex-1">
                                 <div className="flex items-center justify-center"><Icons name="pencil" className="w-5 h-5 mr-2" /> Crear Aviso</div>
                             </Button>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-xl font-bold mb-4">Cola de Aprobación</h2>
                     {expensesToReview.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {expensesToReview.map(expense => (
                                <li key={expense.id} className="py-3 px-1">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800 dark:text-white">{expense.descripcion}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {expense.proveedor || 'S/P'} - {expense.numeroDocumento || 'S/D'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {expense.categoria} - {new Date(expense.fecha).toLocaleDateString('es-CL')}
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="font-bold text-lg">{formatCurrency(expense.monto)}</p>
                                            {expense.evidenciaUrl ? (
                                                <a href={expense.evidenciaUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 dark:text-blue-400">Ver Evidencia</a>
                                            ) : (
                                                <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Sin Evidencia</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end gap-2">
                                        <Button onClick={() => setRejectModalOpen(expense)} variant="danger" className="!w-auto !py-1.5 !px-3 !text-sm">
                                            <div className="flex items-center"><Icons name="x-circle" className="w-4 h-4 mr-1"/> Rechazar</div>
                                        </Button>
                                        <Button onClick={() => onApproveExpense(expense.id)} className="!w-auto !py-1.5 !px-3 !text-sm">
                                            <div className="flex items-center"><Icons name="check" className="w-4 h-4 mr-1"/> Aprobar</div>
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                     ) : (
                        <p className="text-gray-600 dark:text-gray-400 text-center py-4">No hay gastos pendientes de revisión.</p>
                     )}
                </Card>
            </div>
            {isCreateModalOpen && (
                <AdminCreateExpenseModal 
                    onClose={() => setCreateModalOpen(false)} 
                    onAddExpense={(data) => {
                        onAddExpense(data);
                        setCreateModalOpen(false);
                    }} 
                />
            )}
            {isRejectModalOpen && (
                 <AdminRejectExpenseModal 
                    expense={isRejectModalOpen}
                    onClose={() => setRejectModalOpen(null)}
                    onReject={(id, motivo) => {
                        onRejectExpense(id, motivo);
                        setRejectModalOpen(null);
                    }}
                 />
            )}
        </>
    );
};

const AdminCreateExpenseModal: React.FC<{ 
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>) => void 
}> = ({ onClose, onAddExpense }) => {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState<ExpenseCategory>(ExpenseCategory.OTROS);
  const [proveedor, setProveedor] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [fecha, setFecha] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`; // YYYY-MM-DD
  });

  // Adjuntos
  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null);
  const [fileTooLarge, setFileTooLarge] = useState(false);
  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setEvidenciaFile(f || null);
    setFileTooLarge(!!f && f.size > MAX_BYTES);
  };

  // Validaciones
  const isFutureDate = useMemo(() => {
    if (!fecha) return false;
    const selected = new Date(fecha + 'T00:00:00');
    const today = new Date();
    // normaliza "hoy" a 00:00 para comparar solo fechas
    today.setHours(0, 0, 0, 0);
    return selected.getTime() > today.getTime();
  }, [fecha]);

  const isInvalid = fileTooLarge || isFutureDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseInt(monto, 10);

    if (isInvalid) return; // bloquea envío si hay errores
    if (!(descripcion.trim() && !isNaN(montoNum) && montoNum > 0)) return;

    onAddExpense({
      descripcion,
      monto: montoNum,
      categoria,
      proveedor,
      numeroDocumento,
      // No guardamos la fecha ni el binario en el "db" mock;
      // el test solo exige que validemos y bloqueemos.
      evidenciaUrl: evidenciaFile ? '#' : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cargar Nuevo Gasto</h2>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
              <input id="descripcion" data-testid="input-descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} required className="mt-1 block w-full input-field" />
            </div>

            <div>
              <label htmlFor="monto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto (CLP)</label>
              <input id="monto" type="number" data-testid="input-monto" value={monto} onChange={e => setMonto(e.target.value)} required className="mt-1 block w-full input-field" />
            </div>

            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
              <select id="categoria" data-testid="select-categoria" value={categoria} onChange={e => setCategoria(e.target.value as ExpenseCategory)} className="mt-1 block w-full input-field">
                {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="proveedor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proveedor</label>
                <input id="proveedor" data-testid="input-proveedor" value={proveedor} onChange={e => setProveedor(e.target.value)} className="mt-1 block w-full input-field" />
              </div>
              <div>
                <label htmlFor="numeroDocumento" className="block text-sm font-medium text-gray-700 dark:text-gray-300">N° Documento</label>
                <input id="numeroDocumento" data-testid="input-documento" value={numeroDocumento} onChange={e => setNumeroDocumento(e.target.value)} className="mt-1 block w-full input-field" />
              </div>
            </div>

            {/* Fecha del gasto (solo para validar; no se persiste en el mock) */}
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha del gasto</label>
              <input
                id="fecha"
                type="date"
                data-testid="input-fecha"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="mt-1 block w-full input-field"
              />
              {isFutureDate && (
                <p className="mt-1 text-sm text-red-600" data-testid="error-fecha">
                  La fecha no puede ser futura.
                </p>
              )}
            </div>

            {/* Evidencia (valida tamaño > 5 MB) */}
            <div>
              <label htmlFor="evidencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adjuntar evidencia (PDF/JPG/PNG, máx. 5 MB)</label>
              <input
                id="evidencia"
                type="file"
                accept=".pdf,image/*"
                data-testid="input-evidencia"
                onChange={onPickFile}
                className="mt-1 block w-full text-sm text-gray-700 dark:text-gray-300"
              />
              {fileTooLarge && (
                <p className="mt-1 text-sm text-red-600" data-testid="error-evidencia">
                  El archivo excede 5 MB. Por favor, adjunta uno más liviano.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isInvalid}>
              Enviar a Revisión
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const AdminCreateExpenseModal: React.FC<{ 
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>) => void 
}> = ({ onClose, onAddExpense }) => {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState<ExpenseCategory>(ExpenseCategory.OTROS);
  const [proveedor, setProveedor] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [fecha, setFecha] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`; // YYYY-MM-DD
  });

  // Adjuntos
  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null);
  const [fileTooLarge, setFileTooLarge] = useState(false);
  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setEvidenciaFile(f || null);
    setFileTooLarge(!!f && f.size > MAX_BYTES);
  };

  // Validaciones
  const isFutureDate = useMemo(() => {
    if (!fecha) return false;
    const selected = new Date(fecha + 'T00:00:00');
    const today = new Date();
    // normaliza "hoy" a 00:00 para comparar solo fechas
    today.setHours(0, 0, 0, 0);
    return selected.getTime() > today.getTime();
  }, [fecha]);

  const isInvalid = fileTooLarge || isFutureDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseInt(monto, 10);

    if (isInvalid) return; // bloquea envío si hay errores
    if (!(descripcion.trim() && !isNaN(montoNum) && montoNum > 0)) return;

    onAddExpense({
      descripcion,
      monto: montoNum,
      categoria,
      proveedor,
      numeroDocumento,
      // No guardamos la fecha ni el binario en el "db" mock;
      // el test solo exige que validemos y bloqueemos.
      evidenciaUrl: evidenciaFile ? '#' : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cargar Nuevo Gasto</h2>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
              <input id="descripcion" data-testid="input-descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} required className="mt-1 block w-full input-field" />
            </div>

            <div>
              <label htmlFor="monto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto (CLP)</label>
              <input id="monto" type="number" data-testid="input-monto" value={monto} onChange={e => setMonto(e.target.value)} required className="mt-1 block w-full input-field" />
            </div>

            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
              <select id="categoria" data-testid="select-categoria" value={categoria} onChange={e => setCategoria(e.target.value as ExpenseCategory)} className="mt-1 block w-full input-field">
                {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="proveedor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proveedor</label>
                <input id="proveedor" data-testid="input-proveedor" value={proveedor} onChange={e => setProveedor(e.target.value)} className="mt-1 block w-full input-field" />
              </div>
              <div>
                <label htmlFor="numeroDocumento" className="block text-sm font-medium text-gray-700 dark:text-gray-300">N° Documento</label>
                <input id="numeroDocumento" data-testid="input-documento" value={numeroDocumento} onChange={e => setNumeroDocumento(e.target.value)} className="mt-1 block w-full input-field" />
              </div>
            </div>

            {/* Fecha del gasto (solo para validar; no se persiste en el mock) */}
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha del gasto</label>
              <input
                id="fecha"
                type="date"
                data-testid="input-fecha"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="mt-1 block w-full input-field"
              />
              {isFutureDate && (
                <p className="mt-1 text-sm text-red-600" data-testid="error-fecha">
                  La fecha no puede ser futura.
                </p>
              )}
            </div>

            {/* Evidencia (valida tamaño > 5 MB) */}
            <div>
              <label htmlFor="evidencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adjuntar evidencia (PDF/JPG/PNG, máx. 5 MB)</label>
              <input
                id="evidencia"
                type="file"
                accept=".pdf,image/*"
                data-testid="input-evidencia"
                onChange={onPickFile}
                className="mt-1 block w-full text-sm text-gray-700 dark:text-gray-300"
              />
              {fileTooLarge && (
                <p className="mt-1 text-sm text-red-600" data-testid="error-evidencia">
                  El archivo excede 5 MB. Por favor, adjunta uno más liviano.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isInvalid}>
              Enviar a Revisión
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};


const AdminTicketsScreen: React.FC<{ tickets: Ticket[], onNavigate: (page: Page, params?: any) => void }> = ({ tickets, onNavigate }) => {
    const [filter, setFilter] = useState<TicketStatus | 'TODOS'>('TODOS');
    const filteredTickets = tickets.filter(t => filter === 'TODOS' || t.estado === filter);
    
    return (
        <div className="p-4 md:p-6 space-y-4">
             <div className="flex space-x-2 overflow-x-auto pb-2">
                {(['TODOS', ...Object.values(TicketStatus)] as const).map(status => (
                    <button 
                        key={status} 
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap ${filter === status ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>
            <div className="space-y-4">
                {filteredTickets.map(ticket => (
                    <button key={ticket.id} onClick={() => onNavigate('admin-ticket-detail', { id: ticket.id })} className="w-full text-left">
                        <Card className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex justify_between items-start gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.user?.nombre} ({ticket.user?.unidad})</p>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text_WHITE">{ticket.titulo}</h3>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${getStatusColors(ticket.estado)}`}>{ticket.estado}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{new Date(ticket.fecha).toLocaleDateString('es-CL')}</p>
                        </Card>
                    </button>
                ))}
            </div>
        </div>
    );
};

const AdminTicketDetailScreen: React.FC<{ ticket: Ticket, onUpdateStatus: (id: number, status: TicketStatus) => void }> = ({ ticket, onUpdateStatus }) => {
    const [newStatus, setNewStatus] = useState(ticket.estado);

    return (
        <div className="p-4 md:p-6 space-y-4">
            <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400">De: {ticket.user?.nombre} ({ticket.user?.unidad})</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ticket #{ticket.id} - {new Date(ticket.fecha).toLocaleDateString('es-CL')}</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{ticket.titulo}</h2>
                <p className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.descripcion}</p>
                {ticket.foto && (
                    <div className="mt-4">
                        <p className="font-semibold mb-2">Foto adjunta:</p>
                        <img src={ticket.foto} alt="Adjunto del ticket" className="rounded-lg max-w-full h-auto" />
                    </div>
                )}
            </Card>
            <Card>
                 <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cambiar Estado</label>
                 <select 
                    id="status-select" 
                    value={newStatus} 
                    onChange={e => setNewStatus(e.target.value as TicketStatus)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                 >
                     {Object.values(TicketStatus).map(status => <option key={status} value={status}>{status}</option>)}
                 </select>
                 <Button onClick={() => onUpdateStatus(ticket.id, newStatus)} className="mt-4" disabled={newStatus === ticket.estado}>
                     Actualizar Estado
                 </Button>
            </Card>
        </div>
    );
};

const AdminNoticesScreen: React.FC<{ notices: Notice[], onNavigate: (page: Page, params?: any) => void }> = ({ notices, onNavigate }) => {
    const getStatusColors = (status: NoticeStatus) => {
        return status === NoticeStatus.PUBLICADO
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    };

    return (
        <div className="p-4 md:p-6 space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => onNavigate('admin-notice-create')} className="!w-auto">
                     <div className="flex items-center"><Icons name="plus" className="w-5 h-5 mr-2" /> Crear Aviso</div>
                </Button>
            </div>
            <Card>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notices.map(notice => (
                        <li key={notice.id}>
                            <button onClick={() => onNavigate('admin-notice-detail', { id: notice.id })} className="w-full text-left py-3 px-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{notice.titulo}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{notice.tipo} - {new Date(notice.fecha).toLocaleDateString('es-CL')}</p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${getStatusColors(notice.status)}`}>
                                        {notice.status}
                                    </span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};

const AdminNoticeDetailScreen: React.FC<{ notice: Notice, onApprove: (id: number) => void }> = ({ notice, onApprove }) => {
    return (
        <div className="p-4 md:p-6 space-y-4">
            <Card>
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{notice.titulo}</h2>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                        notice.status === NoticeStatus.PUBLICADO
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                        {notice.status}
                    </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notice.tipo} - Publicado el {new Date(notice.fecha).toLocaleDateString('es-CL')}</p>
                <hr className="my-4 border-gray-200 dark:border-gray-700"/>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{notice.contenido}</p>
            </Card>
            {notice.status === NoticeStatus.BORRADOR && (
                <Button onClick={() => onApprove(notice.id)}>
                    Aprobar y Publicar
                </Button>
            )}
        </div>
    );
};

const AdminCreateNoticeScreen: React.FC<{ onAddNotice: (notice: Omit<Notice, 'id' | 'fecha' | 'leido' | 'status'>) => void }> = ({ onAddNotice }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<NoticeType>(NoticeType.COMUNIDAD);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && content.trim()) {
            onAddNotice({ titulo: title, contenido: content, tipo: type });
        }
    };
    
    return (
        <div className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <div>
                        <label htmlFor="title" className="block text_sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                     <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Aviso</label>
                        <select id="type" value={type} onChange={e => setType(e.target.value as NoticeType)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            {Object.values(NoticeType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contenido</label>
                        <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={8} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                </Card>
                <Button type="submit">Guardar como Borrador</Button>
            </form>
        </div>
    );
};

const AdminUnitsScreen: React.FC<{ 
    users: User[]; 
    onNavigate: (page: Page, params?: any) => void;
    onDeleteUser: (id: number) => void;
}> = ({ users, onNavigate, onDeleteUser }) => {
    const residents = users.filter(u => u.role === 'resident');
    const [menuOpen, setMenuOpen] = useState<number | null>(null);

    const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
        e.stopPropagation();
        setMenuOpen(prev => (prev === id ? null : id));
    };
    
    useEffect(() => {
        const closeMenu = () => setMenuOpen(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    return (
        <div className="relative min-h-full" onClick={() => setMenuOpen(null)}>
            <div className="p-4 md:p-6 space-y-4">
                {residents.map(resident => (
                    <button key={resident.id} onClick={() => onNavigate('admin-unit-detail', { id: resident.id })} className="w-full text-left">
                        <Card className="relative hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{resident.unidad}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">{resident.nombre}</p>
                                    {resident.email && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{resident.email}</p>
                                    )}
                                </div>
                                <div className="text-right flex items-start">
                                    <div className="mr-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">G. Común: <span className="font-semibold text-green-600 dark:text-green-400">Sí</span></p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Estacionam.: {
                                            resident.hasParking 
                                            ? <span className="font-semibold text-green-600 dark:text-green-400">Sí</span>
                                            : <span className="font-semibold text-red-600 dark:text-red-400">No</span>
                                        }</p>
                                    </div>
                                    <button onClick={(e) => toggleMenu(e, resident.id)} className="p-1 -mr-1 -mt-1 rounded_full hover:bg-gray-200 dark:hover:bg-gray-700 z-10">
                                        <Icons name="ellipsis-vertical" className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                    </button>
                                </div>
                            </div>
                            {menuOpen === resident.id && (
                                <div className="absolute top-10 right-4 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                                    <ul className="py-1">
                                        <li>
                                            <button onClick={() => { onNavigate('admin-unit-edit', { id: resident.id }); setMenuOpen(null); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <Icons name="pencil" className="w-5 h-5 mr-3" /> Editar
                                            </button>
                                        </li>
                                        <li>
                                            <button onClick={() => { onDeleteUser(resident.id); setMenuOpen(null); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <Icons name="trash" className="w-5 h-5 mr-3" /> Eliminar
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </Card>
                    </button>
                ))}
            </div>
             <div className="fixed bottom-24 right-4 z-10 md:bottom-6 md:right-6">
                <button 
                    onClick={() => onNavigate('admin-unit-create')} 
                    className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    aria-label="Añadir nueva unidad"
                >
                    <Icons name="plus" className="w-8 h-8"/>
                </button>
            </div>
        </div>
    )
};

const AdminCreateUnitScreen: React.FC<{ onAddUser: (user: Omit<User, 'id' | 'role'>) => void }> = ({ onAddUser }) => {
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
        <div className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="unidad" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unidad (Ej: A-101, B-302)</label>
                            <input type="text" id="unidad" value={unidad} onChange={e => setUnidad(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo del Residente</label>
                            <input type="text" id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required className="mt-1 block w_full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                         <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">¿Tiene estacionamiento?</span>
                            <label htmlFor="hasParkingToggle" className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="hasParkingToggle" className="sr-only peer" checked={hasParking} onChange={() => setHasParking(!hasParking)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </Card>
                <Button type="submit">Guardar Unidad</Button>
            </form>
        </div>
    );
};

const AdminEditUnitScreen: React.FC<{ 
    user: User;
    onUpdateUser: (id: number, data: Partial<Pick<User, 'nombre' | 'hasParking' | 'email'>>) => void;
}> = ({ user, onUpdateUser }) => {
    const [nombre, setNombre] = useState(user.nombre);
    const [email, setEmail] = useState(user.email || '');
    const [hasParking, setHasParking] = useState(user.hasParking);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nombre.trim()) {
            onUpdateUser(user.id, { nombre, hasParking, email });
        }
    };

    return (
        <div className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="unidad" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unidad</label>
                            <input type="text" id="unidad" value={user.unidad} disabled className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo del Residente</label>
                            <input type="text" id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                         <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">¿Tiene estacionamiento?</span>
                            <label htmlFor="hasParkingToggle" className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="hasParkingToggle" className="sr-only peer" checked={hasParking} onChange={() => setHasParking(!hasParking)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </Card>
                <Button type="submit">Actualizar Unidad</Button>
            </form>
        </div>
    );
};

const AdminUnitDetailScreen: React.FC<{
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

const AdminSettingsScreen: React.FC<{
    settings: CommunitySettings;
    onUpdateSettings: (settings: CommunitySettings) => void;
}> = ({ settings, onUpdateSettings }) => {
    const [commonExpense, setCommonExpense] = useState(settings.commonExpense.toString());
    const [parkingCost, setParkingCost] = useState(settings.parkingCost.toString());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const commonExpenseNum = parseInt(commonExpense, 10);
        const parkingCostNum = parseInt(parkingCost, 10);
        if (!isNaN(commonExpenseNum) && !isNaN(parkingCostNum)) {
            onUpdateSettings({ commonExpense: commonExpenseNum, parkingCost: parkingCostNum });
        }
    };

    return (
        <div className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="commonExpense" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gasto Común Fijo Mensual (CLP)</label>
                            <input type="number" id="commonExpense" value={commonExpense} onChange={e => setCommonExpense(e.target.value)} required className="mt-1 block w-full input-field" />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Este monto se usará para generar la deuda de gasto común para las nuevas unidades.</p>
                        </div>
                        <div>
                            <label htmlFor="parkingCost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Costo Estacionamiento Mensual (CLP)</label>
                            <input type="number" id="parkingCost" value={parkingCost} onChange={e => setParkingCost(e.target.value)} required className="mt-1 block w-full input-field" />
                             <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Este monto se usará para generar la deuda de estacionamiento para las nuevas unidades que lo tengan asignado.</p>
                        </div>
                    </div>
                </Card>
                <Button type="submit">Guardar Cambios</Button>
            </form>
        </div>
    )
}

const AdminApp: React.FC<{
    page: Page,
    pageParams: any,
    currentUser: User,
    users: User[],
    tickets: Ticket[],
    notices: Notice[],
    expenses: Expense[],
    settings: CommunitySettings,
    paymentHistory: PaymentRecord[],
    commonExpenseDebts: CommonExpenseDebt[];
    parkingDebts: ParkingDebt[];
    handleNavigate: (page: Page, params?: any) => void,
    handleLogout: () => void,
    updateTicketStatus: (id: number, status: TicketStatus) => void,
    addNotice: (data: Omit<Notice, 'id' | 'fecha' | 'leido' | 'status'>) => void,
    approveNotice: (id: number) => void,
    addUser: (data: Omit<User, 'id' | 'role'>) => void;
    updateUser: (id: number, data: Partial<Pick<User, 'nombre' | 'hasParking' | 'email'>>) => void;
    deleteUser: (id: number) => void;
    addExpense: (data: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>) => void;
    approveExpense: (id: number) => void;
    rejectExpense: (id: number, motivo: string) => void;
    closeMonth: () => void;
    updateSettings: (settings: CommunitySettings) => void;
}> = (props) => {
    const { page, pageParams, users, tickets, notices, expenses, settings, paymentHistory, commonExpenseDebts, parkingDebts, handleNavigate, handleLogout, updateTicketStatus, addNotice, approveNotice, addUser, updateUser, deleteUser, addExpense, approveExpense, rejectExpense, closeMonth, updateSettings } = props;

     const renderPage = () => {
        switch (page) {
            case 'admin-dashboard': return <AdminDashboard expenses={expenses} onNavigate={handleNavigate} onAddExpense={addExpense} onApproveExpense={approveExpense} onRejectExpense={rejectExpense} onCloseMonth={closeMonth} />;
            case 'admin-tickets': return <AdminTicketsScreen tickets={tickets} onNavigate={handleNavigate} />;
            case 'admin-ticket-detail': {
                const ticket = tickets.find(t => t.id === pageParams?.id);
                return ticket ? <AdminTicketDetailScreen ticket={ticket} onUpdateStatus={updateTicketStatus} /> : <div>Ticket no encontrado</div>;
            }
            case 'admin-notices': return <AdminNoticesScreen notices={notices} onNavigate={handleNavigate} />;
            case 'admin-notice-create': return <AdminCreateNoticeScreen onAddNotice={addNotice} />;
            case 'admin-notice-detail': {
                const notice = notices.find(n => n.id === pageParams?.id);
                return notice ? <AdminNoticeDetailScreen notice={notice} onApprove={approveNotice} /> : <div>Aviso no encontrado</div>;
            }
            case 'admin-units': return <AdminUnitsScreen users={users} onNavigate={handleNavigate} onDeleteUser={deleteUser} />;
            case 'admin-unit-create': return <AdminCreateUnitScreen onAddUser={addUser} />;
            case 'admin-unit-edit': {
                const userToEdit = users.find(u => u.id === pageParams?.id);
                return userToEdit ? <AdminEditUnitScreen user={userToEdit} onUpdateUser={updateUser} /> : <div>Usuario no encontrado</div>;
            }
             case 'admin-unit-detail': {
                const user = users.find(u => u.id === pageParams?.id);
                const userPaymentHistory = paymentHistory.filter(p => p.userId === pageParams?.id);
                return user ? <AdminUnitDetailScreen user={user} paymentHistory={userPaymentHistory} commonExpenseDebts={commonExpenseDebts} parkingDebts={parkingDebts} /> : <div>Usuario no encontrado</div>;
            }
            case 'admin-config': return <AdminSettingsScreen settings={settings} onUpdateSettings={updateSettings} />;
            default: return <AdminDashboard expenses={expenses} onNavigate={handleNavigate} onAddExpense={addExpense} onApproveExpense={approveExpense} onRejectExpense={rejectExpense} onCloseMonth={closeMonth} />;
        }
    };
    
    const getPageTitle = () => {
        switch (page) {
            case 'admin-dashboard': return 'Dashboard';
            case 'admin-tickets': return 'Gestionar Tickets';
            case 'admin-ticket-detail': return 'Detalle del Ticket';
            case 'admin-notices': return 'Gestionar Avisos';
            case 'admin-notice-create': return 'Crear Aviso';
            case 'admin-notice-detail': return 'Detalle de Aviso';
            case 'admin-units': return 'Gestionar Unidades';
            case 'admin-unit-create': return 'Añadir Nueva Unidad';
            case 'admin-unit-edit': return 'Editar Unidad';
            case 'admin-unit-detail': return 'Detalle de Unidad';
            case 'admin-config': return 'Configuración';
            default: return 'Admin Panel';
        }
    };

    const onBackHandler = useMemo(() => {
        const backMap: { [key in Page]?: Page } = {
            'admin-ticket-detail': 'admin-tickets',
            'admin-notice-create': 'admin-notices',
            'admin-notice-detail': 'admin-notices',
            'admin-unit-create': 'admin-units',
            'admin-unit-edit': 'admin-units',
            'admin-unit-detail': 'admin-units',
        };
        const backTarget = backMap[page];
        if (backTarget) return () => handleNavigate(backTarget);
        return undefined;
    }, [page, handleNavigate]);

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <AdminSidebar currentPage={page} onNavigate={handleNavigate} onLogout={handleLogout} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="md:hidden">
                    <Header title={getPageTitle()} onBack={onBackHandler} onLogout={handleLogout} />
                </div>
                <main className="flex-1 overflow-x-hidden overflow-y-auto pb-24 md:pb-0">
                    {renderPage()}
                </main>
                <AdminTabBar currentPage={page} onNavigate={handleNavigate} />
            </div>
        </div>
    );
};

// --- Main App Component ---

function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState<Page>('login');
    const [pageParams, setPageParams] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number } | null>(null);


    // Data states
    const [users, setUsers] = useState<User[]>([]);
    const [commonExpenseDebts, setCommonExpenseDebts] = useState<CommonExpenseDebt[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [parkingDebts, setParkingDebts] = useState<ParkingDebt[]>([]);
    const [financialStatements, setFinancialStatements] = useState<FinancialStatement[]>([]);
    const [reserveFund, setReserveFund] = useState<ReserveFund | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [settings, setSettings] = useState<CommunitySettings | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Date.now();
        setToast({ message, type, id });
        setTimeout(() => setToast(current => (current?.id === id ? null : current)), 3000);
    };

    const loadData = useCallback((user?: User) => {
        setUsers(db.getUsers());
        setNotices(db.getNotices());
        setAmenities(db.getAmenities());
        setReservations(db.getReservations());
        setFinancialStatements(db.getFinancialStatements());
        setReserveFund(db.getReserveFund());
        setExpenses(db.getExpenses());
        setSettings(db.getCommunitySettings());
        
        if (user?.role === 'resident') {
            setCommonExpenseDebts(db.getCommonExpenseDebts(user.id));
            setParkingDebts(db.getParkingDebts(user.id));
            setTickets(db.getTickets(user.id));
            setPaymentHistory(db.getPaymentHistory(user.id));
        } else if (user?.role === 'admin') {
             setTickets(db.getTickets()); // Admin gets all tickets
             setPaymentHistory(db.getPaymentHistory()); // Admin can see all history
             setCommonExpenseDebts(db.getCommonExpenseDebts());
             setParkingDebts(db.getParkingDebts());
        } else {
            // Initial load before login, load all for potential admin login
            setCommonExpenseDebts(db.getCommonExpenseDebts());
            setParkingDebts(db.getParkingDebts());
        }
    }, []);

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        document.documentElement.classList.toggle('dark', initialTheme === 'dark');
        
        loadData();
        setIsLoading(false);
    }, [loadData]);

    const handleNavigate = (newPage: Page, params: any = null) => {
        window.scrollTo(0, 0);
        setPage(newPage);
        setPageParams(params);
        if(currentUser?.role === 'resident' && newPage === 'notice-detail' && params?.id) {
            db.markNoticeAsRead(params.id);
            setNotices(db.getNotices());
        }
    };

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        loadData(user);
        const startPage = user.role === 'admin' ? 'admin-dashboard' : 'home';
        handleNavigate(startPage);
    };
    
    const handleLogout = () => {
        setCurrentUser(null);
        db.resetData();
        loadData();
        handleNavigate('login');
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };
    
    const unreadNoticesCount = useMemo(() => notices.filter(n => !n.leido && n.status === NoticeStatus.PUBLICADO).length, [notices]);

    // Data handlers
    const addTicket = (ticketData: { titulo: string; descripcion: string; foto?: string; }) => {
        if(currentUser){
            // FIX: Pass the required 'estado' property to db.addTicket.
            db.addTicket({ ...ticketData, estado: TicketStatus.NUEVO }, currentUser);
            setTickets(db.getTickets(currentUser.id));
            handleNavigate('tickets');
            showToast('Ticket creado exitosamente.');
        }
    };

    const updateTicketStatus = (id: number, status: TicketStatus) => {
        db.updateTicketStatus(id, status);
        const userFilter = currentUser?.role === 'resident' ? currentUser.id : undefined;
        setTickets(db.getTickets(userFilter));
        const backPage = currentUser?.role === 'admin' ? 'admin-tickets' : 'tickets';
        handleNavigate(backPage);
        showToast('Estado del ticket actualizado.');
    };

    const addReservation = (resData: Omit<Reservation, 'id'>) => {
        const result = db.addReservation(resData);
        if (result) {
            setReservations(db.getReservations());
            showToast('Reserva creada exitosamente');
            return true;
        } else {
            showToast('Error: El horario ya está ocupado.', 'error');
            return false;
        }
    };

    const cancelReservation = (id: number) => {
        db.cancelReservation(id);
        setReservations(db.getReservations());
        showToast('Reserva cancelada');
    };

    const handleConfirmPayment = () => {
        if(currentUser) {
            db.payAllDebts(currentUser.id);
            loadData(currentUser);
            handleNavigate('payment-receipt', pageParams);
        }
    }
    
    const addNotice = (noticeData: Omit<Notice, 'id' | 'fecha' | 'leido' | 'status'>) => {
        db.createNotice(noticeData);
        setNotices(db.getNotices());
        handleNavigate('admin-notices');
        showToast('Aviso guardado como borrador.');
    };

    const approveNotice = (id: number) => {
        db.updateNoticeStatus(id, NoticeStatus.PUBLICADO);
        setNotices(db.getNotices());
        handleNavigate('admin-notices');
        showToast('Aviso publicado exitosamente.');
    };

    const addUser = (userData: Omit<User, 'id' | 'role'>) => {
        db.addUser(userData);
        loadData(currentUser || undefined); // Recargar todos los datos
        handleNavigate('admin-units');
        showToast('Unidad añadida exitosamente.');
    };

    const handleUpdateUser = (id: number, data: Partial<Pick<User, 'nombre' | 'hasParking' | 'email'>>) => {
        db.updateUser(id, data);
        setUsers(db.getUsers());
        handleNavigate('admin-units');
        showToast('Unidad actualizada exitosamente.');
    };

    const handleDeleteUser = (id: number) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta unidad? Esta acción no se puede deshacer.')) {
            db.deleteUser(id);
            setUsers(db.getUsers());
            showToast('Unidad eliminada.');
        }
    };

    const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>) => {
        db.addExpense(expenseData);
        setExpenses(db.getExpenses());
        showToast('Gasto enviado a revisión.');
    };

    const handleApproveExpense = (id: number) => {
        db.approveExpense(id);
        setExpenses(db.getExpenses());
        showToast('Gasto aprobado.');
    };

    const handleRejectExpense = (id: number, motivo: string) => {
        db.rejectExpense(id, motivo);
        setExpenses(db.getExpenses());
        showToast('Gasto rechazado.', 'info');
    }

    const handleCloseMonth = () => {
        if (window.confirm('¿Estás seguro de cerrar el mes? Esta acción generará un nuevo informe financiero con los gastos aprobados y no se puede deshacer.')) {
            const newStatement = db.closeMonthAndGenerateStatement();
            if (newStatement) {
                setExpenses(db.getExpenses());
                setFinancialStatements(db.getFinancialStatements());
                showToast(`Informe de ${newStatement.mes} generado exitosamente.`);
            } else {
                showToast('No hay gastos aprobados para cerrar el mes.', 'error');
            }
        }
    };

    const handleUpdateSettings = (newSettings: CommunitySettings) => {
        db.updateCommunitySettings(newSettings);
        setSettings(db.getCommunitySettings());
        showToast('Configuración guardada exitosamente.');
    };

    if (isLoading || !reserveFund || !settings) {
        return <div className="p-4 space-y-4"><SkeletonLoader className="h-24 w-full"/><SkeletonLoader className="h-48 w-full"/></div>
    }

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {!currentUser ? (
                <LoginScreen onLogin={handleLogin} users={users} />
            ) : currentUser.role === 'admin' ? (
                <AdminApp 
                    page={page}
                    pageParams={pageParams}
                    currentUser={currentUser}
                    users={users}
                    tickets={tickets}
                    notices={notices}
                    expenses={expenses}
                    settings={settings}
                    paymentHistory={paymentHistory}
                    commonExpenseDebts={commonExpenseDebts}
                    parkingDebts={parkingDebts}
                    handleNavigate={handleNavigate}
                    handleLogout={handleLogout}
                    updateTicketStatus={updateTicketStatus}
                    addNotice={addNotice}
                    approveNotice={approveNotice}
                    addUser={addUser}
                    updateUser={handleUpdateUser}
                    deleteUser={handleDeleteUser}
                    addExpense={handleAddExpense}
                    approveExpense={handleApproveExpense}
                    rejectExpense={handleRejectExpense}
                    closeMonth={handleCloseMonth}
                    updateSettings={handleUpdateSettings}
                />
            ) : (
                 <ResidentApp 
                    page={page}
                    pageParams={pageParams}
                    currentUser={currentUser}
                    commonExpenseDebts={commonExpenseDebts}
                    parkingDebts={parkingDebts}
                    tickets={tickets}
                    notices={notices.filter(n => n.status === NoticeStatus.PUBLICADO)}
                    amenities={amenities}
                    reservations={reservations}
                    financialStatements={financialStatements}
                    reserveFund={reserveFund}
                    unreadNoticesCount={unreadNoticesCount}
                    theme={theme}
                    expenses={expenses}
                    handleNavigate={handleNavigate}
                    handleLogout={handleLogout}
                    toggleTheme={toggleTheme}
                    addTicket={addTicket}
                    updateTicketStatus={updateTicketStatus}
                    addReservation={addReservation}
                    cancelReservation={cancelReservation}
                    handleConfirmPayment={handleConfirmPayment}
                    showToast={showToast}
                />
            )}
        </>
    );
}

export default App;
