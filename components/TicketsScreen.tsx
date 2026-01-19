import * as React from 'react';
import { useState } from 'react';
import { Ticket, TicketStatus, Page } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';

// Helper
const getStatusColors = (status: TicketStatus): string => {
    const statusColors: { [key in TicketStatus]: string } = {
        [TicketStatus.NUEVO]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
        [TicketStatus.EN_PROCESO]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
        [TicketStatus.RESUELTO]: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
        [TicketStatus.CERRADO]: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
    };
    return statusColors[status];
};

interface TicketItemProps {
    ticket: Ticket;
    onClick: () => void;
}

const TicketItem: React.FC<TicketItemProps> = ({ ticket, onClick }) => {
    return (
        <button onClick={onClick} className="w-full text-left group">
            <Card className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusColors(ticket.estado)}`}>
                                {ticket.estado}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">#{ticket.id}</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{ticket.titulo}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{ticket.descripcion}</p>

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 dark:text-gray-500">
                            <span className="flex items-center gap-1">
                                <Icons name="calendar" className="w-3 h-3" />
                                {new Date(ticket.fecha).toLocaleDateString('es-CL')}
                            </span>
                            {ticket.foto && (
                                <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                                    <Icons name="camera" className="w-3 h-3" />
                                    Foto adjunta
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                        <Icons name="chevronRight" className="w-5 h-5" />
                    </div>
                </div>
            </Card>
        </button>
    );
};

interface TicketsScreenProps {
    tickets: Ticket[];
    onNavigate: (page: Page, params?: any) => void;
}

export const TicketsScreen: React.FC<TicketsScreenProps> = ({ tickets, onNavigate }) => {
    return (
        <div className="p-4 space-y-4 animate-page pb-24">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mis Tickets</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">{tickets.length} total</span>
            </div>

            {tickets.length > 0 ? (
                <div className="space-y-3">
                    {tickets.map(ticket => (
                        <TicketItem key={ticket.id} ticket={ticket} onClick={() => onNavigate('ticket-detail', { id: ticket.id })} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Icons name="chat-bubble-left-right" className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tienes tickets</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">¿Necesitas ayuda con algo?</p>
                </div>
            )}

            <div className="fixed bottom-24 right-4 z-10">
                <button
                    onClick={() => onNavigate('ticket-create')}
                    className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-transform hover:scale-105 active:scale-95"
                    aria-label="Crear nuevo ticket"
                >
                    <Icons name="plus" className="w-7 h-7" />
                </button>
            </div>
        </div>
    );
};

interface TicketDetailScreenProps {
    ticket: Ticket;
    onUpdateStatus: (id: number, status: TicketStatus) => void;
}

export const TicketDetailScreen: React.FC<TicketDetailScreenProps> = ({ ticket, onUpdateStatus }) => {
    const isClosed = ticket.estado === TicketStatus.CERRADO || ticket.estado === TicketStatus.RESUELTO;

    return (
        <div className="p-4 space-y-4 animate-page">
            <Card>
                <div className="flex justify-between items-start mb-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColors(ticket.estado)}`}>
                        {ticket.estado}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">#{ticket.id}</span>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{ticket.titulo}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <Icons name="calendar" className="w-4 h-4" />
                    {new Date(ticket.fecha).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>

                <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{ticket.descripcion}</p>
                </div>

                {ticket.foto && (
                    <div className="mt-6">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Icons name="camera" className="w-4 h-4" />
                            Evidencia adjunta
                        </p>
                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <img src={ticket.foto} alt="Adjunto del ticket" className="w-full h-auto object-cover max-h-96" />
                        </div>
                    </div>
                )}
            </Card>

            <div className="space-y-3 pt-4">
                {isClosed ? (
                    <Button onClick={() => onUpdateStatus(ticket.id, TicketStatus.NUEVO)} variant="secondary">Reabrir Ticket</Button>
                ) : (
                    <Button onClick={() => onUpdateStatus(ticket.id, TicketStatus.CERRADO)} variant="primary">Marcar como Resuelto y Cerrar</Button>
                )}
            </div>
        </div>
    );
};

interface CreateTicketScreenProps {
    onAddTicket: (ticket: { titulo: string; descripcion: string; foto?: string; }) => void;
}

export const CreateTicketScreen: React.FC<CreateTicketScreenProps> = ({ onAddTicket }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState<string | undefined>(undefined);
    const [photoName, setPhotoName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Security: Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Solo se permiten archivos de imagen (JPG, PNG, etc).');
                return;
            }

            // Security: Validate file size (Max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('La imagen no debe superar los 5MB.');
                return;
            }

            setPhotoName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && description.trim()) {
            onAddTicket({ titulo: title, descripcion: description, foto: photo });
        }
    };

    return (
        <div className="p-4 animate-page">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asunto</label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                maxLength={100}
                                placeholder="Ej: Filtración en el baño"
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                            />
                            <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/100</p>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción detallada</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={5}
                                required
                                maxLength={2000}
                                placeholder="Describe el problema con el mayor detalle posible..."
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                            />
                             <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/2000</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adjuntar foto (opcional)</label>
                            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer relative ${error ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                <div className="space-y-1 text-center">
                                    {photo ? (
                                        <div className="relative">
                                            <img src={photo} alt="Preview" className="mx-auto h-32 object-cover rounded-lg" />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); setPhoto(undefined); setPhotoName(''); setError(null); }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                            >
                                                <Icons name="xmark" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Icons name="camera" className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                    <span>Subir un archivo</span>
                                                    <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG hasta 5MB</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            {error && <p className="text-sm mt-2 text-red-600 dark:text-red-400 font-medium">{error}</p>}
                            {photoName && !photo && !error && <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">Archivo seleccionado: {photoName}</p>}
                        </div>
                    </div>
                </Card>
                <Button type="submit" className="shadow-lg shadow-blue-500/30">Enviar Ticket</Button>
            </form>
        </div>
    );
};
