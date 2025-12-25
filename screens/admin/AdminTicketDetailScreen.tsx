import React, { useState } from 'react';
import type { Ticket } from '../../types';
import { TicketStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const AdminTicketDetailScreen: React.FC<{ ticket: Ticket, onUpdateStatus: (id: number, status: TicketStatus) => void }> = ({ ticket, onUpdateStatus }) => {
    const [newStatus, setNewStatus] = useState(ticket.estado);

    return (
        <div className="p-4 md:p-6 space-y-4">
            <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400">De: {ticket.user?.nombre} ({ticket.user?.unidad})</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ticket #{ticket.id} - {new Date(ticket.fecha).toLocaleDateString('es-CL')}</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{ticket.titulo}</h2>
                <p className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.descripcion}</p>
                {ticket.foto && (
                    <div className="mt-4">
                        <p className="font-semibold mb-2">Foto adjunta:</p>
                        <img src={ticket.foto} alt="Adjunto del ticket" className="rounded-lg max-w-full h-auto" />
                    </div>
                )}
            </Card>
            <Card>
                 <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cambiar Estado</label>
                 <select
                    id="status-select"
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as TicketStatus)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                 >
                     {Object.values(TicketStatus).map(status => <option key={status} value={status}>{status}</option>)}
                 </select>
                 <Button onClick={() => onUpdateStatus(ticket.id, newStatus)} className="mt-4" disabled={newStatus === ticket.estado}>
                     Actualizar Estado
                 </Button>
            </Card>
        </div>
    );
};
