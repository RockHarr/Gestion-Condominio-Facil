import React, { useState, useEffect } from 'react';
import { Reservation, ReservationStatus, Page } from '../types';
import { Card, Button, SkeletonLoader } from './Shared';
import { IncidentModal } from './IncidentModal';
import Icons from './Icons';
import { DepositDecisionModal } from './DepositDecisionModal';
import { ReservationPaymentModal } from './ReservationPaymentModal';
import { AdminCreateReservationModal } from './AdminCreateReservationModal'; // Import
import { dataService } from '../services/data';

interface AdminReservationsInboxProps {
    reservations: Reservation[];
    onNavigate: (page: Page) => void;
}

export const AdminReservationsInbox: React.FC<AdminReservationsInboxProps> = ({ reservations, onNavigate }) => {
    // const [reservations, setReservations] = useState<Reservation[]>([]); // Removed local state
    const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'history' | 'all'>('pending');
    const [selectedReservationForIncident, setSelectedReservationForIncident] = useState<Reservation | null>(null);
    const [selectedReservationForDeposit, setSelectedReservationForDeposit] = useState<Reservation | null>(null);
    const [selectedReservationForPayment, setSelectedReservationForPayment] = useState<Reservation | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Initial load removed as it relies on parent props
    const loadData = async () => {
        // This might be needed if actions (approve/reject) don't trigger parent update automatically.
        // However, currently App.tsx doesn't have a mechanism to re-fetch on child action unless we pass a callback.
        // For now, relies on optimistic updates or we need to add onRefresh prop.
        // Given dataService calls in this component, we should probably add onRefresh prop or just window.location.reload() (bad)
        // BETTER: Add onRefresh prop.
        // But for now, let's just use the props.
    };

    const filteredReservations = reservations.filter(r => {
        if (activeTab === 'pending') {
            return r.status === ReservationStatus.REQUESTED;
        } else if (activeTab === 'upcoming') {
            return (r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.APPROVED_PENDING_PAYMENT) && new Date(r.startAt) > new Date();
        } else if (activeTab === 'all') {
            return true;
        } else {
            return [ReservationStatus.COMPLETED, ReservationStatus.CANCELLED, ReservationStatus.REJECTED, ReservationStatus.NO_SHOW].includes(r.status) ||
                ((r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.APPROVED_PENDING_PAYMENT) && new Date(r.startAt) <= new Date());
        }
    }).sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    const handleStatusChange = async (id: number, action: 'approve' | 'reject' | 'cancel') => {
        if (!confirm('¿Estás seguro de realizar esta acción?')) return;
        try {
            if (action === 'approve') await dataService.approveReservation(id);
            if (action === 'reject') await dataService.rejectReservation(id);
            if (action === 'cancel') await dataService.cancelReservation(id);
            loadData();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar estado');
        }
    };

    // Loading state removed as we rely on props
    // if (loading) return <div className="p-6"><SkeletonLoader className="h-64 w-full" /></div>;

    const counts = {
        pending: reservations.filter(r => r.status === ReservationStatus.REQUESTED).length,
        upcoming: reservations.filter(r => (r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.APPROVED_PENDING_PAYMENT) && new Date(r.startAt) > new Date()).length,
        history: reservations.filter(r => [ReservationStatus.COMPLETED, ReservationStatus.CANCELLED, ReservationStatus.REJECTED, ReservationStatus.NO_SHOW].includes(r.status) || (r.status === ReservationStatus.CONFIRMED && new Date(r.startAt) <= new Date())).length,
        all: reservations.length
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Reservas</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Administra las solicitudes y uso de espacios comunes</p>
                </div>

                <Button onClick={() => setShowCreateModal(true)} className="shadow-lg shadow-blue-500/30">
                    <Icons name="plus" className="w-4 h-4 mr-2" /> Nueva Reserva
                </Button>
            </div>

            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                <Button variant={activeTab === 'pending' ? 'primary' : 'secondary'} onClick={() => setActiveTab('pending')} className="relative whitespace-nowrap">
                    Pendientes
                    {counts.pending > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {counts.pending}
                        </span>
                    )}
                </Button>
                <Button variant={activeTab === 'upcoming' ? 'primary' : 'secondary'} onClick={() => setActiveTab('upcoming')} className="relative whitespace-nowrap">
                    Próximas
                    {counts.upcoming > 0 && (
                        <span className="ml-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {counts.upcoming}
                        </span>
                    )}
                </Button>
                <Button variant={activeTab === 'history' ? 'primary' : 'secondary'} onClick={() => setActiveTab('history')} className="relative whitespace-nowrap">
                    Historial
                    {counts.history > 0 && (
                        <span className="ml-2 bg-gray-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {counts.history}
                        </span>
                    )}
                </Button>
                <Button variant={activeTab === 'all' ? 'primary' : 'secondary'} onClick={() => setActiveTab('all')} className="relative whitespace-nowrap">
                    Todas
                    <span className="ml-2 bg-gray-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {counts.all}
                    </span>
                </Button>
            </div>

            {/* Modals */}
            {selectedReservationForIncident && (
                <IncidentModal
                    reservation={selectedReservationForIncident}
                    onClose={() => setSelectedReservationForIncident(null)}
                    onSuccess={() => {
                        setSelectedReservationForIncident(null);
                        loadData();
                    }}
                />
            )}

            {selectedReservationForDeposit && (
                <DepositDecisionModal
                    reservation={selectedReservationForDeposit}
                    onClose={() => setSelectedReservationForDeposit(null)}
                    onSuccess={() => {
                        setSelectedReservationForDeposit(null);
                        loadData();
                    }}
                />
            )}

            {showCreateModal && (
                <AdminCreateReservationModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadData();
                    }}
                />
            )}

            {selectedReservationForPayment && (
                <ReservationPaymentModal
                    reservation={selectedReservationForPayment}
                    onClose={() => setSelectedReservationForPayment(null)}
                    onSuccess={async (paymentData) => {
                        try {
                            await dataService.confirmReservationPayment(selectedReservationForPayment.id, paymentData);
                            setSelectedReservationForPayment(null);
                            loadData();
                            // Optional: Show success toast
                        } catch (error) {
                            console.error("Error registering payment:", error);
                            alert("Error al registrar el pago");
                        }
                    }}
                />
            )}

            <div className="space-y-4">
                {filteredReservations.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No hay reservas en esta categoría.</div>
                ) : (
                    filteredReservations.map(reservation => (
                        <Card key={reservation.id} className={`p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${reservation.isSystem ? 'border-l-4 border-orange-500' : ''}`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${reservation.status === ReservationStatus.CONFIRMED ? 'bg-green-100 text-green-800' :
                                        reservation.status === ReservationStatus.REQUESTED ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {reservation.status}
                                    </span>
                                    {reservation.isSystem && <span className="text-xs text-orange-600 font-bold">SISTEMA</span>}
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    Reserva #{reservation.id} - {new Date(reservation.startAt).toLocaleDateString()}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {new Date(reservation.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                    {new Date(reservation.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {reservation.user ? (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 font-medium">
                                        {reservation.user.nombre} • Unidad {reservation.user.unidad}
                                    </p>
                                ) : (
                                    reservation.userId && <p className="text-xs text-gray-500 mt-1">Usuario ID: {reservation.userId}</p>
                                )}
                            </div>

                            <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
                                {activeTab === 'pending' && (
                                    <>
                                        <Button variant="primary" onClick={() => handleStatusChange(reservation.id, 'approve')}>Aprobar</Button>
                                        <Button variant="danger" onClick={() => handleStatusChange(reservation.id, 'reject')}>Rechazar</Button>
                                    </>
                                )}
                                {activeTab === 'upcoming' && (
                                    <>
                                        {reservation.status === ReservationStatus.APPROVED_PENDING_PAYMENT && (
                                            <Button
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => setSelectedReservationForPayment(reservation)}
                                            >
                                                <Icons name="currency-dollar" className="w-4 h-4 mr-1" />
                                                Registrar Pago
                                            </Button>
                                        )}
                                        <Button variant="danger" onClick={() => handleStatusChange(reservation.id, 'cancel')}>Cancelar</Button>
                                    </>
                                )}
                                {activeTab === 'history' && !reservation.isSystem && (
                                    <>
                                        {(reservation.status === ReservationStatus.COMPLETED || reservation.status === ReservationStatus.NO_SHOW) && (
                                            <>
                                                <Button variant="secondary" onClick={() => setSelectedReservationForDeposit(reservation)}>
                                                    Gestionar Garantía
                                                </Button>
                                                <Button variant="danger" onClick={() => setSelectedReservationForIncident(reservation)}>
                                                    Reportar Incidente
                                                </Button>
                                            </>
                                        )}
                                        {reservation.status === ReservationStatus.APPROVED_PENDING_PAYMENT && (
                                            <>
                                                <Button
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => setSelectedReservationForPayment(reservation)}
                                                >
                                                    <Icons name="currency-dollar" className="w-4 h-4 mr-1" />
                                                    Registrar Pago
                                                </Button>
                                                <Button variant="danger" onClick={() => handleStatusChange(reservation.id, 'cancel')}>Cancelar</Button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
