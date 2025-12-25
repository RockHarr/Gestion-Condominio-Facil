import React, { useState } from 'react';
import type { Page, Ticket } from '../../types';
import { TicketStatus } from '../../types';
import { Card } from '../../components/common/Card';

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

export const AdminTicketsScreen: React.FC<{ tickets: Ticket[], onNavigate: (page: Page, params?: any) => void }> = ({ tickets, onNavigate }) => {
    const [filter, setFilter] = useState<TicketStatus | 'TODOS'>('TODOS');
    const filteredTickets = tickets.filter(t => filter === 'TODOS' || t.estado === filter);

    return (
        <div className="p-4 md:p-6 space-y-4">
             <div className="flex space-x-2 overflow-x-auto pb-2">
                {(['TODOS', ...Object.values(TicketStatus)] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap ${filter === status ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>
            <div className="space-y-4">
                {filteredTickets.map(ticket => (
                    <button key={ticket.id} onClick={() => onNavigate('admin-ticket-detail', { id: ticket.id })} className="w-full text-left">
                        <Card className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex justify_between items-start gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.user?.nombre} ({ticket.user?.unidad})</p>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text_WHITE">{ticket.titulo}</h3>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${getStatusColors(ticket.estado)}`}>{ticket.estado}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{new Date(ticket.fecha).toLocaleDateString('es-CL')}</p>
                        </Card>
                    </button>
                ))}
            </div>
        </div>
    );
};
