import React from 'react';
import type { Ticket } from '../../types';
import { TicketStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const TicketDetailScreen: React.FC<{ ticket: Ticket, onUpdateStatus: (id: number, status: TicketStatus) => void }> = ({ ticket, onUpdateStatus }) => {
    const isClosed = ticket.estado === TicketStatus.CERRADO || ticket.estado === TicketStatus.RESUELTO;

    return (
        <div className="p-4 space-y-4">
            <Card>
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
             <div className="space-y-3">
                 {isClosed ? (
                    <Button onClick={() => onUpdateStatus(ticket.id, TicketStatus.NUEVO)} variant="secondary">Reabrir Ticket</Button>
                 ) : (
                    <Button onClick={() => onUpdateStatus(ticket.id, TicketStatus.CERRADO)} variant="primary">Marcar como Resuelto y Cerrar</Button>
                 )}
            </div>
        </div>
    );
};
