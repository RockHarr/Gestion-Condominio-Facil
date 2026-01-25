import React from 'react';
import type {
  User,
  CommonExpenseDebt,
  ParkingDebt,
  Expense,
  Page,
  PaymentRecord,
  PageParams,
} from '../types';
import { ExpenseStatus } from '../types';
import Icons from './Icons';
import { FinancialCharts } from './FinancialCharts';
import { Card, Button } from './Shared';

interface HomeScreenProps {
  user: User;
  commonExpenseDebts: CommonExpenseDebt[];
  parkingDebts: ParkingDebt[];
  expenses: Expense[];
  paymentHistory: PaymentRecord[];
  theme: 'light' | 'dark';
  onNavigate: (page: Page, params?: PageParams | null) => void;
  onDownloadStatement: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  commonExpenseDebts,
  parkingDebts,
  expenses,
  paymentHistory,
  theme,
  onNavigate,
  onDownloadStatement,
  showToast,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  };

  const unpaidCommonExpenses = commonExpenseDebts.filter((d) => !d.pagado);
  const unpaidParking = parkingDebts.filter((d) => !d.pagado);
  const totalDebt =
    unpaidCommonExpenses.reduce((sum, d) => sum + d.monto, 0) +
    unpaidParking.reduce((sum, d) => sum + d.monto, 0);

  const currentMonthPeriod = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const currentMonthCommonExpense = commonExpenseDebts.find((d) => d.mes === currentMonthPeriod);
  const approvedExpensesThisMonth = expenses.filter(
    (e) => e.status === ExpenseStatus.APROBADO && e.fecha.startsWith(currentMonthPeriod),
  );
  const totalApprovedAmount = approvedExpensesThisMonth.reduce((sum, e) => sum + e.monto, 0);

  return (
    <div className="space-y-6 animate-page pb-24">
      {/* Header Section */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Hola, {user.nombre.split(' ')[0]}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Unidad {user.unidad}</p>
      </div>

      <div className="px-4 space-y-6">
        {/* Debt Card */}
        {totalDebt > 0 ? (
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-xl shadow-blue-200 dark:shadow-none relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <p className="text-blue-100 font-medium mb-1">Total a Pagar</p>
              <p className="text-4xl font-bold mb-4 tracking-tight">{formatCurrency(totalDebt)}</p>
              <div className="flex items-center justify-between">
                <span className="bg-blue-500/30 px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-blue-400/30">
                  {unpaidCommonExpenses.length + unpaidParking.length} cuentas pendientes
                </span>
                <button
                  onClick={() => onNavigate('payments')}
                  className="bg-white text-blue-700 px-6 py-2 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg active:scale-95"
                >
                  Pagar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl p-6 text-white shadow-xl shadow-green-200 dark:shadow-none relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
            <div className="flex flex-col items-center justify-center py-4 relative z-10">
              <div className="bg-white/20 p-3 rounded-full mb-3 backdrop-blur-sm">
                <Icons name="check-badge" className="w-8 h-8 text-white" />
              </div>
              <p className="text-xl font-bold">¡Estás al día!</p>
              <p className="text-green-100 text-sm">No tienes deudas pendientes</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3 px-1">
            Accesos Rápidos
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('reservations')}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Icons name="calendar" className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                Reservar
              </span>
            </button>
            <button
              onClick={() => onNavigate('ticket-create')}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                <Icons name="plus" className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                Nuevo Ticket
              </span>
            </button>
          </div>
        </div>

        {/* Financial Charts */}
        <FinancialCharts expenses={expenses} payments={paymentHistory} theme={theme} />

        {/* Community Expenses Summary */}
        <Card className="!p-0 overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Gastos Comunidad</h2>
              <span className="text-xs font-medium text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md">
                {formatPeriod(currentMonthPeriod)}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {formatCurrency(totalApprovedAmount)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total aprobado este mes</p>
          </div>

          <div className="p-5">
            {approvedExpensesThisMonth.length > 0 ? (
              <ul className="space-y-4">
                {approvedExpensesThisMonth.slice(0, 3).map((expense) => (
                  <li key={expense.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Icons name="receipt-long" className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">
                          {expense.descripcion}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {expense.categoria}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {formatCurrency(expense.monto)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No hay gastos registrados aún.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button
                onClick={() => onNavigate('resident-expenses')}
                variant="secondary"
                className="!py-2.5 !text-sm !bg-gray-100 dark:!bg-gray-700 hover:!bg-gray-200 dark:hover:!bg-gray-600"
              >
                Ver Detalle
              </Button>
              <Button onClick={onDownloadStatement} className="!py-2.5 !text-sm shadow-sm">
                <Icons name="download" className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
