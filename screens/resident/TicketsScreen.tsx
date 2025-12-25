import React from 'react';
import type { Page, Ticket } from '../../types';
import { TicketStatus } from '../../types';
import { Card } from '../../components/common/Card';
import Icons from '../../components/Icons';

// Helper function from App.tsx
const getStatusColors = (status: TicketStatus): string => {
    const statusColors: { [key in TicketStatus]: string } = {
        [TicketStatus.NUEVO]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        [TicketStatus.EN_PROCESO]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        [TicketStatus.RESUELTO]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        [TicketStatus.CERRADO]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return statusColors[status];
};

const TicketItem: React.FC<{ ticket: Ticket; onClick: () => void }> = ({ ticket, onClick }) => {
    return (
        <button onClick={onClick} className="w-full text-left">
            <Card className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white pr-4">{ticket.titulo}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${getStatusColors(ticket.estado)}`}>{ticket.estado}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{new Date(ticket.fecha).toLocaleDateString('es-CL')}</p>
            </Card>
        </button>
    );
};

export const TicketsScreen: React.FC<{ tickets: Ticket[]; onNavigate: (page: Page, params?: any) => void }> = ({ tickets, onNavigate }) => {
    return (
        <div className="p-4 space-y-4">
            {tickets.length > 0 ? (
                tickets.map(ticket => (
                    <TicketItem key={ticket.id} ticket={ticket} onClick={() => onNavigate('ticket-detail', { id: ticket.id })} />
                ))
            ) : (
                <Card className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">No tienes tickets abiertos.</p>
                </Card>
            )}
             <div className="fixed bottom-24 right-4 z-10">
                <button
                    onClick={() => onNavigate('ticket-create')}
                    className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    aria-label="Crear nuevo ticket"
                >
                    <Icons name="plus" className="w-8 h-8"/>
                </button>
            </div>
        </div>
    );
};
