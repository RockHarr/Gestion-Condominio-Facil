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
import { Header, Card, Button } from './Shared';
import Icons from './Icons';
import { ExpenseStatementModal } from './ExpenseStatementModal';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { ReservationRequestModal } from './ReservationRequestModal';

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
    onRefreshData?: () => void;
}

import { MyReservationsScreen } from './MyReservationsScreen';
import { PollsScreen } from './PollsScreen';

export const ResidentApp: React.FC<ResidentAppProps> = (props) => {
    const { page, pageParams, currentUser, commonExpenseDebts, parkingDebts, tickets, notices, amenities, reservations, financialStatements, reserveFund, unreadNoticesCount, theme, expenses, paymentHistory, handleNavigate, handleLogout, toggleTheme, addTicket, updateTicketStatus, addReservation, cancelReservation, handleConfirmPayment, showToast } = props;

    // State for Expense Statement Modal
    const [showStatementModal, setShowStatementModal] = React.useState(false);
    const [statementMonth, setStatementMonth] = React.useState(new Date().toISOString().slice(0, 7));

    const publishedNotices = useMemo(() => notices.filter(n => n.status === NoticeStatus.PUBLICADO), [notices]);

    const [selectedAmenityForBooking, setSelectedAmenityForBooking] = React.useState<Amenity | null>(null);
    const [selectedDateForBooking, setSelectedDateForBooking] = React.useState<Date | null>(null);
    const [reservationRefreshTrigger, setReservationRefreshTrigger] = React.useState(0);

    React.useEffect(() => {
        if (page === 'reservations' && pageParams?.amenityId) {
            const amenity = amenities.find(a => a.id === pageParams.amenityId);
            if (amenity) {
                setSelectedAmenityForBooking(amenity);
            }
        }
    }, [page, pageParams, amenities]);

    const renderPage = () => {
        switch (page) {
            case 'home': return <HomeScreen user={currentUser} commonExpenseDebts={commonExpenseDebts} parkingDebts={parkingDebts} expenses={expenses} paymentHistory={paymentHistory} theme={theme} onNavigate={handleNavigate} onDownloadStatement={() => setShowStatementModal(true)} showToast={showToast} />;
            case 'payments': return <PaymentsScreen commonExpenseDebts={commonExpenseDebts} parkingDebts={parkingDebts} paymentHistory={paymentHistory} user={currentUser} onConfirmPayment={handleConfirmPayment} onNavigate={handleNavigate} />;
            case 'ticket-create': return <CreateTicketScreen onAddTicket={addTicket} />;
            case 'tickets': return <TicketsScreen tickets={tickets} onNavigate={handleNavigate} />;
            case 'notices': return <NoticesScreen notices={publishedNotices} onNavigate={handleNavigate} />;
            case 'amenities': return <AmenitiesScreen amenities={amenities} onNavigate={handleNavigate} />;
            case 'reservations':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Reservas</h2>
                        </div>

                        {/* Amenity Selector */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {amenities.map(amenity => (
                                <button
                                    key={amenity.id}
                                    onClick={() => setSelectedAmenityForBooking(amenity)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${selectedAmenityForBooking?.id === amenity.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'
                                        }`}
                                >
                                    <h3 className="font-bold text-gray-900 dark:text-white">{amenity.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{amenity.description}</p>
                                </button>
                            ))}
                        </div>

                        {selectedAmenityForBooking ? (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <AvailabilityCalendar
                                    amenityId={selectedAmenityForBooking.id}
                                    onSelectDate={(date) => setSelectedDateForBooking(date)}
                                    refreshTrigger={reservationRefreshTrigger}
                                />
                            </div>
                        ) : (
                            <Card className="p-8 text-center border-dashed border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <Icons name="building-office" className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Selecciona un espacio</h3>
                                <p className="text-gray-500 dark:text-gray-400">Elige un espacio común arriba para ver su disponibilidad.</p>
                            </Card>
                        )}

                        {/* Booking Modal */}
                        {selectedAmenityForBooking && selectedDateForBooking && (
                            <ReservationRequestModal
                                amenity={selectedAmenityForBooking}
                                selectedDate={selectedDateForBooking}
                                onClose={() => setSelectedDateForBooking(null)}
                                onSuccess={() => {
                                    setSelectedDateForBooking(null);
                                    showToast('Solicitud de reserva enviada exitosamente.');
                                    setReservationRefreshTrigger(prev => prev + 1);
                                    props.onRefreshData?.();
                                }}
                            />
                        )}

                        {/* My Reservations Section */}
                        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 animate-in fade-in duration-700 delay-150">
                            <MyReservationsScreen
                                reservations={reservations}
                                amenities={amenities}
                                currentUser={currentUser}
                                onCancelReservation={cancelReservation}
                                onRefresh={props.onRefreshData || (() => { })}
                            />
                        </div>
                    </div>
                );

            case 'polls': return <PollsScreen />;
            case 'more': return <ProfileScreen user={currentUser} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} onNavigate={handleNavigate} />;
            case 'profile': return <ProfileScreen user={currentUser} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} onNavigate={handleNavigate} />;
            default: return <HomeScreen user={currentUser} commonExpenseDebts={commonExpenseDebts} parkingDebts={parkingDebts} expenses={expenses} paymentHistory={paymentHistory} theme={theme} onNavigate={handleNavigate} onDownloadStatement={() => setShowStatementModal(true)} showToast={showToast} />;
        }
    };

    const showHeader = ['home', 'payments', 'tickets', 'notices', 'amenities', 'polls', 'profile'].includes(page);
    const getPageTitle = () => {
        switch (page) {
            case 'home': return 'Inicio';
            case 'payments': return 'Mis Pagos';
            case 'tickets': return 'Mis Tickets';
            case 'notices': return 'Mural de Avisos';
            case 'amenities': return 'Espacios Comunes';
            case 'polls': return 'Votaciones';
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
