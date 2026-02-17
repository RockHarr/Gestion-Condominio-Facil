import { test, expect } from '@playwright/test';
import {
  validateTicket,
  validateNotice,
  validateExpense,
  validateReservation,
  validatePoll,
  validateUserUpdate,
  TICKET_TITLE_MAX_LENGTH,
  TICKET_DESCRIPTION_MAX_LENGTH,
  NOTICE_TITLE_MAX_LENGTH,
  NOTICE_CONTENT_MAX_LENGTH,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  POLL_QUESTION_MAX_LENGTH,
  POLL_OPTION_MAX_LENGTH,
} from '../services/validation';
import { ExpenseCategory } from '../types';

test.describe('Validation Services', () => {

  test('validateTicket', () => {
    expect(() => validateTicket({ titulo: 'Valid Title', descripcion: 'Valid Description' })).not.toThrow();

    expect(() => validateTicket({ titulo: '', descripcion: 'Valid' })).toThrow(/título del ticket es obligatorio/);
    expect(() => validateTicket({ titulo: 'a'.repeat(TICKET_TITLE_MAX_LENGTH + 1), descripcion: 'Valid' })).toThrow(/no puede exceder/);
    expect(() => validateTicket({ titulo: 'Valid', descripcion: '' })).toThrow(/descripción del ticket es obligatoria/);
    expect(() => validateTicket({ titulo: 'Valid', descripcion: 'a'.repeat(TICKET_DESCRIPTION_MAX_LENGTH + 1) })).toThrow(/no puede exceder/);
  });

  test('validateNotice', () => {
    expect(() => validateNotice({ titulo: 'Valid', contenido: 'Valid Content' })).not.toThrow();

    expect(() => validateNotice({ titulo: '', contenido: 'Valid' })).toThrow(/título del aviso es obligatorio/);
    expect(() => validateNotice({ titulo: 'a'.repeat(NOTICE_TITLE_MAX_LENGTH + 1), contenido: 'Valid' })).toThrow(/no puede exceder/);
    expect(() => validateNotice({ titulo: 'Valid', contenido: '' })).toThrow(/contenido del aviso es obligatorio/);
    expect(() => validateNotice({ titulo: 'Valid', contenido: 'a'.repeat(NOTICE_CONTENT_MAX_LENGTH + 1) })).toThrow(/no puede exceder/);
  });

  test('validateExpense', () => {
    const validExpense = { descripcion: 'Valid', monto: 100, categoria: ExpenseCategory.MANTENIMIENTO };
    expect(() => validateExpense(validExpense)).not.toThrow();

    expect(() => validateExpense({ ...validExpense, descripcion: '' })).toThrow(/descripción del gasto es obligatoria/);
    expect(() => validateExpense({ ...validExpense, descripcion: 'a'.repeat(EXPENSE_DESCRIPTION_MAX_LENGTH + 1) })).toThrow(/no puede exceder/);
    expect(() => validateExpense({ ...validExpense, monto: 0 })).toThrow(/monto del gasto debe ser mayor a 0/);
    expect(() => validateExpense({ ...validExpense, monto: -10 })).toThrow(/monto del gasto debe ser mayor a 0/);
    // @ts-ignore
    expect(() => validateExpense({ ...validExpense, categoria: '' })).toThrow(/categoría del gasto es obligatoria/);
  });

  test('validateReservation', () => {
    const now = new Date();
    const start = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now
    const end = new Date(start.getTime() + 1000 * 60 * 60); // 1 hour after start

    expect(() => validateReservation({ startAt: start.toISOString(), endAt: end.toISOString(), amenityId: '1' })).not.toThrow();

    const past = new Date(now.getTime() - 1000 * 60 * 60);
    expect(() => validateReservation({ startAt: past.toISOString(), endAt: end.toISOString(), amenityId: '1' })).toThrow(/en el pasado/);

    expect(() => validateReservation({ startAt: end.toISOString(), endAt: start.toISOString(), amenityId: '1' })).toThrow(/debe ser anterior/);

    expect(() => validateReservation({ startAt: start.toISOString(), endAt: end.toISOString(), amenityId: '' })).toThrow(/amenity es obligatorio/);

    const longEnd = new Date(start.getTime() + 1000 * 60 * 60 * 25);
    expect(() => validateReservation({ startAt: start.toISOString(), endAt: longEnd.toISOString(), amenityId: '1' })).toThrow(/no puede exceder las 24 horas/);
  });

  test('validatePoll', () => {
    expect(() => validatePoll({ question: 'Valid?', options: ['Yes', 'No'] })).not.toThrow();

    expect(() => validatePoll({ question: '', options: ['Yes', 'No'] })).toThrow(/pregunta de la encuesta es obligatoria/);
    expect(() => validatePoll({ question: 'a'.repeat(POLL_QUESTION_MAX_LENGTH + 1), options: ['Yes', 'No'] })).toThrow(/no puede exceder/);
    expect(() => validatePoll({ question: 'Valid?', options: [] })).toThrow(/al menos 2 opciones/);
    expect(() => validatePoll({ question: 'Valid?', options: ['One'] })).toThrow(/al menos 2 opciones/);
    expect(() => validatePoll({ question: 'Valid?', options: Array(11).fill('Opt') })).toThrow(/no puede tener más de 10 opciones/);
    expect(() => validatePoll({ question: 'Valid?', options: ['Yes', ''] })).toThrow(/no pueden estar vacías/);
    expect(() => validatePoll({ question: 'Valid?', options: ['Yes', 'a'.repeat(POLL_OPTION_MAX_LENGTH + 1)] })).toThrow(/no pueden exceder/);
  });

  test('validateUserUpdate', () => {
    expect(() => validateUserUpdate({ nombre: 'New Name', unidad: '101' })).not.toThrow();

    expect(() => validateUserUpdate({ role: 'admin' })).toThrow(/No tienes permiso para actualizar el campo 'role'/);
    expect(() => validateUserUpdate({ id: '123' })).toThrow(/No tienes permiso para actualizar el campo 'id'/);
    expect(() => validateUserUpdate({ created_at: '2023' })).toThrow(/No tienes permiso para actualizar el campo 'created_at'/);
  });

});
