import React, { useState } from 'react';
import { Reservation, PaymentMethod, PaymentType } from '../types';
import { Button, Card } from './Shared';
import Icons from './Icons';

interface ReservationPaymentModalProps {
    reservation: Reservation;
    onClose: () => void;
    onSuccess: (paymentData: any) => void;
}

export const ReservationPaymentModal: React.FC<ReservationPaymentModalProps> = ({ reservation, onClose, onSuccess }) => {
    const [monto, setMonto] = useState<string>(reservation.feeSnapshot?.toString() || '0');
    const [metodoPago, setMetodoPago] = useState<PaymentMethod>(PaymentMethod.TRANSFERENCIA);
    const [observacion, setObservacion] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const paymentData = {
            userId: reservation.userId,
            monto: parseInt(monto, 10),
            fechaPago: new Date().toISOString().split('T')[0],
            periodo: new Date().toISOString().slice(0, 7),
            type: PaymentType.RESERVA,
            metodoPago,
            observacion: `Pago Reserva #${reservation.id} - ${observacion}`
        };

        await onSuccess(paymentData);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <Icons name="x-mark" className="w-6 h-6" />
                </button>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Icons name="currency-dollar" className="w-6 h-6 text-green-500" />
                    Registrar Pago de Reserva
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Monto a Pagar
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                className="block w-full pl-7 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Medio de Pago
                        </label>
                        <select
                            value={metodoPago}
                            onChange={(e) => setMetodoPago(e.target.value as PaymentMethod)}
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3"
                        >
                            {Object.values(PaymentMethod).map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Observación
                        </label>
                        <textarea
                            value={observacion}
                            onChange={(e) => setObservacion(e.target.value)}
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3"
                            rows={3}
                            placeholder="N° Operación, detalles..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Registrando...' : 'Confirmar Pago'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
