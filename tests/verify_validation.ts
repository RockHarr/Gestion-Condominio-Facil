import { validateTicket, validateNotice, validateExpense, validatePoll } from '../services/validation';

function assertThrow(fn: () => void, message: string) {
  try {
    fn();
    console.error(`FAILED: Expected error containing "${message}", but no error was thrown.`);
    process.exit(1);
  } catch (e: any) {
    if (!e.message.includes(message)) {
      console.error(`FAILED: Expected error containing "${message}", but got "${e.message}".`);
      process.exit(1);
    }
    console.log(`PASSED: Caught expected error: "${e.message}"`);
  }
}

function assertSuccess(fn: () => void) {
  try {
    fn();
    console.log('PASSED: Success case.');
  } catch (e: any) {
    console.error(`FAILED: Expected success, but got error: "${e.message}".`);
    process.exit(1);
  }
}

console.log('--- Testing validateTicket ---');
assertSuccess(() => validateTicket({ titulo: 'Valid Title', descripcion: 'Valid Description' }));
assertThrow(() => validateTicket({ titulo: '', descripcion: 'Desc' }), 'El título es obligatorio');
assertThrow(() => validateTicket({ titulo: 'a'.repeat(101), descripcion: 'Desc' }), 'El título no puede exceder los 100 caracteres');
assertThrow(() => validateTicket({ titulo: 'Title', descripcion: '' }), 'La descripción es obligatoria');
assertThrow(() => validateTicket({ titulo: 'Title', descripcion: 'a'.repeat(2001) }), 'La descripción no puede exceder los 2000 caracteres');

console.log('\n--- Testing validateNotice ---');
assertSuccess(() => validateNotice({ titulo: 'Valid Title', contenido: 'Valid Content' }));
assertThrow(() => validateNotice({ titulo: '', contenido: 'Content' }), 'El título es obligatorio');
assertThrow(() => validateNotice({ titulo: 'a'.repeat(101), contenido: 'Content' }), 'El título no puede exceder los 100 caracteres');
assertThrow(() => validateNotice({ titulo: 'Title', contenido: '' }), 'El contenido es obligatorio');
assertThrow(() => validateNotice({ titulo: 'Title', contenido: 'a'.repeat(5001) }), 'El contenido no puede exceder los 5000 caracteres');

console.log('\n--- Testing validateExpense ---');
assertSuccess(() => validateExpense({ descripcion: 'Valid Expense', monto: 1000 }));
assertThrow(() => validateExpense({ descripcion: '', monto: 1000 }), 'La descripción es obligatoria');
assertThrow(() => validateExpense({ descripcion: 'a'.repeat(201), monto: 1000 }), 'La descripción no puede exceder los 200 caracteres');
assertThrow(() => validateExpense({ descripcion: 'Valid', monto: 0 }), 'El monto debe ser mayor a 0');
assertThrow(() => validateExpense({ descripcion: 'Valid', monto: -10 }), 'El monto debe ser mayor a 0');

console.log('\n--- Testing validatePoll ---');
assertSuccess(() => validatePoll('Valid Question', ['Option 1', 'Option 2']));
assertThrow(() => validatePoll('', ['Option 1', 'Option 2']), 'La pregunta es obligatoria');
assertThrow(() => validatePoll('a'.repeat(201), ['Option 1', 'Option 2']), 'La pregunta no puede exceder los 200 caracteres');
assertThrow(() => validatePoll('Question', []), 'Debe haber al menos 2 opciones');
assertThrow(() => validatePoll('Question', ['One']), 'Debe haber al menos 2 opciones');
assertThrow(() => validatePoll('Question', new Array(21).fill('Opt')), 'No puede haber más de 20 opciones');
assertThrow(() => validatePoll('Question', ['Opt 1', '']), 'La opción 2 no puede estar vacía');
assertThrow(() => validatePoll('Question', ['Opt 1', 'a'.repeat(101)]), 'La opción 2 no puede exceder los 100 caracteres');

console.log('\nAll validation tests passed!');
