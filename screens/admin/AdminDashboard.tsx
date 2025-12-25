import React, { useState, useMemo } from 'react';
import type { Page, Expense } from '../../types';
import { ExpenseStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import Icons from '../../components/Icons';
import { AdminCreateExpenseModal } from './AdminCreateExpenseModal';
import { AdminRejectExpenseModal } from './AdminRejectExpenseModal';

// Helper function from App.tsx
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

const StatCard: React.FC<{ title: string, value: string | number, icon: string, colorClass: string }> = ({ title, value, icon, colorClass }) => (
    <Card className="flex items-center p-4">
        <div className={`p-3 rounded-full mr-4 ${colorClass}`}>
            <Icons name={icon} className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </Card>
);

export const AdminDashboard: React.FC<{
    expenses: Expense[];
    onNavigate: (page: Page, params?: any) => void;
    onAddExpense: (expense: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>) => void;
    onApproveExpense: (id: number) => void;
    onRejectExpense: (id: number, motivo: string) => void;
    onCloseMonth: () => void;
}> = ({ expenses, onNavigate, onAddExpense, onApproveExpense, onRejectExpense, onCloseMonth }) => {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isRejectModalOpen, setRejectModalOpen] = useState<Expense | null>(null);

    const stats = useMemo(() => {
        const approvedExpenses = expenses.filter(e => e.status === ExpenseStatus.APROBADO);
        const totalApprovedAmount = approvedExpenses.reduce((sum, e) => sum + e.monto, 0);
        const reviewCount = expenses.filter(e => e.status === ExpenseStatus.EN_REVISION).length;
        const totalExpensesCount = expenses.length;
        const expensesWithEvidence = expenses.filter(e => !!e.evidenciaUrl).length;
        const evidencePercentage = totalExpensesCount > 0 ? (expensesWithEvidence / totalExpensesCount) * 100 : 100;

        return { totalApprovedAmount, reviewCount, totalExpensesCount, evidencePercentage };
    }, [expenses]);

    const expensesToReview = useMemo(() => expenses.filter(e => e.status === ExpenseStatus.EN_REVISION), [expenses]);

    return (
        <>
            <div className="p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Gasto Aprobado" value={formatCurrency(stats.totalApprovedAmount)} icon="cash" colorClass="bg-green-500" />
                    <StatCard title="En Revisión" value={stats.reviewCount} icon="hourglass" colorClass="bg-yellow-500" />
                    <StatCard title="Total Cargados" value={stats.totalExpensesCount} icon="receipt-long" colorClass="bg-blue-500" />
                    <StatCard title="% con Evidencia" value={`${stats.evidencePercentage.toFixed(0)}%`} icon="document-check" colorClass="bg-indigo-500" />
                </div>

                <Card>
                     <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <h2 className="text-xl font-bold">Acciones del Mes</h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                             <Button
                               onClick={() => setCreateModalOpen(true)}
                               variant="secondary"
                               className="!w-auto flex-1"
                               aria-label="Agregar gasto"
                               data-testid="add-expense"
                             >
                                 <div className="flex items-center justify-center"><Icons name="plus" className="w-5 h-5 mr-2" /> Cargar Gasto</div>
                             </Button>
                             <Button
                               onClick={onCloseMonth}
                               className="!w-auto flex-1"
                               disabled={stats.reviewCount > 0 || expenses.filter(e => e.status === ExpenseStatus.APROBADO).length === 0}
                               data-testid="btn-publicar"
                             >
                                 <div className="flex items-center justify-center"><Icons name="lock-closed" className="w-5 h-5 mr-2" /> Cerrar Mes</div>
                             </Button>
                             <Button onClick={() => onNavigate('admin-notice-create')} variant="secondary" className="!w-auto flex-1">
                                 <div className="flex items-center justify-center"><Icons name="pencil" className="w-5 h-5 mr-2" /> Crear Aviso</div>
                             </Button>
                        </div>
                    </div>
                </Card>



                <section data-qa="approval-queue">
  <Card>
    <h2 className="text-xl font-bold mb-4">Cola de Aprobación</h2>
    {expensesToReview.length > 0 ? (
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {expensesToReview.map(expense => (
          <li key={expense.id} className="py-3 px-1" data-qa="expense-item">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <p className="font-semibold text-gray-800 dark:text-white">{expense.descripcion}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {expense.proveedor || 'S/P'} - {expense.numeroDocumento || 'S/D'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {expense.categoria} - {new Date(expense.fecha).toLocaleDateString('es-CL')}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-bold text-lg">{formatCurrency(expense.monto)}</p>
                {expense.evidenciaUrl ? (
                  <a
                    href={expense.evidenciaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400"
                    data-qa="link-evidencia"
                  >
                    Ver Evidencia
                  </a>
                ) : (
                  <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Sin Evidencia</p>
                )}
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button
                onClick={() => setRejectModalOpen(expense)}
                variant="danger"
                className="!w-auto !py-1.5 !px-3 !text-sm"
                data-qa="btn-rechazar"
              >
                <div className="flex items-center">
                  <Icons name="x-circle" className="w-4 h-4 mr-1" /> Rechazar
                </div>
              </Button>

              <Button
                onClick={() => onApproveExpense(expense.id)}
                className="!w-auto !py-1.5 !px-3 !text-sm"
                data-qa="btn-aprobar"
              >
                <div className="flex items-center">
                  <Icons name="check" className="w-4 h-4 mr-1" /> Aprobar
                </div>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-600 dark:text-gray-400 text-center py-4">
        No hay gastos pendientes de revisión.
      </p>
    )}
  </Card>
</section>

            </div>
            {isCreateModalOpen && (
                <AdminCreateExpenseModal
                    onClose={() => setCreateModalOpen(false)}
                    onAddExpense={(data) => {
                        onAddExpense(data);
                        setCreateModalOpen(false);
                    }}
                />
            )}
            {isRejectModalOpen && (
                 <AdminRejectExpenseModal
                    expense={isRejectModalOpen}
                    onClose={() => setRejectModalOpen(null)}
                    onReject={(id, motivo) => {
                        onRejectExpense(id, motivo);
                        setRejectModalOpen(null);
                    }}
                 />
            )}
        </>
    );
};
