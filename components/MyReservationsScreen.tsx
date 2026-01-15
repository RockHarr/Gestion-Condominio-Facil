import React, { useState, useEffect } from 'react';
import { Reservation, Amenity, Charge, ChargeStatus, User, ReservationStatus } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';
import { dataService } from '../services/data';

interface MyReservationsScreenProps {
    reservations: Reservation[];
    amenities: Amenity[];
    currentUser: User;
    onCancelReservation: (id: number) => void;
    onRefresh: () => void;
}

export const MyReservationsScreen: React.FC<MyReservationsScreenProps> = ({ reservations, amenities, currentUser, onCancelReservation, onRefresh }) => {
    const [loadingCharges, setLoadingCharges] = useState<number | null>(null);
    const [chargesMap, setChargesMap] = useState<Record<number, Charge[]>>({});
    const [payingChargeId, setPayingChargeId] = useState<string | null>(null);

    const myReservations = reservations
        .filter(r => r.userId === currentUser.id)
        .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    const fetchCharges = async (reservationId: number) => {
        setLoadingCharges(reservationId);
        try {
            const charges = await dataService.getChargesByReservation(reservationId);
            setChargesMap(prev => ({ ...prev, [reservationId]: charges }));
        } catch (error) {
            console.error("Error fetching charges", error);
        } finally {
            setLoadingCharges(null);
        }
    };

    const handlePayCharge = async (chargeId: string, reservationId: number) => {
        if (!window.confirm('¿Confirmar pago simulado de este cargo?')) return;

        setPayingChargeId(chargeId);
        try {
            await dataService.payCharge(chargeId);
            // Refresh charges for this reservation
            await fetchCharges(reservationId);
            // If all paid, maybe refresh global reservations to update status
            onRefresh();
        } catch (error) {
            console.error("Error paying charge", error);
            alert("Error al procesar el pago");
        } finally {
            setPayingChargeId(null);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Mis Reservas</h3>

            {myReservations.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tienes reservas activas.</p>
            ) : (
                <div className="space-y-4">
                    {myReservations.map(reservation => {
                        const amenity = amenities.find(a => a.id === reservation.amenityId);
                        const startDate = new Date(reservation.startAt);
                        const endDate = new Date(reservation.endAt);
                        const isPast = endDate < new Date();
                        const charges = chargesMap[reservation.id];
                        const showPayButton = reservation.status === ReservationStatus.APPROVED_PENDING_PAYMENT;

                        return (
                            <Card key={reservation.id} className={`p-4 ${isPast ? 'opacity-75' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                            {amenity?.name || 'Espacio desconocido'}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <div className="mt-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium 
                                                ${reservation.status === ReservationStatus.CONFIRMED ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    reservation.status === ReservationStatus.REQUESTED ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        reservation.status === ReservationStatus.APPROVED_PENDING_PAYMENT ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {reservation.status === ReservationStatus.CONFIRMED && <Icons name="check-badge" className="w-3.5 h-3.5" />}
                                                {reservation.status === ReservationStatus.REQUESTED && <Icons name="clock" className="w-3.5 h-3.5" />}
                                                {reservation.status === ReservationStatus.APPROVED_PENDING_PAYMENT && <Icons name="currency-dollar" className="w-3.5 h-3.5" />}

                                                {reservation.status === ReservationStatus.CONFIRMED ? 'Confirmada' :
                                                    reservation.status === ReservationStatus.REQUESTED ? 'Pendiente' :
                                                        reservation.status === ReservationStatus.APPROVED_PENDING_PAYMENT ? 'Aprobada - Pago Pendiente' :
                                                            reservation.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 items-end">
                                        {!isPast && (reservation.status === ReservationStatus.REQUESTED || reservation.status === ReservationStatus.CONFIRMED || reservation.status === ReservationStatus.APPROVED_PENDING_PAYMENT) && (
                                            <Button
                                                variant="danger"
                                                className="text-xs px-2 py-1"
                                                onClick={() => {
                                                    if (window.confirm('¿Estás seguro de cancelar esta reserva?')) {
                                                        onCancelReservation(reservation.id);
                                                    }
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                        )}

                                        {showPayButton && !charges && (
                                            <Button
                                                variant="primary"
                                                className="text-xs px-3 py-1"
                                                onClick={() => fetchCharges(reservation.id)}
                                                disabled={loadingCharges === reservation.id}
                                            >
                                                {loadingCharges === reservation.id ? 'Cargando...' : 'Ver Pagos'}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Charges Section */}
                                {charges && showPayButton && (
                                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3 animate-in fade-in">
                                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Pagos Requeridos</h5>
                                        <div className="space-y-2">
                                            {charges.map(charge => (
                                                <div key={charge.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                            {charge.type === 'RESERVATION_FEE' ? 'Tarifa de Uso' :
                                                                charge.type === 'RESERVATION_DEPOSIT' ? 'Garantía' : charge.type}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(charge.amount)}
                                                        </p>
                                                    </div>
                                                    {charge.status === ChargeStatus.PAID ? (
                                                        <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                                                            <Icons name="checkCircle" className="w-4 h-4" /> Pagado
                                                        </span>
                                                    ) : (
                                                        <Button
                                                            variant="primary"
                                                            className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700"
                                                            onClick={() => handlePayCharge(charge.id, reservation.id)}
                                                            disabled={payingChargeId === charge.id}
                                                        >
                                                            {payingChargeId === charge.id ? 'Procesando...' : 'Pagar'}
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 italic">
                                            * La reserva se confirmará automáticamente cuando todos los cargos estén pagados.
                                        </p>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
