import React, { useState } from 'react';
import { Reservation } from '../types';
import { Button } from './Shared';
import { dataService } from '../services/data';

interface IncidentModalProps {
    reservation: Reservation;
    onClose: () => void;
    onSuccess: () => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({ reservation, onClose, onSuccess }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [evidenceUrl, setEvidenceUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!description) {
            alert('Debe ingresar una descripción del incidente.');
            return;
        }
        if (amount <= 0) {
            alert('El monto de la multa debe ser mayor a cero.');
            return;
        }

        setLoading(true);
        try {
            await dataService.reportIncident(reservation.id, description, amount, evidenceUrl || undefined);
            alert('Incidente reportado y multa generada exitosamente.');
            onSuccess();
        } catch (error) {
            console.error('Error reporting incident:', error);
            alert('Error al reportar incidente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Reportar Incidente / Multa</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Reserva #{reservation.id}
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción del Daño/Falta</label>
                        <textarea
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            rows={3}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Ej: Vidrio roto en quincho..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto de Multa (CLP)</label>
                        <input
                            type="number"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            placeholder="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL de Evidencia (Opcional)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            value={evidenceUrl}
                            onChange={e => setEvidenceUrl(e.target.value)}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
                        <Button variant="danger" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Procesando...' : 'Generar Multa'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
