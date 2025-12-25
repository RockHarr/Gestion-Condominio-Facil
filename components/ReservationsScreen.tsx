import React, { useState } from 'react';
import { Amenity, Reservation, User } from '../types';
import { Card } from './Shared';
import Icons from './Icons';

interface ReservationsScreenProps {
    amenities: Amenity[];
    reservations: Reservation[];
    user: User;
    onAddReservation: (res: Omit<Reservation, 'id'>) => boolean;
    onCancelReservation: (id: number) => void;
}

export const ReservationsScreen: React.FC<ReservationsScreenProps> = ({ amenities, reservations, user, onAddReservation, onCancelReservation }) => {
    const [selectedAmenity, setSelectedAmenity] = useState(amenities[0].id);
    const [currentDate, setCurrentDate] = useState(new Date('2025-11-10'));

    const timeslots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

    const changeDay = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + offset);
            return newDate;
        });
    };

    const dateString = currentDate.toISOString().split('T')[0];

    return (
        <div className="p-4 space-y-4">
            <Card>
                <label htmlFor="amenity-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Seleccionar Espacio Común</label>
                <select id="amenity-select" value={selectedAmenity} onChange={e => setSelectedAmenity(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    {amenities.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
            </Card>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeDay(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><Icons name="chevronLeft" /></button>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{currentDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                    <button onClick={() => changeDay(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><Icons name="chevronRight" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {timeslots.map(time => {
                        const reservation = reservations.find(r => r.amenityId === selectedAmenity && r.fecha === dateString && r.hora === time);
                        const isMine = reservation?.userId === user.id;
                        const isAvailable = !reservation;

                        return (
                            <button
                                key={time}
                                onClick={() => {
                                    if (isAvailable) {
                                        onAddReservation({ amenityId: selectedAmenity, fecha: dateString, hora: time, userId: user.id })
                                    } else if (isMine) {
                                        if (window.confirm('¿Seguro que quieres cancelar esta reserva?')) {
                                            onCancelReservation(reservation.id);
                                        }
                                    }
                                }}
                                disabled={reservation && !isMine}
                                className={`p-3 rounded-lg text-center font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isMine ? 'bg-red-500 text-white hover:bg-red-600' :
                                        isAvailable ? 'bg-green-500 text-white hover:bg-green-600' :
                                            'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                    }`}
                            >
                                {time}
                            </button>
                        )
                    })}
                </div>
            </Card>
        </div>
    );
}
