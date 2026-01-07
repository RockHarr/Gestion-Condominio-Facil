import React, { useState, useEffect } from 'react';
import { Button, Card, SkeletonLoader } from './Shared';
import { dataService } from '../services/data';
import Icons from './Icons';

interface Poll {
    id: number;
    question: string;
    start_at: string;
    end_at: string;
    weighting_strategy: 'UNIT' | 'ALICUOTA';
    show_results_when: 'LIVE' | 'CLOSED';
    created_at: string;
    closed_at?: string;
    close_reason?: string;
}

export const AdminPollsManager: React.FC = () => {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
    const [closeReason, setCloseReason] = useState('');

    // Create Form State
    const [newPoll, setNewPoll] = useState({
        question: '',
        options: ['', ''],
        startAt: '',
        endAt: '',
        strategy: 'UNIT' as 'UNIT' | 'ALICUOTA',
        showResultsWhen: 'CLOSED' as 'LIVE' | 'CLOSED'
    });

    useEffect(() => {
        loadPolls();
    }, []);

    const loadPolls = async () => {
        setLoading(true);
        try {
            const data = await dataService.getPolls();
            setPolls(data || []);
        } catch (error) {
            console.error('Error loading polls:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePoll = async () => {
        if (!newPoll.question || newPoll.options.some(o => !o.trim()) || !newPoll.startAt || !newPoll.endAt) {
            alert('Por favor complete todos los campos y asegúrese de que las opciones no estén vacías.');
            return;
        }
        if (new Date(newPoll.endAt) <= new Date(newPoll.startAt)) {
            alert('La fecha de fin debe ser posterior a la de inicio.');
            return;
        }

        try {
            await dataService.createPoll(
                newPoll.question,
                newPoll.options,
                newPoll.startAt,
                newPoll.endAt,
                newPoll.strategy,
                newPoll.showResultsWhen
            );
            alert('Encuesta creada exitosamente.');
            setShowCreateModal(false);
            setNewPoll({
                question: '',
                options: ['', ''],
                startAt: '',
                endAt: '',
                strategy: 'UNIT',
                showResultsWhen: 'CLOSED'
            });
            loadPolls();
        } catch (error) {
            console.error('Error creating poll:', error);
            alert('Error al crear encuesta.');
        }
    };

    const handleCloseEarly = async () => {
        if (!selectedPoll || !closeReason.trim()) {
            alert('Debe indicar un motivo para el cierre anticipado.');
            return;
        }

        if (!window.confirm('¿Está seguro de cerrar esta encuesta anticipadamente? Esta acción es irreversible.')) return;

        try {
            await dataService.closePollEarly(selectedPoll.id, closeReason);
            alert('Encuesta cerrada exitosamente.');
            setShowCloseModal(false);
            setCloseReason('');
            setSelectedPoll(null);
            loadPolls();
        } catch (error) {
            console.error('Error closing poll:', error);
            alert('Error al cerrar encuesta.');
        }
    };

    const addOption = () => setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
    const removeOption = (index: number) => {
        if (newPoll.options.length <= 2) return;
        setNewPoll({ ...newPoll, options: newPoll.options.filter((_, i) => i !== index) });
    };
    const updateOption = (index: number, value: string) => {
        const newOptions = [...newPoll.options];
        newOptions[index] = value;
        setNewPoll({ ...newPoll, options: newOptions });
    };

    if (loading) return <SkeletonLoader className="h-64" />;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Votaciones</h1>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <Icons name="plus" className="w-4 h-4 mr-2" />
                    Nueva Encuesta
                </Button>
            </div>

            <div className="grid gap-6">
                {polls.map(poll => {
                    const isActive = !poll.closed_at && new Date() >= new Date(poll.start_at) && new Date() < new Date(poll.end_at);
                    const isClosed = poll.closed_at || new Date() >= new Date(poll.end_at);
                    const isScheduled = !poll.closed_at && new Date() < new Date(poll.start_at);

                    return (
                        <Card key={poll.id} className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide
                                            ${isActive ? 'bg-green-100 text-green-800' :
                                                isClosed ? 'bg-gray-100 text-gray-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {isActive ? 'Activa' : isClosed ? 'Cerrada' : 'Programada'}
                                        </span>
                                        <span className="text-xs text-gray-500">#{poll.id}</span>
                                        {poll.weighting_strategy === 'ALICUOTA' && (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">
                                                Ponderada
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{poll.question}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(poll.start_at).toLocaleDateString()} - {new Date(poll.end_at).toLocaleDateString()}
                                    </p>
                                    {poll.closed_at && (
                                        <p className="text-sm text-red-600 mt-1">
                                            <strong>Cierre Anticipado:</strong> {poll.close_reason} ({new Date(poll.closed_at).toLocaleString()})
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {isActive && (
                                        <Button variant="danger" onClick={() => { setSelectedPoll(poll); setShowCloseModal(true); }}>
                                            Cerrar Ahora
                                        </Button>
                                    )}
                                    {/* Add View Results button logic later if needed, or rely on PollsScreen for results */}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Nueva Encuesta</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pregunta</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    value={newPoll.question}
                                    onChange={e => setNewPoll({ ...newPoll, question: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Inicio</label>
                                    <input
                                        type="datetime-local"
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={newPoll.startAt}
                                        onChange={e => setNewPoll({ ...newPoll, startAt: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fin</label>
                                    <input
                                        type="datetime-local"
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={newPoll.endAt}
                                        onChange={e => setNewPoll({ ...newPoll, endAt: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estrategia</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={newPoll.strategy}
                                        onChange={e => setNewPoll({ ...newPoll, strategy: e.target.value as any })}
                                    >
                                        <option value="UNIT">1 Unidad = 1 Voto</option>
                                        <option value="ALICUOTA">Ponderado por Alícuota</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resultados Visibles</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={newPoll.showResultsWhen}
                                        onChange={e => setNewPoll({ ...newPoll, showResultsWhen: e.target.value as any })}
                                    >
                                        <option value="CLOSED">Solo al Cerrar</option>
                                        <option value="LIVE">En Vivo</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Opciones</label>
                                {newPoll.options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            value={opt}
                                            onChange={e => updateOption(idx, e.target.value)}
                                            placeholder={`Opción ${idx + 1}`}
                                        />
                                        {newPoll.options.length > 2 && (
                                            <Button variant="secondary" onClick={() => removeOption(idx)}>X</Button>
                                        )}
                                    </div>
                                ))}
                                <Button variant="secondary" onClick={addOption} className="w-full mt-2">+ Agregar Opción</Button>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                                <Button variant="primary" onClick={handleCreatePoll}>Crear Encuesta</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Close Modal */}
            {showCloseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Cierre Anticipado</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Indique el motivo por el cual desea cerrar esta encuesta antes de tiempo.
                        </p>
                        <textarea
                            className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white mb-4"
                            rows={3}
                            value={closeReason}
                            onChange={e => setCloseReason(e.target.value)}
                            placeholder="Motivo del cierre..."
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setShowCloseModal(false)}>Cancelar</Button>
                            <Button variant="danger" onClick={handleCloseEarly}>Confirmar Cierre</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
