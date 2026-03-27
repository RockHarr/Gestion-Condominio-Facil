import {
  validateTicketInput,
  validatePollInput,
  TICKET_TITLE_MAX_LENGTH,
  TICKET_DESC_MAX_LENGTH,
  POLL_QUESTION_MAX_LENGTH,
  POLL_OPTION_MAX_LENGTH,
} from '../services/validation';

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(message);
    }
}

function expectThrow(fn: () => void, messagePart?: string) {
    try {
        fn();
        throw new Error('Expected function to throw but it did not.');
    } catch (error: any) {
        if (error.message === 'Expected function to throw but it did not.') {
            throw error;
        }
        if (messagePart && !error.message.includes(messagePart)) {
            throw new Error(`Expected error message to include "${messagePart}", but got "${error.message}"`);
        }
    }
}

console.log('Starting validation tests...');

// Ticket Tests
console.log('Testing Ticket Validation...');
validateTicketInput('Valid Title', 'Valid Description', null);
validateTicketInput('A'.repeat(TICKET_TITLE_MAX_LENGTH), 'B'.repeat(TICKET_DESC_MAX_LENGTH), null);

expectThrow(() => validateTicketInput('A'.repeat(TICKET_TITLE_MAX_LENGTH + 1), 'Desc', null), 'El título no puede exceder');
expectThrow(() => validateTicketInput('Title', 'B'.repeat(TICKET_DESC_MAX_LENGTH + 1), null), 'La descripción no puede exceder');
expectThrow(() => validateTicketInput('Title', 'Desc', 'A'.repeat(7000001)), 'La foto adjunta es demasiado grande');

// Poll Tests
console.log('Testing Poll Validation...');
const now = new Date();
const future = new Date(now.getTime() + 10000);

validatePollInput('Valid Question?', ['Option 1', 'Option 2'], now.toISOString(), future.toISOString());

expectThrow(() => validatePollInput('A'.repeat(POLL_QUESTION_MAX_LENGTH + 1), ['A'], now.toISOString(), future.toISOString()), 'La pregunta no puede exceder');

const tooManyOptions = new Array(21).fill('Option');
expectThrow(() => validatePollInput('Question', tooManyOptions, now.toISOString(), future.toISOString()), 'No puede haber más de');

const optionTooLong = ['A'.repeat(POLL_OPTION_MAX_LENGTH + 1)];
expectThrow(() => validatePollInput('Question', optionTooLong, now.toISOString(), future.toISOString()), 'Las opciones no pueden exceder');

expectThrow(() => validatePollInput('Question', ['A'], future.toISOString(), now.toISOString()), 'La fecha de fin debe ser posterior');

console.log('All validation tests passed!');
