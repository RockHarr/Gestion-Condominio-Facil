import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { User, Ticket, Notice, Reservation, Amenity, Page, ParkingDebt, FinancialStatement, ReserveFund, PaymentRecord, CommonExpenseDebt, Expense, CommunitySettings } from './types';
import { TicketStatus, NoticeType, NoticeStatus, ExpenseStatus } from './types';
import { db } from './data';
import { SkeletonLoader } from './components/common/SkeletonLoader';
import { Toast } from './components/common/Toast';
import { LoginScreen } from './screens/LoginScreen';
import { ResidentApp } from './screens/resident/ResidentApp';
import { AdminApp } from './screens/admin/AdminApp';

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
