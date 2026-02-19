import React, { useState } from 'react';
import { Reservation, DepositDecisionType } from '../types';
import { Button } from './Shared';
import { dataService } from '../services/data';

interface DepositDecisionModalProps {
    reservation: Reservation;
    onClose: () => void;
    onSuccess: () => void;
}

export const DepositDecisionModal: React.FC<DepositDecisionModalProps> = ({ reservation, onClose, onSuccess }) => {
    const [decision, setDecision] = useState<DepositDecisionType>(DepositDecisionType.RELEASE);
    const [retainedAmount, setRetainedAmount] = useState<number>(0);
    const [reason, setReason] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (decision !== DepositDecisionType.RELEASE && !reason) {
            alert('Debe indicar un motivo para la retención.');
            return;
        }

        if (decision === DepositDecisionType.RETAIN_PARTIAL && retainedAmount <= 0) {
            alert('Debe indicar un monto válido a retener.');
            return;
        }

        setLoading(true);
        try {
            await dataService.decideDeposit(
                reservation.id,
                decision,
                decision === DepositDecisionType.RETAIN_PARTIAL ? retainedAmount : undefined,
                reason
            );
            alert('Decisión registrada exitosamente.');
            onSuccess();
        } catch (error) {
            console.error('Error deciding deposit:', error);
            alert('Error al registrar decisión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Gestión de Garantía</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Reserva #{reservation.id} - {reservation.status}
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Acción</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            value={decision}
                            onChange={e => setDecision(e.target.value as DepositDecisionType)}
                        >
                            <option value={DepositDecisionType.RELEASE}>Liberar Garantía (Devolver)</option>
                            <option value={DepositDecisionType.RETAIN_FULL}>Retener Totalidad (Multa/Daños)</option>
                            <option value={DepositDecisionType.RETAIN_PARTIAL}>Retener Parcialmente</option>
                        </select>
                    </div>

                    {decision === DepositDecisionType.RETAIN_PARTIAL && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto a Retener</label>
                            <input
                                type="number"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={retainedAmount}
                                onChange={e => setRetainedAmount(Number(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                    )}

                    {decision !== DepositDecisionType.RELEASE && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo</label>
                            <textarea
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                rows={3}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Explique la razón de la retención..."
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Procesando...' : 'Confirmar'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
