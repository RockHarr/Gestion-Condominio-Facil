import React, { useMemo } from 'react';
import { Page, User, Ticket, Notice, Expense, CommunitySettings, PaymentRecord, CommonExpenseDebt, ParkingDebt, TicketStatus } from '../types';
import { Header } from './Shared';
import { AdminDashboard } from './AdminDashboard';
import { AdminTicketsScreen, AdminTicketDetailScreen } from './AdminTickets';
import { AdminNoticesScreen, AdminNoticeDetailScreen, AdminCreateNoticeScreen } from './AdminNotices';
import { AdminUnitsScreen, AdminCreateUnitScreen, AdminEditUnitScreen, AdminUnitDetailScreen } from './AdminUnits';
import { AdminSettingsScreen } from './AdminSettings';
import { AdminSidebar, AdminTabBar } from './AdminNavigation';

interface AdminAppProps {
    page: Page;
    pageParams: any;
    currentUser: User;
    users: User[];
    tickets: Ticket[];
    notices: Notice[];
    expenses: Expense[];
    settings: CommunitySettings;
    paymentHistory: PaymentRecord[];
    commonExpenseDebts: CommonExpenseDebt[];
    parkingDebts: ParkingDebt[];
    handleNavigate: (page: Page, params?: any) => void;
    handleLogout: () => void;
    updateTicketStatus: (id: number, status: TicketStatus) => void;
    addNotice: (data: Omit<Notice, 'id' | 'fecha' | 'leido' | 'status'>) => void;
    approveNotice: (id: number) => void;
    addUser: (data: Omit<User, 'id' | 'role'>) => void;
    updateUser: (id: number, data: Partial<Pick<User, 'nombre' | 'hasParking' | 'email'>>) => void;
    deleteUser: (id: number) => void;
    addExpense: (data: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>) => void;
    approveExpense: (id: number) => void;
    rejectExpense: (id: number, motivo: string) => void;
    closeMonth: () => void;
    updateSettings: (settings: CommunitySettings) => void;
}

export const AdminApp: React.FC<AdminAppProps> = (props) => {
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
