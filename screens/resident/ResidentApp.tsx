import React, { useMemo } from 'react';
import type { User, CommonExpenseDebt, ParkingDebt, Ticket, Notice, Amenity, Reservation, FinancialStatement, ReserveFund, Expense, Page } from '../../types';
import { TicketStatus, NoticeStatus } from '../../types';
import { Header } from '../../components/common/Header';
import { ResidentTabBar } from './ResidentTabBar';
import { HomeScreen } from './HomeScreen';
import { PaymentsScreen } from './PaymentsScreen';
import { PaymentMethodScreen } from './PaymentMethodScreen';
import { PaymentConfirmScreen } from './PaymentConfirmScreen';
import { PaymentReceiptScreen } from './PaymentReceiptScreen';
import { TicketsScreen } from './TicketsScreen';
import { TicketDetailScreen } from './TicketDetailScreen';
import { CreateTicketScreen } from './CreateTicketScreen';
import { NoticesScreen } from './NoticesScreen';
import { NoticeDetailScreen } from './NoticeDetailScreen';
import { ReservationsScreen } from './ReservationsScreen';
import { ProfileScreen } from './ProfileScreen';
import { MoreScreen } from './MoreScreen';
import { FinancialStatementsScreen } from './FinancialStatementsScreen';
import { ReserveFundScreen } from './ReserveFundScreen';
import { ResidentExpensesScreen } from './ResidentExpensesScreen';

export const ResidentApp: React.FC<{
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
