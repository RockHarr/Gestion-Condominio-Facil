import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ReservationType, Amenity } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';

interface ReservationRequestModalProps {
    amenity: Amenity;
    selectedDate: Date;
    onClose: () => void;
    onSuccess: () => void;
}

export const ReservationRequestModal: React.FC<ReservationRequestModalProps> = ({ amenity, selectedDate, onClose, onSuccess }) => {
    const [types, setTypes] = useState<ReservationType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
    const [startTime, setStartTime] = useState('10:00');
    const [endTime, setEndTime] = useState('14:00');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTypes();
    }, [amenity.id]);

    const fetchTypes = async () => {
        const { data, error } = await supabase
            .from('reservation_types')
            .select('*')
            .eq('amenity_id', amenity.id);

        if (data) {
            setTypes(data);
            if (data.length === 1) {
                setSelectedTypeId(data[0].id);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!selectedTypeId) {
            setError('Debes seleccionar un tipo de reserva.');
            setLoading(false);
            return;
        }

        const selectedType = types.find(t => t.id === selectedTypeId);
        if (!selectedType) return;

        // Construct timestamps
        // Note: selectedDate is local date from calendar (00:00:00)
        // We need to combine it with time strings
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);

        const startAt = new Date(selectedDate);
        startAt.setHours(startH, startM, 0, 0);

        const endAt = new Date(selectedDate);
        endAt.setHours(endH, endM, 0, 0);

        // Basic validations
        if (endAt <= startAt) {
            setError('La hora de término debe ser posterior a la de inicio.');
            setLoading(false);
            return;
        }

        const durationMinutes = (endAt.getTime() - startAt.getTime()) / (1000 * 60);
        if (selectedType.max_duration_minutes && durationMinutes > selectedType.max_duration_minutes) {
            setError(`La duración máxima es de ${selectedType.max_duration_minutes / 60} horas.`);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.rpc('request_reservation', {
                p_amenity_id: amenity.id,
                p_type_id: selectedTypeId,
                p_start_at: startAt.toISOString(),
                p_end_at: endAt.toISOString(),
                p_form_data: {} // Placeholder for future custom forms
            });

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error requesting reservation:', err);
            // Check for overlap error in various properties
            const errorMessage = err.message || err.details || '';
            if (
                errorMessage.includes('no_overlap_reservations') ||
                err.code === '23P01' ||
                errorMessage.toLowerCase().includes('conflicting key value violates exclusion constraint')
            ) {
                setError('Ya existe una reserva para este horario. Por favor selecciona otro.');
            } else {
                setError(errorMessage || 'Error al solicitar la reserva.');
            }
        } finally {
            setLoading(false);
        }
    };

    const selectedType = types.find(t => t.id === selectedTypeId);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Solicitar Reserva</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {amenity.name} - {selectedDate.toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <Icons name="xmark" className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {types.length > 1 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Evento</label>
                            <select
                                value={selectedTypeId || ''}
                                onChange={e => setSelectedTypeId(Number(e.target.value))}
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {types.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Término</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                                required
                            />
                        </div>
                    </div>

                    {selectedType && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Tarifa de uso:</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {selectedType.fee_amount > 0 ? `$${selectedType.fee_amount.toLocaleString()}` : 'Gratis'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Garantía (Reembolsable):</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {selectedType.deposit_amount > 0 ? `$${selectedType.deposit_amount.toLocaleString()}` : 'No requiere'}
                                </span>
                            </div>
                            {selectedType.rules && (
                                <div className="pt-2 border-t border-blue-100 dark:border-blue-800 mt-2">
                                    <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">Reglas:</p>
                                    <p className="text-blue-700 dark:text-blue-400 italic">{selectedType.rules}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Solicitando...' : 'Confirmar Reserva'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
