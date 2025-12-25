import React, { useState } from 'react';
import type { Expense } from '../../types';
import { ExpenseCategory } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const AdminCreateExpenseModal: React.FC<{
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>) => void
}> = ({ onClose, onAddExpense }) => {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState<ExpenseCategory>(ExpenseCategory.OTROS);
  const [proveedor, setProveedor] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');

  // NUEVO: fecha (solo para validar UI; no se envía a DB)
  const todayISO = new Date().toISOString().slice(0, 10);
  const [fechaGasto, setFechaGasto] = useState<string>(todayISO);
  const [fechaError, setFechaError] = useState<string>('');

  // NUEVO: adjunto (validación 5MB)
  const [fileName, setFileName] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const [adjuntoOK, setAdjuntoOK] = useState<boolean>(false);

  // Mantener compatibilidad con tu antiguo “simular adjunto”
  const [hasEvidencia, setHasEvidencia] = useState(false);

  const MAX_BYTES = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFileName('');
      setFileError('');
      setAdjuntoOK(false);
      setHasEvidencia(false);
      return;
    }
    setFileName(f.name);
    if (f.size > MAX_BYTES) {
      setFileError('El adjunto supera 5 MB. Reduce el tamaño para continuar.');
      setAdjuntoOK(false);
      setHasEvidencia(false);
    } else {
      setFileError('');
      setAdjuntoOK(true);
      setHasEvidencia(true);
    }
  };

  const validateFecha = (value: string) => {
    // Comparación por fecha (no por string)
    const picked = new Date(value + 'T00:00:00');
    const today = new Date(todayISO + 'T00:00:00');
    if (picked.getTime() > today.getTime()) {
      setFechaError('La fecha no puede ser futura.');
      return false;
    }
    setFechaError('');
    return true;
  };

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFechaGasto(val);
    validateFecha(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const montoNum = parseInt(monto, 10);

    const okFecha = validateFecha(fechaGasto);
    if (!okFecha) return;

    if (fileError) return;            // Bloquea si adjunto > 5MB
    if (isNaN(montoNum) || montoNum <= 0) return;
    if (!descripcion.trim()) return;

    // evidenciaUrl: solo si adjunto válido o si el usuario marcó “simular adjunto”
    const evidenciaUrl = (adjuntoOK || hasEvidencia) ? '#' : undefined;

    onAddExpense({
      descripcion,
      monto: montoNum,
      categoria,
      proveedor,
      numeroDocumento,
      evidenciaUrl,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cargar Nuevo Gasto</h2>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
              <input id="descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} required className="mt-1 block w-full input-field" />
            </div>

            <div>
              <label htmlFor="monto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto (CLP)</label>
              <input id="monto" type="number" value={monto} onChange={e => setMonto(e.target.value)} required className="mt-1 block w-full input-field" />
            </div>

            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
              <select id="categoria" value={categoria} onChange={e => setCategoria(e.target.value as ExpenseCategory)} className="mt-1 block w-full input-field">
                {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="proveedor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proveedor</label>
              <input id="proveedor" value={proveedor} onChange={e => setProveedor(e.target.value)} className="mt-1 block w-full input-field" />
            </div>

            <div>
              <label htmlFor="numeroDocumento" className="block text-sm font-medium text-gray-700 dark:text-gray-300">N° Documento</label>
              <input id="numeroDocumento" value={numeroDocumento} onChange={e => setNumeroDocumento(e.target.value)} className="mt-1 block w-full input-field" />
            </div>

            {/* NUEVO: Fecha del gasto (solo validación UI) */}
            <div>
              <label htmlFor="fechaGasto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha del gasto</label>
              <input
                id="fechaGasto"
                type="date"
                value={fechaGasto}
                max={todayISO}
                onChange={handleFechaChange}
                className="mt-1 block w-full input-field"
                aria-invalid={!!fechaError}
                aria-describedby={fechaError ? 'fechaGasto-error' : undefined}
              />
              {fechaError && <p id="fechaGasto-error" className="mt-1 text-sm text-red-600">{fechaError}</p>}
            </div>

            {/* NUEVO: Adjunto con validación 5MB */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adjuntar evidencia (máx. 5MB)</label>
              <div className="mt-1">
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  aria-invalid={!!fileError}
                  aria-describedby={fileError ? 'file-error' : undefined}
                  className="block w-full text-sm text-gray-900 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                {fileName && !fileError && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Seleccionado: {fileName}</p>}
                {fileError && <p id="file-error" className="mt-1 text-sm text-red-600">{fileError}</p>}
              </div>

              {/* Switch para “simular adjunto” (opcional, mantiene tu flujo anterior) */}
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="hasEvidencia"
                  checked={hasEvidencia}
                  onChange={e => {
                    // Si el user marca manualmente, solo permítelo si no hay error de tamaño
                    if (fileError) {
                      setHasEvidencia(false);
                      return;
                    }
                    setHasEvidencia(e.target.checked);
                    setAdjuntoOK(e.target.checked || adjuntoOK);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hasEvidencia" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Marcar como “con evidencia” (simulado)
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button
              type="submit"
              // Deshabilita si hay errores de fecha/archivo o datos mínimos inválidos
              disabled={
                !!fileError ||
                !!fechaError ||
                !descripcion.trim() ||
                isNaN(parseInt(monto, 10)) ||
                parseInt(monto, 10) <= 0
              }
            >
              Enviar a Revisión
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
