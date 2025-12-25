import React from 'react';
import type { Expense } from '../../types';

export const AdminRejectExpenseModal: React.FC<{
  expense: Expense;
  onClose: () => void;
  onReject: (id: number, motivo: string) => void;
}> = ({ expense, onClose, onReject }) => {
  const [motivo, setMotivo] = React.useState('');

  return (
    <div role="dialog" aria-label="Rechazar Gasto" className="modal">
      <h3>Rechazar Gasto</h3>
      <p>"{expense?.descripcion ?? ''}"</p>

      <label htmlFor="motivo">Motivo del Rechazo</label>
      <textarea
        id="motivo"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
      />

      <div className="actions">
        <button onClick={onClose}>Cancelar</button>
        <button
          onClick={() => {
            if (!expense || typeof expense.id !== 'number') return;
            if (!motivo.trim()) return;
            onReject(expense.id, motivo.trim());
          }}
        >
          Confirmar Rechazo
        </button>
      </div>
    </div>
  );
};
