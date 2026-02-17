import { Ticket, Notice, Expense, Reservation, Poll } from '../types';

export const TICKET_TITLE_MAX_LENGTH = 100;
export const TICKET_DESCRIPTION_MAX_LENGTH = 500;
export const NOTICE_TITLE_MAX_LENGTH = 100;
export const NOTICE_CONTENT_MAX_LENGTH = 1000;
export const EXPENSE_DESCRIPTION_MAX_LENGTH = 200;
export const POLL_QUESTION_MAX_LENGTH = 200;
export const POLL_OPTION_MAX_LENGTH = 100;

export function validateTicket(ticket: Pick<Ticket, 'titulo' | 'descripcion'>) {
  if (!ticket.titulo || ticket.titulo.trim().length === 0) {
    throw new Error('El título del ticket es obligatorio.');
  }
  if (ticket.titulo.length > TICKET_TITLE_MAX_LENGTH) {
    throw new Error(`El título del ticket no puede exceder los ${TICKET_TITLE_MAX_LENGTH} caracteres.`);
  }
  if (!ticket.descripcion || ticket.descripcion.trim().length === 0) {
    throw new Error('La descripción del ticket es obligatoria.');
  }
  if (ticket.descripcion.length > TICKET_DESCRIPTION_MAX_LENGTH) {
    throw new Error(`La descripción del ticket no puede exceder los ${TICKET_DESCRIPTION_MAX_LENGTH} caracteres.`);
  }
}

export function validateNotice(notice: Pick<Notice, 'titulo' | 'contenido'>) {
  if (!notice.titulo || notice.titulo.trim().length === 0) {
    throw new Error('El título del aviso es obligatorio.');
  }
  if (notice.titulo.length > NOTICE_TITLE_MAX_LENGTH) {
    throw new Error(`El título del aviso no puede exceder los ${NOTICE_TITLE_MAX_LENGTH} caracteres.`);
  }
  if (!notice.contenido || notice.contenido.trim().length === 0) {
    throw new Error('El contenido del aviso es obligatorio.');
  }
  if (notice.contenido.length > NOTICE_CONTENT_MAX_LENGTH) {
    throw new Error(`El contenido del aviso no puede exceder los ${NOTICE_CONTENT_MAX_LENGTH} caracteres.`);
  }
}

export function validateExpense(expense: Pick<Expense, 'descripcion' | 'monto' | 'categoria'>) {
  if (!expense.descripcion || expense.descripcion.trim().length === 0) {
    throw new Error('La descripción del gasto es obligatoria.');
  }
  if (expense.descripcion.length > EXPENSE_DESCRIPTION_MAX_LENGTH) {
    throw new Error(`La descripción del gasto no puede exceder los ${EXPENSE_DESCRIPTION_MAX_LENGTH} caracteres.`);
  }
  if (expense.monto <= 0) {
    throw new Error('El monto del gasto debe ser mayor a 0.');
  }
  if (!expense.categoria || expense.categoria.trim().length === 0) {
    throw new Error('La categoría del gasto es obligatoria.');
  }
}

export function validateReservation(reservation: Pick<Reservation, 'startAt' | 'endAt' | 'amenityId'>) {
  if (!reservation.amenityId) {
    throw new Error('El amenity es obligatorio.');
  }
  const start = new Date(reservation.startAt);
  const end = new Date(reservation.endAt);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Fechas de reserva inválidas.');
  }

  if (start < now) {
    throw new Error('No se pueden hacer reservas en el pasado.');
  }

  if (start >= end) {
    throw new Error('La fecha de inicio debe ser anterior a la fecha de término.');
  }

  // Example: prevent extremely long reservations (e.g. > 24 hours) to avoid abuse
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (durationHours > 24) {
      throw new Error('La duración de la reserva no puede exceder las 24 horas.');
  }
}

export function validatePoll(poll: Pick<Poll, 'question' | 'options'>) {
  if (!poll.question || poll.question.trim().length === 0) {
    throw new Error('La pregunta de la encuesta es obligatoria.');
  }
  if (poll.question.length > POLL_QUESTION_MAX_LENGTH) {
    throw new Error(`La pregunta no puede exceder los ${POLL_QUESTION_MAX_LENGTH} caracteres.`);
  }
  if (!poll.options || poll.options.length < 2) {
    throw new Error('La encuesta debe tener al menos 2 opciones.');
  }
  if (poll.options.length > 10) {
      throw new Error('La encuesta no puede tener más de 10 opciones.');
  }
  for (const option of poll.options) {
    if (!option || option.trim().length === 0) {
      throw new Error('Las opciones de la encuesta no pueden estar vacías.');
    }
    if (option.length > POLL_OPTION_MAX_LENGTH) {
      throw new Error(`Las opciones no pueden exceder los ${POLL_OPTION_MAX_LENGTH} caracteres.`);
    }
  }
}

export function validateUserUpdate(updates: Record<string, unknown>) {
    // Prevent updating role or other sensitive fields via client-side logic
    // (This is a defense-in-depth measure, backend RLS/triggers are primary)
    const sensitiveFields = ['role', 'id', 'created_at'];
    for (const field of sensitiveFields) {
        if (field in updates) {
             throw new Error(`No tienes permiso para actualizar el campo '${field}'.`);
        }
    }
}
