import React from 'react';
import { Amenity, Page } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';

interface AmenitiesScreenProps {
    amenities: Amenity[];
    onNavigate: (page: Page, params?: any) => void;
}

export const AmenitiesScreen: React.FC<AmenitiesScreenProps> = ({ amenities, onNavigate }) => {
    return (
        <div className="p-4 space-y-6 animate-page pb-24">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Espacios Comunes</h2>
                <Button onClick={() => onNavigate('reservations')} className="!py-2 !px-4 !text-sm shadow-md">
                    <Icons name="calendar" className="w-4 h-4 mr-2" /> Mis Reservas
                </Button>
            </div>

            <div className="grid gap-6">
                {amenities.map(amenity => (
                    <Card key={amenity.id} className="overflow-hidden !p-0 group">
                        <div className="relative h-48 overflow-hidden">
                            <img
                                src={amenity.photoUrl}
                                alt={amenity.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 text-white">
                                <h3 className="text-xl font-bold">{amenity.name}</h3>
                                <p className="text-sm opacity-90 flex items-center gap-1">
                                    <Icons name="users" className="w-3 h-3" /> Capacidad: {amenity.capacity} personas
                                </p>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{amenity.description}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Horario: 09:00 - 22:00
                                </span>
                                <Button onClick={() => onNavigate('reservations', { amenityId: amenity.id })} variant="secondary" className="!py-2 !px-4 !text-sm">
                                    Reservar
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
