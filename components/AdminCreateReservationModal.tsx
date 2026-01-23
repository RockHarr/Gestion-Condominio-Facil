
import React, { useState, useEffect } from 'react';
import { User, Amenity } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';
import { dataService } from '../services/data';

interface AdminCreateReservationModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const AdminCreateReservationModal: React.FC<AdminCreateReservationModalProps> = ({ onClose, onSuccess }) => {
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [users, setUsers] = useState<User[]>([]); // Need to fetch users
    const [loading, setLoading] = useState(false);

    // Form State
    const [selectedAmenity, setSelectedAmenity] = useState<string>(''); // Changed to string
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [amenitiesData, usersData] = await Promise.all([
                dataService.getAmenities(),
                dataService.getUsers() // Assuming this fetches profiles
            ]);
            setAmenities(amenitiesData);
            setUsers(usersData);
        } catch (error) {
            console.error('Error loading data for modal:', error);
            alert('Error al cargar datos iniciales');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAmenity || !selectedUser || !date || !startTime || !endTime) {
            alert('Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            // Construct ISO strings
            // Assuming local time for simplicity, but ideally should handle TZ
            const startAt = `${date}T${startTime}:00`;
            const endAt = `${date}T${endTime}:00`;

            await dataService.createReservationAsAdmin(
                selectedAmenity, // Passed as string
                selectedUser,
                startAt,
                endAt
            );

            alert('Reserva creada exitosamente');
            onSuccess();
        } catch (error: any) {
            console.error('Error creating reservation:', error);
            alert(error.message || 'Error al crear la reserva');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Nueva Reserva (Admin)
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <Icons name="xmark" className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Amenity Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Espacio Común</label>
                        <select
                            value={selectedAmenity}
                            onChange={e => setSelectedAmenity(e.target.value)} // Data is already string from value
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                            required
                        >
                            <option value="">Seleccionar Espacio...</option>
                            {amenities.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* User Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Residente / Unidad</label>
                        <select
                            value={selectedUser}
                            onChange={e => setSelectedUser(e.target.value)}
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                            required
                        >
                            <option value="">Seleccionar Residente...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.unidad} - {u.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]} // Prevent past dates
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inicio</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fin</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start gap-2">
                        <Icons name="info-circle" className="w-5 h-5 text-blue-500 mt-0.5" />
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            Esta acción creará una reserva confirmada inmediatamente. Si hay costo asociado, se generará el cargo pero quedará pendiente de pago.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? 'Creando...' : 'Crear Reserva'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
