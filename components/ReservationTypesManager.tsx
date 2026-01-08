import * as React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Amenity, ReservationType, Page } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';

interface ReservationTypesManagerProps {
    onNavigate: (page: Page, params?: any) => void;
    amenityId?: number; // Optional filter
}

export const ReservationTypesManager: React.FC<ReservationTypesManagerProps> = ({ onNavigate, amenityId }) => {
    const [types, setTypes] = useState<ReservationType[]>([]);
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<ReservationType | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [selectedAmenityId, setSelectedAmenityId] = useState<number | ''>('');
    const [fee, setFee] = useState<string>('');
    const [deposit, setDeposit] = useState<string>('');
    const [maxDuration, setMaxDuration] = useState<string>(''); // in minutes
    const [rules, setRules] = useState('');
    const [requiresApproval, setRequiresApproval] = useState(true);

    useEffect(() => {
        fetchData();
    }, [amenityId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [typesRes, amenitiesRes] = await Promise.all([
                supabase.from('reservation_types').select('*').order('amenity_id', { ascending: true }),
                supabase.from('amenities').select('*')
            ]);

            if (typesRes.error) throw typesRes.error;
            if (amenitiesRes.error) throw amenitiesRes.error;

            let fetchedTypes = typesRes.data || [];
            if (amenityId) {
                fetchedTypes = fetchedTypes.filter(t => t.amenity_id === amenityId);
                setSelectedAmenityId(amenityId);
            }

            setTypes(fetchedTypes);
            setAmenities(amenitiesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (type?: ReservationType) => {
        if (type) {
            setEditingType(type);
            setName(type.name);
            setSelectedAmenityId(type.amenity_id);
            setFee(type.fee_amount.toString());
            setDeposit(type.deposit_amount.toString());
            setMaxDuration(type.max_duration_minutes.toString());
            setRules(type.rules || '');
            setRequiresApproval(type.requires_approval);
        } else {
            setEditingType(null);
            setName('');
            // If we are in a specific amenity view, pre-select it
            setSelectedAmenityId(amenityId || '');
            setFee('0');
            setDeposit('0');
            setMaxDuration('240'); // 4 hours default
            setRules('');
            setRequiresApproval(true);
        }
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAmenityId) return alert('Debes seleccionar un espacio');

        try {
            const typeData = {
                name,
                amenity_id: Number(selectedAmenityId),
                fee_amount: Number(fee),
                deposit_amount: Number(deposit),
                max_duration_minutes: Number(maxDuration),
                rules,
                requires_approval: requiresApproval
            };

            if (editingType) {
                const { error } = await supabase
                    .from('reservation_types')
                    .update(typeData)
                    .eq('id', editingType.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('reservation_types')
                    .insert([typeData]);
                if (error) throw error;
            }

            setModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving type:', error);
            alert('Error al guardar el tipo de reserva');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro? Se borrarán las configuraciones asociadas.')) return;

        try {
            const { error } = await supabase
                .from('reservation_types')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting type:', error);
            alert('Error al eliminar');
        }
    };

    const getAmenityName = (id: number) => amenities.find(a => a.id === id)?.name || 'Desconocido';

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-page pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <button
                            onClick={() => onNavigate('admin-amenities')}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <Icons name="arrow-left" className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tipos de Reserva</h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 ml-7">
                        {amenityId
                            ? `Configurando reservas para: ${getAmenityName(amenityId)}`
                            : 'Configura tarifas, reglas y tiempos para cada espacio.'}
                    </p>
                </div>
                <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-blue-500/30">
                    <Icons name="plus" className="w-4 h-4 mr-2" /> Nuevo Tipo
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {types.map((type) => (
                        <Card key={type.id} className="group hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700 relative">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(type)}
                                    className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-600 hover:bg-blue-50"
                                >
                                    <Icons name="pencil" className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(type.id)}
                                    className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-red-600 hover:bg-red-50"
                                >
                                    <Icons name="trash" className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                                    {getAmenityName(type.amenity_id)}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{type.name}</h3>

                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex justify-between">
                                    <span>Tarifa:</span>
                                    <span className="font-medium">{type.fee_amount > 0 ? `$${type.fee_amount.toLocaleString()}` : 'Gratis'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Garantía:</span>
                                    <span className="font-medium">{type.deposit_amount > 0 ? `$${type.deposit_amount.toLocaleString()}` : 'No requiere'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Duración máx:</span>
                                    <span className="font-medium">{type.max_duration_minutes / 60} horas</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Aprobación:</span>
                                    <span className={`font-medium ${type.requires_approval ? 'text-yellow-600' : 'text-green-600'}`}>
                                        {type.requires_approval ? 'Manual' : 'Automática'}
                                    </span>
                                </div>
                            </div>

                            {type.rules && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic">
                                        "{type.rules}"
                                    </p>
                                </div>
                            )}
                        </Card>
                    ))}

                    {types.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <Icons name="clipboard-document-list" className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay tipos de reserva</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Crea reglas de uso para tus espacios comunes.</p>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingType ? 'Editar Tipo de Reserva' : 'Nuevo Tipo de Reserva'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <Icons name="xmark" className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Espacio Común</label>
                                <select
                                    value={selectedAmenityId}
                                    onChange={e => setSelectedAmenityId(Number(e.target.value))}
                                    required
                                    disabled={!!amenityId} // Lock if filtered
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                                >
                                    <option value="">Seleccionar...</option>
                                    {amenities.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Tipo</label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                                    placeholder="Ej: Cumpleaños, Asado Familiar, Evento Masivo"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="fee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarifa (CLP)</label>
                                    <input
                                        id="fee"
                                        type="number"
                                        value={fee}
                                        onChange={e => setFee(e.target.value)}
                                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="deposit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Garantía (CLP)</label>
                                    <input
                                        id="deposit"
                                        type="number"
                                        value={deposit}
                                        onChange={e => setDeposit(e.target.value)}
                                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="maxDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración Máxima (minutos)</label>
                                <input
                                    id="maxDuration"
                                    type="number"
                                    value={maxDuration}
                                    onChange={e => setMaxDuration(e.target.value)}
                                    required
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                                    placeholder="Ej: 240 (4 horas)"
                                />
                            </div>

                            <div>
                                <label htmlFor="rules" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reglas de Uso</label>
                                <textarea
                                    id="rules"
                                    value={rules}
                                    onChange={e => setRules(e.target.value)}
                                    rows={3}
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                                    placeholder="Normas específicas para este tipo de reserva..."
                                />
                            </div>

                            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="requiresApproval"
                                    checked={requiresApproval}
                                    onChange={e => setRequiresApproval(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="requiresApproval" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                    Requiere aprobación del administrador
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1">
                                    Guardar
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
