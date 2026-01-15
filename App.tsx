import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { User, Ticket, Notice, Reservation, Amenity, Page, ParkingDebt, FinancialStatement, ReserveFund, PaymentRecord, CommonExpenseDebt, Expense, CommunitySettings } from './types';
import { TicketStatus, NoticeStatus, ExpenseStatus } from './types';
import { db } from './data'; // Keeping for fallback/admin methods not yet migrated
import { authService } from './services/auth';
import { dataService } from './services/data';
import { SkeletonLoader, Toast, Button } from './components/Shared';
import Icons from './components/Icons';
import { LoginScreen } from './components/LoginScreen';
import { ResidentApp } from './components/ResidentApp';
import { AdminApp } from './components/AdminApp';
import { AdminReservationsInbox } from './components/AdminReservationsInbox';
import { AdminPollsManager } from './components/AdminPollsManager';

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

    const loadData = useCallback(async (user?: User) => {
        const safeFetch = async <T extends unknown>(promise: Promise<T>, fallback: T, name: string): Promise<T> => {
            try {
                return await promise;
            } catch (error) {
                console.error(`Error fetching ${name}:`, error);
                return fallback;
            }
        };

        try {
            // Load public/common data
            const [fetchedNotices, fetchedAmenities, fetchedReservations, fetchedExpenses, fetchedSettings] = await Promise.all([
                safeFetch(dataService.getNotices(), [], 'Notices'),
                safeFetch(dataService.getAmenities(), [], 'Amenities'),
                safeFetch(dataService.getReservations(), [], 'Reservations'),
                safeFetch(dataService.getExpenses(), [], 'Expenses'),
                safeFetch(dataService.getSettings(), { commonExpense: 50000, parkingCost: 10000 }, 'Settings')
            ]);

            setNotices(fetchedNotices);
            setAmenities(fetchedAmenities);
            setReservations(fetchedReservations);
            setExpenses(fetchedExpenses);
            setSettings(fetchedSettings as CommunitySettings);

            // Mock data for things not in DB yet
            setFinancialStatements(db.getFinancialStatements());
            setReserveFund(db.getReserveFund());

            if (user?.role === 'resident') {
                const [debts, parking, userTickets, payments] = await Promise.all([
                    safeFetch(dataService.getCommonExpenseDebts(user.id), [], 'CommonExpenseDebts'),
                    safeFetch(dataService.getParkingDebts(user.id), [], 'ParkingDebts'),
                    safeFetch(dataService.getTickets(user.id), [], 'UserTickets'),
                    safeFetch(dataService.getPaymentHistory(user.id), [], 'UserPayments')
                ]);

                setCommonExpenseDebts(debts);
                setParkingDebts(parking);
                setTickets(userTickets);
                setPaymentHistory(payments);
            } else if (user?.role === 'admin') {
                // Admin fetching
                const [allTickets, allPayments, allCommonDebts, allParkingDebts, allUsers] = await Promise.all([
                    safeFetch(dataService.getTickets(), [], 'AllTickets'),
                    safeFetch(dataService.getPaymentHistory(), [], 'AllPayments'),
                    safeFetch(dataService.getCommonExpenseDebts(), [], 'AllCommonDebts'),
                    safeFetch(dataService.getParkingDebts(), [], 'AllParkingDebts'),
                    safeFetch(dataService.getUsers(), [], 'AllUsers')
                ]);

                setTickets(allTickets);
                setPaymentHistory(allPayments);
                setCommonExpenseDebts(allCommonDebts);
                setParkingDebts(allParkingDebts);
                setUsers(allUsers);
            }
        } catch (error) {
            console.error("Error loading data (critical):", error);
            showToast("Error crítico al cargar datos", "error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        document.documentElement.classList.toggle('dark', initialTheme === 'dark');

        // Check Env Vars
        const isDevelopment = (import.meta as any).env.MODE === 'development' || (import.meta as any).env.DEV;
        if (!(import.meta as any).env.VITE_SUPABASE_URL || !(import.meta as any).env.VITE_SUPABASE_ANON_KEY) {
            showToast("Faltan credenciales de Supabase en .env.local", "error");
        }

        console.log("App: Starting auth check...", window.location.href);

        // Safety timeout
        const safetyTimeout = setTimeout(() => {
            if (isLoading) {
                console.warn("App: Safety timeout triggered");
                setIsLoading(false);
                showToast("La conexión está tardando mucho. Verifique su red o configuración.", "info");
            }
        }, 5000);

        // Auth Subscription
        const { data: authListener } = authService.onAuthStateChange((user) => {
            console.log("App: Auth state change detected", user);
            if (user) {
                const appUser: User = {
                    id: user.id,
                    nombre: user.nombre || user.email,
                    unidad: user.unidad || '',
                    role: user.role || 'resident',
                    hasParking: user.has_parking || false,
                    email: user.email
                };
                setCurrentUser(appUser);
                loadData(appUser);
                const startPage = appUser.role === 'admin' ? 'admin-dashboard' : 'home';
                setPage(startPage);
            } else {
                setCurrentUser(null);
                setPage('login');
            }
            setIsLoading(false);
        });

        // Initial check
        authService.getCurrentUser().then((result) => {
            console.log("App: Initial user check done", result);
            if (result && result.user) {
                // Explicitly set user here in case subscription missed it
                const appUser: User = {
                    id: result.user.id,
                    nombre: result.profile?.nombre || result.user.email?.split('@')[0] || 'Usuario',
                    unidad: result.profile?.unidad || 'Sin Asignar',
                    role: result.profile?.role || 'resident',
                    hasParking: result.profile?.has_parking || false,
                    email: result.user.email
                };
                setCurrentUser(appUser);
                loadData(appUser);
                const startPage = appUser.role === 'admin' ? 'admin-dashboard' : 'home';
                setPage(startPage);
                setIsLoading(false);
            } else {
                setIsLoading(false);
            }
        }).catch(err => {
            console.error("App: Error checking user", err);
            setIsLoading(false);
            showToast("Error verificando sesión", "error");
        });

        return () => {
            clearTimeout(safetyTimeout);
            authListener.subscription.unsubscribe();
        };
    }, [loadData]);

    const handleNavigate = (newPage: Page, params: any = null) => {
        window.scrollTo(0, 0);
        setPage(newPage);
        setPageParams(params);
        // Note: markNoticeAsRead logic needs migration to async
    };

    const handleLogout = async () => {
        await authService.signOut();
        // State update handled by onAuthStateChange
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    const unreadNoticesCount = useMemo(() => notices.filter(n => !n.leido && n.status === NoticeStatus.PUBLICADO).length, [notices]);

    // Data handlers
    const addTicket = async (ticketData: { titulo: string; descripcion: string; foto?: string; }) => {
        if (currentUser) {
            try {
                await dataService.createTicket(ticketData, currentUser.id.toString());
                const tickets = await dataService.getTickets(currentUser.id);
                setTickets(tickets);
                handleNavigate('tickets');
                showToast('Ticket creado exitosamente.');
            } catch (error) {
                showToast('Error al crear ticket', 'error');
            }
        }
    };

    const updateTicketStatus = async (id: number, status: TicketStatus) => {
        try {
            await dataService.updateTicketStatus(id, status);
            const userFilter = currentUser?.role === 'resident' ? currentUser.id : undefined;
            // Note: getTickets might need to handle filter properly in dataService if not already
            const tickets = await dataService.getTickets(userFilter);
            setTickets(tickets);
            const backPage = currentUser?.role === 'admin' ? 'admin-tickets' : 'tickets';
            handleNavigate(backPage);
            showToast('Estado del ticket actualizado.');
        } catch (error) {
            showToast('Error al actualizar ticket', 'error');
        }
    };

    const addReservation = async (resData: Omit<Reservation, 'id'>): Promise<boolean> => {
        try {
            await dataService.createReservation(resData);
            const reservations = await dataService.getReservations();
            setReservations(reservations);
            showToast('Reserva creada exitosamente');
            return true;
        } catch (error) {
            showToast('Error: El horario ya está ocupado o hubo un error.', 'error');
            return false;
        }
    };

    const cancelReservation = async (id: number) => {
        try {
            await dataService.cancelReservation(id);
            const reservations = await dataService.getReservations();
            setReservations(reservations);
            showToast('Reserva cancelada');
        } catch (error) {
            showToast('Error al cancelar reserva', 'error');
        }
    };

    const handleConfirmPayment = async () => {
        if (currentUser) {
            try {
                await dataService.payAllDebts(currentUser.id);
                loadData(currentUser);
                handleNavigate('payment-receipt', pageParams);
            } catch (error) {
                showToast('Error al procesar pago', 'error');
            }
        }
    }

    const addNotice = async (noticeData: Omit<Notice, 'id' | 'fecha' | 'leido' | 'status'>) => {
        try {
            await dataService.createNotice(noticeData);
            const notices = await dataService.getNotices();
            setNotices(notices);
            handleNavigate('admin-notices');
            showToast('Aviso guardado como borrador.');
        } catch (error: any) {
            console.error("App: Error creating notice", error);
            showToast(`Error al crear aviso: ${error.message || 'Desconocido'}`, 'error');
        }
    };

    const approveNotice = async (id: number) => {
        try {
            await dataService.approveNotice(id);
            const notices = await dataService.getNotices();
            setNotices(notices);
            handleNavigate('admin-notices');
            showToast('Aviso publicado exitosamente.');
        } catch (error: any) {
            console.error("App: Error approving notice", error);
            showToast(`Error al publicar aviso: ${error.message || 'Desconocido'}`, 'error');
        }
    };

    const addUser = async (userData: Omit<User, 'id' | 'role'>) => {
        // Creating users requires Supabase Admin API or inviting them.
        // For now, we will show a message.
        showToast('Para añadir usuarios, use el Dashboard de Supabase.', 'info');
        // db.addUser(userData);
        // loadData(currentUser || undefined);
        // handleNavigate('admin-units');
    };

    const handleUpdateUser = async (id: string | number, data: Partial<Pick<User, 'nombre' | 'hasParking' | 'email' | 'unidad' | 'alicuota'>>) => {
        try {
            await dataService.updateUser(id, data);
            if (currentUser) loadData(currentUser);
            handleNavigate('admin-units');
            showToast('Unidad actualizada exitosamente.');
        } catch (error: any) {
            console.error("App: Error updating user", error);
            showToast(`Error al actualizar unidad: ${error.message || error.details || 'Desconocido'}`, 'error');
        }
    };

    const handleDeleteUser = async (id: string | number) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta unidad? Esta acción no se puede deshacer.')) {
            try {
                await dataService.deleteUser(id);
                if (currentUser) loadData(currentUser);
                showToast('Unidad eliminada.');
            } catch (error) {
                showToast('Error al eliminar unidad', 'error');
            }
        }
    };

    const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>) => {
        try {
            await dataService.addExpense(expenseData);
            const expenses = await dataService.getExpenses();
            setExpenses(expenses);
            showToast('Gasto enviado a revisión.');
        } catch (error: any) {
            console.error("App: Error creating expense", JSON.stringify(error, null, 2));
            showToast(`Error al crear gasto: ${error.message || error.details || 'Desconocido'}`, 'error');
        }
    };

    const handleApproveExpense = async (id: number) => {
        try {
            await dataService.approveExpense(id);
            const expenses = await dataService.getExpenses();
            setExpenses(expenses);
            showToast('Gasto aprobado.');
        } catch (error: any) {
            console.error("App: Error approving expense", error);
            showToast(`Error al aprobar gasto: ${error.message || 'Desconocido'}`, 'error');
        }
    };

    const handleRejectExpense = async (id: number, motivo: string) => {
        try {
            await dataService.rejectExpense(id, motivo);
            const expenses = await dataService.getExpenses();
            setExpenses(expenses);
            showToast('Gasto rechazado.', 'info');
        } catch (error: any) {
            console.error("App: Error rejecting expense", error);
            showToast(`Error al rechazar gasto: ${error.message || 'Desconocido'}`, 'error');
        }
    }

    const handleCloseMonth = async () => {
        if (window.confirm('¿Estás seguro de cerrar el mes? Esta acción generará un nuevo informe financiero con los gastos aprobados y no se puede deshacer.')) {
            try {
                const newStatement = await dataService.closeMonthAndGenerateStatement();
                if (newStatement) {
                    const expenses = await dataService.getExpenses();
                    setExpenses(expenses);
                    // Refresh statements if we had a getter for them
                    showToast(`Informe de ${newStatement.mes} generado exitosamente.`);
                } else {
                    showToast('No hay gastos aprobados para cerrar el mes.', 'error');
                }
            } catch (error) {
                showToast('Error al cerrar el mes', 'error');
            }
        }
    };

    const handleUpdateSettings = async (newSettings: CommunitySettings) => {
        try {
            await dataService.updateCommunitySettings(newSettings);
            const settings = await dataService.getSettings();
            setSettings(settings);
            showToast('Configuración guardada exitosamente.');
        } catch (error) {
            showToast('Error al guardar configuración', 'error');
        }
    };

    const handleRegisterPayment = async (payment: Omit<PaymentRecord, 'id'>) => {
        try {
            await dataService.registerPayment(payment);
            // Refresh payments history
            const allPayments = await dataService.getPaymentHistory();
            setPaymentHistory(allPayments);
            showToast('Pago registrado exitosamente.');
            // handleNavigate('admin-units'); // Removed to allow receipt printing
        } catch (error) {
            showToast('Error al registrar pago', 'error');
        }
    };

    if (isLoading) {
        return <div className="p-4 space-y-4"><SkeletonLoader className="h-24 w-full" /><SkeletonLoader className="h-48 w-full" /></div>
    }

    if (!currentUser) {
        return (
            <>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <LoginScreen />
            </>
        );
    }

    if (!reserveFund || !settings) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full text-red-500">
                    <Icons name="exclamation-triangle" className="w-12 h-12" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error al cargar datos</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    No se pudo obtener la configuración del condominio. Verifique su conexión o contacte al administrador.
                </p>
                {/* Debug info */}
                <p className="text-xs text-red-400 font-mono bg-red-50 dark:bg-red-900/10 p-2 rounded">
                    Si el problema persiste, intente recargar.
                </p>
                <Button onClick={() => window.location.reload()} className="shadow-lg shadow-blue-500/30">
                    <Icons name="arrow-path" className="w-4 h-4 mr-2" />
                    Reintentar
                </Button>
            </div>
        );
    }

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {currentUser.role === 'admin' ? (
                <AdminApp
                    page={page}
                    pageParams={pageParams}
                    currentUser={currentUser as User}
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
                    registerPayment={handleRegisterPayment}
                    updateSettings={handleUpdateSettings}
                    theme={theme}
                    toggleTheme={toggleTheme}
                />
            ) : (
                <ResidentApp
                    page={page}
                    pageParams={pageParams}
                    currentUser={currentUser as User}
                    commonExpenseDebts={commonExpenseDebts}
                    parkingDebts={parkingDebts}
                    tickets={tickets}
                    notices={notices.filter(n => n.status === NoticeStatus.PUBLICADO)}
                    amenities={amenities}
                    reservations={reservations}
                    financialStatements={financialStatements}
                    reserveFund={reserveFund?.montoActual || 0}
                    unreadNoticesCount={unreadNoticesCount}
                    theme={theme}
                    expenses={expenses}
                    paymentHistory={paymentHistory}
                    handleNavigate={handleNavigate}
                    handleLogout={handleLogout}
                    toggleTheme={toggleTheme}
                    addTicket={addTicket}
                    updateTicketStatus={updateTicketStatus}
                    addReservation={addReservation}
                    cancelReservation={cancelReservation}
                    handleConfirmPayment={handleConfirmPayment}
                    showToast={showToast}
                    onRefreshData={() => loadData(currentUser || undefined)}
                />
            )}
        </>
    );
}

export default App;
