import React, { useState } from 'react';
import type { User, PaymentRecord, Charge } from '../types';
import { PaymentType, PaymentMethod } from '../types';
import { dataService } from '../services/data';
import { Card, Button } from './Shared';
import Icons from './Icons';
import { PaymentReceiptModal } from './PaymentReceiptModal';

interface ExtendedUser extends User {
  unit_id?: number; // Optional as not all users might have it populated in frontend yet
}

// Type for pending charges from the API
interface PendingChargeDisplay {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface AdminPaymentEntryProps {
  users: ExtendedUser[];
  onRegisterPayment: (payment: Omit<PaymentRecord, 'id'>) => void;
}

export const AdminPaymentEntry: React.FC<AdminPaymentEntryProps> = ({
  users,
  onRegisterPayment,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [fechaPago, setFechaPago] = useState<string>(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>(PaymentMethod.TRANSFERENCIA);
  const [observacion, setObservacion] = useState<string>('');
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.GASTO_COMUN);
  const [unitSearch, setUnitSearch] = useState('');

  // State for the generated receipt
  const [lastPayment, setLastPayment] = useState<PaymentRecord | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  // Period defaults to current month
  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [periodo, setPeriodo] = useState<string>(currentPeriod);

  const residents = users.filter(
    (u) =>
      u.role === 'resident' &&
      (u.unidad.toLowerCase().includes(unitSearch.toLowerCase()) ||
        u.nombre.toLowerCase().includes(unitSearch.toLowerCase())),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !monto || !fechaPago) return;

    const newPaymentData: Omit<PaymentRecord, 'id'> = {
      userId: selectedUserId,
      monto: parseInt(monto, 10),
      fechaPago,
      type: paymentType,
      periodo,
      metodoPago,
      observacion,
    };

    onRegisterPayment(newPaymentData);

    // Create a temporary record for the receipt preview
    // In a real app, we'd wait for the ID from the backend, but for UI feedback this is fine
    const tempPaymentRecord: PaymentRecord = {
      ...newPaymentData,
      id: Date.now(), // Temporary ID for display
    };

    setLastPayment(tempPaymentRecord);
    setShowReceipt(true);

    // Reset form (keep date and period)
    setMonto('');
    setObservacion('');
    setSelectedUserId('');
    setPendingCharges([]);
  };

  // Pending Charges Logic
  const [pendingCharges, setPendingCharges] = React.useState<PendingChargeDisplay[]>([]);

  React.useEffect(() => {
    if (selectedUserId) {
      const user = users.find((u) => u.id === selectedUserId);
      if (user && user.unit_id) {
        dataService
          .getPendingChargesByUnit(user.unit_id)
          .then(setPendingCharges)
          .catch(console.error);
      } else {
        setPendingCharges([]);
      }
    } else {
      setPendingCharges([]);
    }
  }, [selectedUserId, users]);

  const handlePayCharge = async (charge: PendingChargeDisplay) => {
    if (!window.confirm(`¿Confirmar pago de ${charge.type} por $${charge.amount}?`)) return;

    try {
      await dataService.confirmChargePayment(
        charge.id,
        metodoPago,
        `Pago manual admin: ${observacion}`,
      );
      alert('Pago registrado correctamente');
      setPendingCharges((prev) => prev.filter((c) => c.id !== charge.id));

      // Generate pseudo-receipt for UI
      const user = users.find((u) => u.id === selectedUserId);
      if (user) {
        setLastPayment({
          id: Date.now(),
          userId: user.id,
          type: charge.type === 'RESERVATION_FEE' ? PaymentType.RESERVA : PaymentType.GASTO_COMUN, // Simplified mapping
          monto: charge.amount,
          fechaPago: new Date().toISOString().split('T')[0],
          periodo: currentPeriod,
          metodoPago,
          observacion: `Pago Cargo #${charge.id}`,
        });
        setShowReceipt(true);
      }
    } catch (e) {
      console.error(e);
      alert('Error al procesar pago');
    }
  };

  const getSelectedUser = () => users.find((u) => u.id === lastPayment?.userId);

  return (
    <div className="p-6 max-w-4xl mx-auto animate-page pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registrar Pago</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Ingreso manual de pagos recibidos por conserjería o administración.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unidad / Residente
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icons name="magnifying-glass" className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar unidad o nombre..."
                      value={unitSearch}
                      onChange={(e) => setUnitSearch(e.target.value)}
                      className="block w-full pl-9 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 text-sm"
                    />
                  </div>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                    required
                  >
                    <option value="">
                      {residents.length === 0 ? 'No hay resultados' : 'Seleccionar unidad...'}
                    </option>
                    {residents.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.unidad} - {user.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monto (CLP)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="block w-full pl-7 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                      placeholder="0"
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Pago
                  </label>
                  <input
                    type="date"
                    value={fechaPago}
                    onChange={(e) => setFechaPago(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Medio de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as PaymentMethod)}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                  >
                    {Object.values(PaymentMethod).map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Concepto
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                  >
                    {Object.values(PaymentType).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Periodo (Mes)
                </label>
                <input
                  type="month"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mes al que corresponde el pago (generalmente el actual o anterior).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observación (Opcional)
                </label>
                <textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                  placeholder="Ej: Transferencia #987654, Banco Estado"
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full shadow-lg shadow-blue-500/30 py-3 text-lg">
                  <Icons name="check-circle" className="w-6 h-6 mr-2" />
                  Registrar Pago
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Icons name="information-circle" className="w-5 h-5" />
              Instrucciones
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                Seleccione la unidad que realiza el pago.
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                Ingrese el monto exacto recibido.
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                Indique si fue transferencia o efectivo para el cuadre de caja.
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                En "Observación" anote el número de operación bancaria si aplica.
              </li>
            </ul>
          </div>

          {lastPayment && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-bold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                <Icons name="check-circle" className="w-5 h-5" />
                Pago Registrado
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                El pago de{' '}
                {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
                  lastPayment.monto,
                )}{' '}
                ha sido registrado exitosamente.
              </p>
              <Button
                onClick={() => setShowReceipt(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
              >
                <Icons name="printer" className="w-4 h-4 mr-2" />
                Imprimir Comprobante
              </Button>
            </div>
          )}

          {/* Pending Charges List */}
          {pendingCharges.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 border border-orange-100 dark:border-orange-800">
              <h3 className="font-bold text-orange-900 dark:text-orange-100 mb-4 flex items-center gap-2">
                <Icons name="exclamation-circle" className="w-5 h-5" />
                Cargos Pendientes
              </h3>
              <div className="space-y-3">
                {pendingCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {charge.type}
                      </p>
                      <p className="text-xs text-gray-500">#{charge.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('es-CL', {
                          style: 'currency',
                          currency: 'CLP',
                        }).format(charge.amount)}
                      </span>
                      <button
                        onClick={() => handlePayCharge(charge)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Cobrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showReceipt && lastPayment && getSelectedUser() && (
        <PaymentReceiptModal
          payment={lastPayment}
          user={getSelectedUser()!}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};
