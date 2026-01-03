import React, { useMemo } from 'react';
import { User, CommonExpenseDebt, ParkingDebt, Ticket, Notice, Amenity, Reservation, FinancialStatement, Page, NoticeStatus, Expense, PaymentRecord } from '../types';
import { HomeScreen } from './HomeScreen';
import { PaymentsScreen } from './PaymentsScreen';
import { CreateTicketScreen } from './TicketsScreen';
import { TicketsScreen } from './TicketsScreen';
import { NoticesScreen } from './NoticesScreen';
import { AmenitiesScreen } from './AmenitiesScreen'; // Assuming this exists or will be fixed if not
import { ReservationsScreen } from './ReservationsScreen';
import { ProfileScreen } from './ProfileScreen';
import { ResidentTabBar } from './ResidentTabBar';
import { Header } from './Shared';
import { ExpenseStatementModal } from './ExpenseStatementModal';

interface ResidentAppProps {
    page: Page;
    pageParams: any;
    currentUser: User;
    commonExpenseDebts: CommonExpenseDebt[];
    parkingDebts: ParkingDebt[];
    tickets: Ticket[];
    notices: Notice[];
    amenities: Amenity[];
    reservations: Reservation[];
    financialStatements: FinancialStatement[];
    reserveFund: number;
    unreadNoticesCount: number;
    theme: 'light' | 'dark';
    expenses: Expense[];
    paymentHistory: PaymentRecord[];
    handleNavigate: (page: Page, params?: any) => void;
    handleLogout: () => void;
    toggleTheme: () => void;
    addTicket: (ticket: Pick<Ticket, 'titulo' | 'descripcion' | 'foto'>) => void;
    updateTicketStatus: (id: number, status: any) => void;
    addReservation: (res: Omit<Reservation, 'id'>) => void;
    cancelReservation: (id: number) => void;
    handleConfirmPayment: (debtId: number, type: 'common' | 'parking', method: string) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ResidentApp: React.FC<ResidentAppProps> = (props) => {
    const { page, pageParams, currentUser, commonExpenseDebts, parkingDebts, tickets, notices, amenities, reservations, financialStatements, reserveFund, unreadNoticesCount, theme, expenses, paymentHistory, handleNavigate, handleLogout, toggleTheme, addTicket, updateTicketStatus, addReservation, cancelReservation, handleConfirmPayment, showToast } = props;

    // State for Expense Statement Modal
    const [showStatementModal, setShowStatementModal] = React.useState(false);
    const [statementMonth, setStatementMonth] = React.useState(new Date().toISOString().slice(0, 7));

    const publishedNotices = useMemo(() => notices.filter(n => n.status === NoticeStatus.PUBLICADO), [notices]);

    const renderPage = () => {
        switch (page) {
            case 'home': return <HomeScreen user={currentUser} commonExpenseDebts={commonExpenseDebts} parkingDebts={parkingDebts} expenses={expenses} paymentHistory={paymentHistory} theme={theme} onNavigate={handleNavigate} onDownloadStatement={() => setShowStatementModal(true)} showToast={showToast} />;
            case 'payments': return <PaymentsScreen commonExpenseDebts={commonExpenseDebts} parkingDebts={parkingDebts} paymentHistory={paymentHistory} user={currentUser} onConfirmPayment={handleConfirmPayment} onNavigate={handleNavigate} />;
            case 'ticket-create': return <CreateTicketScreen onAddTicket={addTicket} />;
            case 'tickets': return <TicketsScreen tickets={tickets} onNavigate={handleNavigate} />;
            case 'notices': return <NoticesScreen notices={publishedNotices} onNavigate={handleNavigate} />;
            case 'amenities': return <AmenitiesScreen amenities={amenities} onNavigate={handleNavigate} />;
            case 'reservations': return <ReservationsScreen amenities={amenities} reservations={reservations} user={currentUser} onAddReservation={addReservation} onCancelReservation={cancelReservation} />;
            case 'profile': return <ProfileScreen user={currentUser} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} onNavigate={handleNavigate} />;
            default: return <HomeScreen user={currentUser} commonExpenseDebts={commonExpenseDebts} parkingDebts={parkingDebts} expenses={expenses} paymentHistory={paymentHistory} theme={theme} onNavigate={handleNavigate} onDownloadStatement={() => setShowStatementModal(true)} showToast={showToast} />;
        }
    };

    const showHeader = ['home', 'payments', 'tickets', 'notices', 'amenities', 'profile'].includes(page);
    const getPageTitle = () => {
        switch (page) {
            case 'home': return 'Inicio';
            case 'payments': return 'Mis Pagos';
            case 'tickets': return 'Mis Tickets';
            case 'notices': return 'Mural de Avisos';
            case 'amenities': return 'Espacios Comunes';
            case 'profile': return 'Mi Perfil';
            default: return 'Condominio Fácil';
        }
    };

    const onBackHandler = ['ticket-create', 'reservations'].includes(page) ? () => handleNavigate('home') : undefined;

    return (
        <div className="max-w-lg mx-auto bg-gray-100 dark:bg-gray-900 min-h-screen pb-24">
            {showHeader && <Header title={getPageTitle()} onBack={onBackHandler} />}
            <main>{renderPage()}</main>
            <ResidentTabBar currentPage={page} onNavigate={handleNavigate} unreadNotices={unreadNoticesCount} />

            {/* Expense Statement Modal */}
            {showStatementModal && (
                <ExpenseStatementModal
                    user={currentUser}
                    month={statementMonth}
                    communityExpenses={expenses.filter(e => e.fecha.startsWith(statementMonth))}
                    payments={paymentHistory}
                    previousBalance={0} // TODO: Calculate real previous balance based on debts
                    onClose={() => setShowStatementModal(false)}
                />
            )}
        </div>
    );
};
