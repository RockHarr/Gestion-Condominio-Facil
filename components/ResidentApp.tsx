import React, { useMemo } from 'react';
import type {
  User,
  CommonExpenseDebt,
  ParkingDebt,
  Ticket,
  Notice,
  Amenity,
  Reservation,
  FinancialStatement,
  Page,
  Expense,
  PaymentRecord,
  PageParams,
} from '../types';
import { NoticeStatus, TicketStatus } from '../types';
import { HomeScreen } from './HomeScreen';
import { PaymentsScreen } from './PaymentsScreen';
import { CreateTicketScreen, TicketDetailScreen } from './TicketsScreen';
import { TicketsScreen } from './TicketsScreen';
import { NoticesScreen, NoticeDetailScreen } from './NoticesScreen';
import { AmenitiesScreen } from './AmenitiesScreen'; // Assuming this exists or will be fixed if not

import { ProfileScreen } from './ProfileScreen';
import { ResidentTabBar } from './ResidentTabBar';
import { Header, Card, Button } from './Shared';
import Icons from './Icons';
import { ExpenseStatementModal } from './ExpenseStatementModal';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { ReservationRequestModal } from './ReservationRequestModal';
import { ResidentExpensesScreen } from './ResidentExpensesScreen';

interface ResidentAppProps {
  page: Page;
  pageParams: PageParams | null;
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
  handleNavigate: (page: Page, params?: PageParams | null) => void;
  handleLogout: () => void;
  toggleTheme: () => void;
  addTicket: (ticket: Pick<Ticket, 'titulo' | 'descripcion' | 'foto'>) => void;
  addReservation: (res: Omit<Reservation, 'id'>) => void;
  cancelReservation: (id: number) => void;
  handleConfirmPayment: (debtId: number, type: 'common' | 'parking', method: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onRefreshData?: () => void;
}

import { MyReservationsScreen } from './MyReservationsScreen';
import { PollsScreen } from './PollsScreen';
import { MoreScreen } from './MoreScreen';
import { ReservationAvailabilityScreen } from './ReservationAvailabilityScreen';

export const ResidentApp: React.FC<ResidentAppProps> = (props) => {
  const {
    page,
    pageParams,
    currentUser,
    commonExpenseDebts,
    parkingDebts,
    tickets,
    notices,
    amenities,
    reservations,
    financialStatements,
    reserveFund,
    unreadNoticesCount,
    theme,
    expenses,
    paymentHistory,
    handleNavigate,
    handleLogout,
    toggleTheme,
    addTicket,
    addReservation,
    cancelReservation,
    handleConfirmPayment,
    showToast,
  } = props;

  // State for Expense Statement Modal
  const [showStatementModal, setShowStatementModal] = React.useState(false);
  const [statementMonth, setStatementMonth] = React.useState(new Date().toISOString().slice(0, 7));

  const publishedNotices = useMemo(
    () => notices.filter((n) => n.status === NoticeStatus.PUBLICADO),
    [notices],
  );

  const [selectedAmenityForBooking, setSelectedAmenityForBooking] = React.useState<Amenity | null>(
    null,
  );
  const [selectedDateForBooking, setSelectedDateForBooking] = React.useState<Date | null>(null);
  const [reservationRefreshTrigger, setReservationRefreshTrigger] = React.useState(0);

  React.useEffect(() => {
    if (page === 'reservations' && pageParams?.amenityId) {
      const amenity = amenities.find((a) => a.id === pageParams.amenityId);
      if (amenity) {
        setSelectedAmenityForBooking(amenity);
      }
    }
  }, [page, pageParams, amenities]);

  // Tab State for Reservations
  const [reservationTab, setReservationTab] = React.useState<'book' | 'my-reservations'>('book');

  const renderPage = () => {
    switch (page) {
      case 'home':
        return (
          <HomeScreen
            user={currentUser}
            commonExpenseDebts={commonExpenseDebts}
            parkingDebts={parkingDebts}
            expenses={expenses}
            paymentHistory={paymentHistory}
            theme={theme}
            onNavigate={handleNavigate}
            onDownloadStatement={() => setShowStatementModal(true)}
            showToast={showToast}
          />
        );
      case 'payments':
        return (
          <PaymentsScreen
            commonExpenseDebts={commonExpenseDebts}
            parkingDebts={parkingDebts}
            paymentHistory={paymentHistory}
            user={currentUser}
            onConfirmPayment={handleConfirmPayment}
            onNavigate={handleNavigate}
          />
        );
      case 'ticket-create':
        return (
          <CreateTicketScreen onAddTicket={addTicket} onBack={() => handleNavigate('tickets')} />
        );
      case 'tickets':
        return <TicketsScreen tickets={tickets} onNavigate={handleNavigate} />;
      case 'ticket-detail': {
        const ticket = tickets.find((t) => t.id === pageParams?.id);
        return ticket ? (
          <TicketDetailScreen ticket={ticket} onBack={() => handleNavigate('tickets')} />
        ) : (
          <div className="p-4">
            <Card>
              <p className="text-center text-gray-500">Ticket no encontrado</p>
            </Card>
          </div>
        );
      }
      case 'notices':
        return <NoticesScreen notices={publishedNotices} onNavigate={handleNavigate} />;
      case 'notice-detail': {
        const notice = notices.find((n) => n.id === pageParams?.id);
        return notice ? (
          <div className="p-0">
            <NoticeDetailScreen notice={notice} onBack={() => handleNavigate('notices')} />
          </div>
        ) : (
          <div>Aviso no encontrado</div>
        );
      }
      case 'amenities':
        return (
          <AmenitiesScreen
            amenities={amenities}
            onNavigate={handleNavigate}
            onRefresh={props.onRefreshData}
          />
        );
      case 'reservations':
        return (
          <div className="animate-in fade-in duration-500 pb-20">
            <div className="bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
              <Header title="Reservas" onBack={() => handleNavigate('amenities')} />
              <div className="flex px-4 pb-2 gap-2">
                <button
                  onClick={() => setReservationTab('book')}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${reservationTab === 'book' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
                >
                  Reservar
                </button>
                <button
                  onClick={() => setReservationTab('my-reservations')}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${reservationTab === 'my-reservations' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
                >
                  Mis Reservas
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {reservationTab === 'book' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-right-4 duration-300">
                  {amenities.map((amenity) => (
                    <button
                      key={amenity.id}
                      onClick={() =>
                        handleNavigate('reservation-availability', { amenityId: amenity.id })
                      }
                      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all p-0 text-left border border-gray-100 dark:border-gray-700"
                    >
                      <div className="h-32 bg-gray-200 dark:bg-gray-700 relative">
                        {/* Placeholder for amenity image if available */}
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <Icons name="building-office" className="w-12 h-12 opacity-50" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <h3 className="font-bold text-white text-lg">{amenity.name}</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                          {amenity.description}
                        </p>
                        <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                          Ver disponibilidad <Icons name="chevronRight" className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="animate-in slide-in-from-left-4 duration-300">
                  <MyReservationsScreen
                    reservations={reservations}
                    amenities={amenities}
                    currentUser={currentUser}
                    onCancelReservation={cancelReservation}
                    onRefresh={props.onRefreshData || (() => {})}
                  />
                </div>
              )}
            </div>
          </div>
        );
      case 'reservation-availability': {
        const amenity = amenities.find((a) => a.id === pageParams?.amenityId);
        return amenity ? (
          <ReservationAvailabilityScreen
            amenity={amenity}
            onBack={() => handleNavigate('reservations')}
            onSuccess={() => {
              showToast('Reserva solicitada con éxito', 'success');
              handleNavigate('reservations');
              setReservationTab('my-reservations');
            }}
          />
        ) : (
          <div>Espacio no encontrado</div>
        );
      }

      case 'polls':
        return <PollsScreen />;
      case 'resident-expenses':
        return (
          <ResidentExpensesScreen
            expenses={expenses}
            showToast={showToast}
            onNavigate={handleNavigate}
          />
        );
      case 'more':
        return <MoreScreen onNavigate={handleNavigate} unreadNotices={unreadNoticesCount} />;
      case 'profile':
        return (
          <ProfileScreen
            user={currentUser}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
            onNavigate={handleNavigate}
          />
        );
      default:
        return (
          <HomeScreen
            user={currentUser}
            commonExpenseDebts={commonExpenseDebts}
            parkingDebts={parkingDebts}
            expenses={expenses}
            paymentHistory={paymentHistory}
            theme={theme}
            onNavigate={handleNavigate}
            onDownloadStatement={() => setShowStatementModal(true)}
            showToast={showToast}
          />
        );
    }
  };

  const showHeader = [
    'home',
    'payments',
    'notices',
    'amenities',
    'polls',
    'profile',
    'more',
  ].includes(page);
  const getPageTitle = () => {
    switch (page) {
      case 'home':
        return 'Inicio';
      case 'payments':
        return 'Mis Pagos';
      case 'tickets':
        return 'Mis Tickets';
      case 'notices':
        return 'Mural de Avisos';
      case 'amenities':
        return 'Espacios Comunes';
      case 'polls':
        return 'Votaciones';
      case 'profile':
        return 'Mi Perfil';
      case 'more':
        return 'Más Opciones';
      default:
        return 'Condominio Fácil';
    }
  };

  const onBackHandler = useMemo(() => {
    if (['ticket-create', 'reservations', 'notice-detail'].includes(page))
      return () => handleNavigate('home');
    if (['reservation-availability'].includes(page)) return () => handleNavigate('reservations');
    if (['notices', 'tickets', 'polls', 'profile'].includes(page))
      return () => handleNavigate('more');
    return undefined;
  }, [page, handleNavigate]);

  const previousBalance = useMemo(() => {
    const unpaidCommonExpenses = commonExpenseDebts.filter(
      (debt) => !debt.pagado && debt.mes < statementMonth,
    );
    const unpaidParkingDebts = parkingDebts.filter(
      (debt) => !debt.pagado && debt.mes < statementMonth,
    );
    const totalCommonDebt = unpaidCommonExpenses.reduce((sum, debt) => sum + debt.monto, 0);
    const totalParkingDebt = unpaidParkingDebts.reduce((sum, debt) => sum + debt.monto, 0);
    return totalCommonDebt + totalParkingDebt;
  }, [commonExpenseDebts, parkingDebts, statementMonth]);

  return (
    <div className="max-w-lg mx-auto bg-gray-100 dark:bg-gray-900 min-h-screen pb-24">
      {showHeader && <Header title={getPageTitle()} onBack={onBackHandler} />}
      <main>{renderPage()}</main>
      <ResidentTabBar
        currentPage={page}
        onNavigate={handleNavigate}
        unreadNotices={unreadNoticesCount}
      />

      {/* Expense Statement Modal */}
      {showStatementModal && (
        <ExpenseStatementModal
          user={currentUser}
          month={statementMonth}
          communityExpenses={expenses.filter((e) => e.fecha.startsWith(statementMonth))}
          payments={paymentHistory}
          previousBalance={previousBalance}
          onClose={() => setShowStatementModal(false)}
        />
      )}
    </div>
  );
};
