import React, { useState } from 'react';
import { Amenity, Reservation, Page, PageParams } from '../types';
import { Header, Card } from './Shared';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { ReservationRequestModal } from './ReservationRequestModal';
import Icons from './Icons';

interface ReservationAvailabilityScreenProps {
    amenity: Amenity;
    onBack: () => void;
    onSuccess: () => void;
}

export const ReservationAvailabilityScreen: React.FC<ReservationAvailabilityScreenProps> = ({ amenity, onBack, onSuccess }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <div className="animate-page pb-24">
            <Header title={amenity.name} onBack={onBack} />
            
            <div className="p-4 space-y-4">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                            <Icons name="calendar" className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Selecciona una fecha</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                Revisa la disponibilidad para {amenity.name}. Toca un día para ver horarios o reservar.
                            </p>
                        </div>
                    </div>
                </Card>

                <AvailabilityCalendar 
                    amenityId={amenity.id} 
                    onSelectDate={setSelectedDate} 
                    refreshTrigger={refreshTrigger}
                />
            </div>

            {selectedDate && (
                <ReservationRequestModal
                    amenity={amenity}
                    selectedDate={selectedDate}
                    onClose={() => setSelectedDate(null)}
                    onSuccess={() => {
                        setSelectedDate(null);
                        setRefreshTrigger(prev => prev + 1);
                        onSuccess();
                    }}
                />
            )}
        </div>
    );
};
