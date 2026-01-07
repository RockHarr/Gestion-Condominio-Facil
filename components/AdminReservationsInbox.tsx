import React, { useState, useEffect } from 'react';
import { Reservation, ReservationStatus } from '../types';
import { Card, Button, SkeletonLoader } from './Shared';
import { IncidentModal } from './IncidentModal';
import { DepositDecisionModal } from './DepositDecisionModal';
import { dataService } from '../services/data';

interface AdminReservationsInboxProps {
    onNavigate: (page: string) => void;
}

export const AdminReservationsInbox: React.FC<AdminReservationsInboxProps> = ({ onNavigate }) => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'history'>('pending');
    const [selectedReservationForIncident, setSelectedReservationForIncident] = useState<Reservation | null>(null);
    const [selectedReservationForDeposit, setSelectedReservationForDeposit] = useState<Reservation | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await dataService.getReservations();
            setReservations(data);
        } catch (error) {
            console.error('Error loading reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredReservations = reservations.filter(r => {
        if (activeTab === 'pending') {
            return r.status === ReservationStatus.REQUESTED || r.status === ReservationStatus.APPROVED_PENDING_PAYMENT;
        } else if (activeTab === 'upcoming') {
            return r.status === ReservationStatus.CONFIRMED && new Date(r.startAt) > new Date();
        } else {
            return [ReservationStatus.COMPLETED, ReservationStatus.CANCELLED, ReservationStatus.REJECTED, ReservationStatus.NO_SHOW].includes(r.status) || (r.status === ReservationStatus.CONFIRMED && new Date(r.startAt) <= new Date());
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

    if (loading) return <div className="p-6"><SkeletonLoader className="h-64 w-full" /></div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Reservas</h2>
                <div className="flex space-x-2">
                    <Button variant={activeTab === 'pending' ? 'primary' : 'secondary'} onClick={() => setActiveTab('pending')}>Pendientes</Button>
                    <Button variant={activeTab === 'upcoming' ? 'primary' : 'secondary'} onClick={() => setActiveTab('upcoming')}>Próximas</Button>
                    <Button variant={activeTab === 'history' ? 'primary' : 'secondary'} onClick={() => setActiveTab('history')}>Historial</Button>
                </div>
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
                                {reservation.userId && <p className="text-xs text-gray-500 mt-1">Usuario: {reservation.userId}</p>}
                            </div>

                            <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
                                {activeTab === 'pending' && (
                                    <>
                                        <Button variant="primary" onClick={() => handleStatusChange(reservation.id, 'approve')}>Aprobar</Button>
                                        <Button variant="danger" onClick={() => handleStatusChange(reservation.id, 'reject')}>Rechazar</Button>
                                    </>
                                )}
                                {activeTab === 'upcoming' && (
                                    <Button variant="danger" onClick={() => handleStatusChange(reservation.id, 'cancel')}>Cancelar</Button>
                                )}
                                {activeTab === 'history' && !reservation.isSystem && (reservation.status === ReservationStatus.COMPLETED || reservation.status === ReservationStatus.NO_SHOW) && (
                                    <>
                                        <Button variant="secondary" onClick={() => setSelectedReservationForDeposit(reservation)}>
                                            Gestionar Garantía
                                        </Button>
                                        <Button variant="danger" onClick={() => setSelectedReservationForIncident(reservation)}>
                                            Reportar Incidente
                                        </Button>
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
