import React, { useState } from 'react';
import type { CommunitySettings } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const AdminSettingsScreen: React.FC<{
    settings: CommunitySettings;
    onUpdateSettings: (settings: CommunitySettings) => void;
}> = ({ settings, onUpdateSettings }) => {
    const [commonExpense, setCommonExpense] = useState(settings.commonExpense.toString());
    const [parkingCost, setParkingCost] = useState(settings.parkingCost.toString());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const commonExpenseNum = parseInt(commonExpense, 10);
        const parkingCostNum = parseInt(parkingCost, 10);
        if (!isNaN(commonExpenseNum) && !isNaN(parkingCostNum)) {
            onUpdateSettings({ commonExpense: commonExpenseNum, parkingCost: parkingCostNum });
        }
    };

    return (
        <div className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="commonExpense" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gasto Común Fijo Mensual (CLP)</label>
                            <input type="number" id="commonExpense" value={commonExpense} onChange={e => setCommonExpense(e.target.value)} required className="mt-1 block w-full input-field" />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Este monto se usará para generar la deuda de gasto común para las nuevas unidades.</p>
                        </div>
                        <div>
                            <label htmlFor="parkingCost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Costo Estacionamiento Mensual (CLP)</label>
                            <input type="number" id="parkingCost" value={parkingCost} onChange={e => setParkingCost(e.target.value)} required className="mt-1 block w-full input-field" />
                             <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Este monto se usará para generar la deuda de estacionamiento para las nuevas unidades que lo tengan asignado.</p>
                        </div>
                    </div>
                </Card>
                <Button type="submit">Guardar Cambios</Button>
            </form>
        </div>
    )
}
