import React, { useState } from 'react';
import type {
  User,
  CommonExpenseDebt,
  ParkingDebt,
  PaymentRecord,
  Page,
  PageParams,
  PayableItem,
} from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';
import { PaymentReceiptModal } from './PaymentReceiptModal';

// Helper functions (inline to avoid import issues)
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
const formatPeriod = (period: string) => {
  if (!period) return '';
  const [year, month] = period.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
};

interface PaymentsScreenProps {
  commonExpenseDebts: CommonExpenseDebt[];
  parkingDebts: ParkingDebt[];
  paymentHistory: PaymentRecord[];
  user: User;
  onConfirmPayment: (debtId: number, type: 'common' | 'parking', method: string) => void;
  onNavigate: (page: Page, params?: PageParams | null) => void;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({
  commonExpenseDebts,
  parkingDebts,
  paymentHistory,
  user,
  onConfirmPayment,
  onNavigate,
}) => {
  const unpaidCommonExpenses = commonExpenseDebts.filter((d) => !d.pagado);
  const unpaidParking = parkingDebts.filter((d) => !d.pagado);

  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const itemsToPay: PayableItem[] = [
    ...unpaidCommonExpenses.map((d) => ({
      id: d.id,
      type: 'gasto_comun' as const,
      description: `Gasto Común (${formatPeriod(d.mes)})`,
      amount: d.monto,
      periodo: d.mes,
    })),
    ...unpaidParking.map((d) => ({
      id: d.id,
      type: 'estacionamiento' as const,
      description: `Estacionamiento (${formatPeriod(d.mes)})`,
      amount: d.monto,
      periodo: d.mes,
    })),
  ];

  const totalAmount = itemsToPay.reduce((sum, item) => sum + item.amount, 0);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-CL');

  return (
    <div className="p-4 space-y-6 animate-page pb-24">
      {/* Payment Flow Header - Only show if there is debt to pay */}
      {totalAmount > 0 && (
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div className="h-1 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div className="h-1 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center font-bold text-sm">
            3
          </div>
        </div>
      )}

      <Card>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Detalle de tu Deuda
        </h2>
        <div className="space-y-4">
          {itemsToPay.length > 0 ? (
            itemsToPay.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {item.description}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Icons name="check-badge" className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                No tienes deudas pendientes.
              </p>
            </div>
          )}

          {itemsToPay.length > 0 && (
            <>
              <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-700 my-4"></div>
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-gray-800 dark:text-white">
                  Total a Pagar
                </span>
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      {totalAmount > 0 && (
        <Button
          onClick={() => onNavigate('payment-method', { totalAmount, itemsToPay })}
          className="shadow-lg shadow-blue-500/30"
        >
          Continuar al Pago
        </Button>
      )}

      {/* Payment History Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icons name="clock" className="w-6 h-6 text-gray-500" />
          Mis Pagos Históricos
        </h2>
        <div className="space-y-3">
          {paymentHistory.length > 0 ? (
            paymentHistory.map((payment) => (
              <div
                key={payment.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(payment.monto)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(payment.fechaPago)} • {payment.metodoPago}
                  </p>
                  {payment.observacion && (
                    <p className="text-xs text-gray-400 italic mt-1">{payment.observacion}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                    Confirmado
                  </span>
                  <button
                    onClick={() => setSelectedPayment(payment)}
                    className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center gap-1 hover:underline"
                  >
                    <Icons name="document-text" className="w-4 h-4" />
                    Recibo
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              No hay pagos registrados.
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedPayment && (
        <PaymentReceiptModal
          payment={selectedPayment}
          user={user}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
};

export const PaymentMethodScreen: React.FC<{
  onNavigate: (page: Page, params?: PageParams | null) => void;
  params: { totalAmount: number; itemsToPay: PayableItem[] };
}> = ({ onNavigate, params }) => {
  const [selectedMethod, setSelectedMethod] = useState('webpay');

  return (
    <div className="p-4 space-y-6 animate-page">
      <div className="flex items-center justify-center space-x-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
          <Icons name="check" className="w-4 h-4" />
        </div>
        <div className="h-1 w-12 bg-blue-600 rounded"></div>
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
          2
        </div>
        <div className="h-1 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center font-bold text-sm">
          3
        </div>
      </div>
      <Card>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Método de Pago</h2>
        <div className="space-y-3">
          {[
            { id: 'webpay', name: 'WebPay Plus', icon: 'credit-card' },
            { id: 'khipu', name: 'Khipu', icon: 'building-library' },
            { id: 'transferencia', name: 'Transferencia', icon: 'banknotes' },
          ].map((method) => (
            <label
              key={method.id}
              className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${selectedMethod === method.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={() => setSelectedMethod(method.id)}
                className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="ml-4 flex items-center">
                <div
                  className={`p-2 rounded-lg ${selectedMethod === method.id ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                >
                  <Icons
                    name={method.icon as 'credit-card' | 'building-library' | 'banknotes'}
                    className="w-6 h-6"
                  />
                </div>
                <span className="ml-3 font-semibold text-gray-900 dark:text-white">
                  {method.name}
                </span>
              </div>
            </label>
          ))}
        </div>
      </Card>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-md mx-auto flex justify-between items-center mb-4">
          <span className="text-gray-500 dark:text-gray-400">Total a pagar:</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(params.totalAmount)}
          </span>
        </div>
        <Button
          onClick={() => onNavigate('payment-confirm', params)}
          className="shadow-lg shadow-blue-500/30"
        >
          Pagar {formatCurrency(params.totalAmount)}
        </Button>
      </div>
      <div className="h-24"></div> {/* Spacer for fixed bottom */}
    </div>
  );
};

export const PaymentConfirmScreen: React.FC<{
  onConfirm: () => void;
  onNavigate: (page: Page, params?: PageParams | null) => void;
  params: { totalAmount: number; itemsToPay: PayableItem[] };
}> = ({ onConfirm, onNavigate, params }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      onConfirm();
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="p-4 space-y-6 animate-page flex flex-col h-full justify-center">
      <div className="flex items-center justify-center space-x-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
          <Icons name="check" className="w-4 h-4" />
        </div>
        <div className="h-1 w-12 bg-green-500 rounded"></div>
        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
          <Icons name="check" className="w-4 h-4" />
        </div>
        <div className="h-1 w-12 bg-blue-600 rounded"></div>
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
          3
        </div>
      </div>

      <Card className="text-center py-8">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Icons name="lock-closed" className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Confirmar Pago</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Estás a un paso de completar tu pago.
        </p>

        <div className="mt-8 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl text-left">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Comercio</span>
            <span className="font-semibold text-gray-900 dark:text-white">Condominio Fácil</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Monto</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(params.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Orden de Compra</span>
            <span className="font-mono text-gray-900 dark:text-white">
              #{Math.floor(Math.random() * 1000000)}
            </span>
          </div>
        </div>
      </Card>

      <div className="space-y-3 pt-4">
        <Button
          onClick={handleConfirm}
          disabled={isLoading}
          className="shadow-lg shadow-blue-500/30"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Procesando...
            </div>
          ) : (
            'Autorizar Pago'
          )}
        </Button>
        <Button
          onClick={() => onNavigate('payment-method', params)}
          variant="secondary"
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export const PaymentReceiptScreen: React.FC<{
  onNavigate: (page: Page) => void;
  user: User;
  params: { totalAmount: number; itemsToPay: PayableItem[] };
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ onNavigate, user, params, showToast }) => {
  return (
    <div className="p-4 space-y-6 animate-page">
      <Card className="relative overflow-hidden !p-0 border-0 shadow-2xl">
        {/* Receipt Header */}
        <div className="bg-green-600 p-6 text-center text-white relative">
          <div
            className="absolute top-0 left-0 w-full h-full bg-white opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2.5px)',
              backgroundSize: '20px 20px',
            }}
          ></div>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Icons name="check" className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">¡Pago Exitoso!</h2>
          <p className="text-green-100 opacity-90">Transacción completada</p>
        </div>

        {/* Receipt Body */}
        <div className="p-6 bg-white dark:bg-gray-800 relative">
          {/* Jagged edge effect */}
          <div
            className="absolute top-0 left-0 w-full h-4 -mt-2 bg-white dark:bg-gray-800"
            style={{
              clipPath:
                'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)',
            }}
          ></div>

          <div className="space-y-4 pt-2">
            <div className="text-center mb-6">
              <p className="text-gray-500 text-sm uppercase tracking-wider">Monto Pagado</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(params.totalAmount)}
              </p>
            </div>

            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date().toLocaleDateString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ID Transacción</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">
                  {Math.random().toString(36).substring(2, 10).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pagado por</span>
                <span className="font-medium text-gray-900 dark:text-white">{user.nombre}</span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Detalle</p>
              {params.itemsToPay.map((item, index) => (
                <div key={index} className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300">{item.description}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <Button
            onClick={() => showToast('Descargando PDF...', 'info')}
            variant="secondary"
            className="!py-2 !text-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <Icons name="download" className="w-4 h-4" /> PDF
            </div>
          </Button>
          <Button
            onClick={() => showToast('Enlace copiado', 'success')}
            variant="secondary"
            className="!py-2 !text-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <Icons name="share" className="w-4 h-4" /> Compartir
            </div>
          </Button>
        </div>
      </Card>

      <Button onClick={() => onNavigate('home')} className="mt-4">
        Volver al Inicio
      </Button>
    </div>
  );
};
