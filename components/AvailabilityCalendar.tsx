import React, { useState, useEffect } from 'react';
import { Reservation, ReservationStatus } from '../types';
import { supabase } from '../lib/supabase';
import { Card, Button } from './Shared';
import Icons from './Icons';

interface AvailabilityCalendarProps {
    amenityId: string;
    onSelectDate: (date: Date) => void;
    refreshTrigger?: number;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ amenityId, onSelectDate, refreshTrigger = 0 }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReservations();
    }, [amenityId, currentDate, refreshTrigger]);

    const fetchReservations = async () => {
        setLoading(true);
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Adjust to cover full weeks displayed
        const startDate = new Date(startOfMonth);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start on Sunday

        const endDate = new Date(endOfMonth);
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday

        try {
            const { data, error } = await supabase
                .from('reservations')
                .select('*')
                .eq('amenity_id', amenityId)
                .gte('start_at', startDate.toISOString())
                .lte('end_at', endDate.toISOString())
                .neq('status', ReservationStatus.REJECTED)
                .neq('status', ReservationStatus.CANCELLED);

            if (error) throw error;

            const mappedReservations: Reservation[] = (data || []).map((r: any) => ({
                id: r.id,
                amenityId: r.amenity_id,
                userId: r.user_id,
                startAt: r.start_at,
                endAt: r.end_at,
                status: r.status,
                isSystem: r.is_system,
                systemReason: r.system_reason,
                formData: r.form_data
            }));

            setReservations(mappedReservations);
        } catch (error) {
            console.error('Error fetching reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    const daysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getDaysArray = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInCurrentMonth = daysInMonth(currentDate);

        const days = [];

        // Previous month padding
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ day: null, date: null });
        }

        // Current month days
        for (let i = 1; i <= daysInCurrentMonth; i++) {
            days.push({ day: i, date: new Date(year, month, i) });
        }

        return days;
    };

    const isDateOccupied = (date: Date) => {
        // Simple check: is there any reservation that overlaps with this day?
        // For now, we just check if there's a reservation starting on this day or covering it.
        // A more robust check would look at specific time slots, but for a daily view:

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return reservations.some(res => {
            const resStart = new Date(res.startAt);
            const resEnd = new Date(res.endAt);
            return (resStart <= endOfDay && resEnd >= startOfDay);
        });
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" aria-label="Mes anterior">
                        <Icons name="chevronLeft" className="w-5 h-5" />
                    </button>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" aria-label="Mes siguiente">
                        <Icons name="chevronRight" className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {getDaysArray().map((item, index) => {
                    if (!item.date) {
                        return <div key={`empty-${index}`} className="aspect-square"></div>;
                    }

                    const isOccupied = isDateOccupied(item.date);
                    const isPast = item.date < new Date(new Date().setHours(0, 0, 0, 0));
                    const isSelected = false; // Could add state for this

                    return (
                        <button
                            key={index}
                            disabled={isPast}
                            onClick={() => onSelectDate(item.date!)}
                            className={`
                                aspect-square rounded-lg flex items-center justify-center text-sm relative
                                ${isPast ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-200'}
                                ${isOccupied ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : ''}
                            `}
                        >
                            {item.day}
                            {isOccupied && (
                                <div className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Ocupado</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    <span>Disponible</span>
                </div>
            </div>
        </Card>
    );
};
