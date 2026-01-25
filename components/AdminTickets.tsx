import * as React from 'react';
import { useState } from 'react';
import type { Ticket, Page, PageParams } from '../types';
import { TicketStatus } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';

// Helper
const getStatusColors = (status: TicketStatus): string => {
  const statusColors: { [key in TicketStatus]: string } = {
    [TicketStatus.NUEVO]:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    [TicketStatus.EN_PROCESO]:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    [TicketStatus.RESUELTO]:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    [TicketStatus.CERRADO]:
      'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  };
  return statusColors[status];
};

interface AdminTicketsScreenProps {
  tickets: Ticket[];
  onNavigate: (page: Page, params?: PageParams | null) => void;
}

export const AdminTicketsScreen: React.FC<AdminTicketsScreenProps> = ({ tickets, onNavigate }) => {
  const [filter, setFilter] = useState<TicketStatus | 'TODOS'>('TODOS');
  const filteredTickets = tickets.filter((t) => filter === 'TODOS' || t.estado === filter);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-page pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Tickets</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Administra las solicitudes de los residentes
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
          Total: {tickets.length}
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
        {(['TODOS', ...Object.values(TicketStatus)] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 flex-1 ${
              filter === status
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
            }`}
          >
            {status === 'TODOS' ? 'Todos' : status}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => onNavigate('admin-ticket-detail', { id: ticket.id })}
              className="w-full text-left group"
            >
              <Card className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 group-focus:ring-2 group-focus:ring-blue-500">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusColors(ticket.estado)}`}
                      >
                        {ticket.estado}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">#{ticket.id}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        • {new Date(ticket.fecha).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                      {ticket.titulo}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {ticket.descripcion}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg w-fit">
                      <Icons name="user" className="w-4 h-4" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {ticket.user?.nombre}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span>{ticket.user?.unidad}</span>
                    </div>
                  </div>
                  <div className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors self-center">
                    <Icons name="chevronRight" className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            </button>
          ))
        ) : (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Icons name="ticket" className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay tickets</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              No se encontraron tickets con el filtro seleccionado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface AdminTicketDetailScreenProps {
  ticket: Ticket;
  onUpdateStatus: (id: number, status: TicketStatus) => void;
}

export const AdminTicketDetailScreen: React.FC<AdminTicketDetailScreenProps> = ({
  ticket,
  onUpdateStatus,
}) => {
  const [newStatus, setNewStatus] = useState(ticket.estado);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 animate-page">
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 border-b border-gray-100 dark:border-gray-700 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColors(ticket.estado)}`}
              >
                {ticket.estado}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Ticket #{ticket.id}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{ticket.titulo}</h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-end gap-1">
              <Icons name="calendar" className="w-4 h-4" />
              {new Date(ticket.fecha).toLocaleDateString('es-CL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
            {ticket.user?.nombre.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{ticket.user?.nombre}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Unidad {ticket.user?.unidad}</p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Descripción</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            {ticket.descripcion}
          </p>
        </div>

        {ticket.foto && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Icons name="camera" className="w-5 h-5 text-gray-400" />
              Evidencia Adjunta
            </h3>
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <img
                src={ticket.foto}
                alt="Adjunto del ticket"
                className="w-full h-auto object-cover max-h-96"
              />
            </div>
          </div>
        )}
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Gestionar Estado</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full">
            <label
              htmlFor="status-select"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nuevo Estado
            </label>
            <select
              id="status-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
            >
              {Object.values(TicketStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => onUpdateStatus(ticket.id, newStatus)}
            disabled={newStatus === ticket.estado}
            className="w-full sm:w-auto shadow-md"
          >
            Actualizar Estado
          </Button>
        </div>
      </Card>
    </div>
  );
};
