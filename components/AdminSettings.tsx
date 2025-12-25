import * as React from 'react';
import { useState } from 'react';
import { CommunitySettings } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';

interface AdminSettingsScreenProps {
    settings: CommunitySettings;
    onUpdateSettings: (settings: CommunitySettings) => void;
}

export const AdminSettingsScreen: React.FC<AdminSettingsScreenProps> = ({ settings, onUpdateSettings }) => {
    const [commonExpense, setCommonExpense] = useState(settings.commonExpense.toString());
    const [parkingCost, setParkingCost] = useState(settings.parkingCost.toString());
    const [isSaved, setIsSaved] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const commonExpenseNum = parseInt(commonExpense, 10);
        const parkingCostNum = parseInt(parkingCost, 10);
        if (!isNaN(commonExpenseNum) && !isNaN(parkingCostNum)) {
            onUpdateSettings({ commonExpense: commonExpenseNum, parkingCost: parkingCostNum });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto animate-page">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración del Condominio</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Ajusta los valores globales para la generación de gastos</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-blue-100 dark:border-blue-800 flex items-start gap-3">
                        <Icons name="information-circle" className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            Estos valores se utilizarán automáticamente al cerrar el mes para calcular las deudas de cada unidad.
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <label htmlFor="commonExpense" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                Gasto Común Fijo Mensual (CLP)
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input
                                    type="number"
                                    id="commonExpense"
                                    value={commonExpense}
                                    onChange={e => setCommonExpense(e.target.value)}
                                    required
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3"
                                    placeholder="0"
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <span className="text-gray-500 sm:text-sm">CLP</span>
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Valor base aplicado a todas las unidades.</p>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                            <label htmlFor="parkingCost" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                Costo Estacionamiento Mensual (CLP)
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input
                                    type="number"
                                    id="parkingCost"
                                    value={parkingCost}
                                    onChange={e => setParkingCost(e.target.value)}
                                    required
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3"
                                    placeholder="0"
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <span className="text-gray-500 sm:text-sm">CLP</span>
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Adicional para unidades con estacionamiento asignado.</p>
                        </div>
                    </div>
                </Card>

                <div className="flex items-center gap-4">
                    <Button type="submit" className="shadow-lg shadow-blue-500/30 w-full md:w-auto" disabled={isSaved}>
                        {isSaved ? (
                            <div className="flex items-center justify-center">
                                <Icons name="check" className="w-5 h-5 mr-2" /> Guardado
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <Icons name="arrow-path" className="w-5 h-5 mr-2" /> Guardar Cambios
                            </div>
                        )}
                    </Button>
                    {isSaved && (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium animate-in fade-in slide-in-from-left-2">
                            ¡Configuración actualizada correctamente!
                        </span>
                    )}
                </div>
            </form>
        </div>
    )
}
