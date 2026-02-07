import { dataService } from '../services/data';
import { TicketStatus, NoticeType, NoticeStatus, ExpenseCategory, ExpenseStatus } from '../types';

async function testValidation() {
    console.log('Running Validation Tests...');
    let failures = 0;

    // --- Ticket Validation ---
    console.log('--- Testing createTicket ---');

    // Test 1: Title too long
    try {
        await dataService.createTicket({
            titulo: 'a'.repeat(101),
            descripcion: 'Valid description',
        }, 'user-id');
        console.error('FAIL: Expected error for title > 100 chars');
        failures++;
    } catch (e: any) {
        if (e.message === 'El título no debe exceder los 100 caracteres.') {
            console.log('PASS: Caught long title error');
        } else {
            console.error('FAIL: Unexpected error:', e.message);
            failures++;
        }
    }

    // Test 2: Description too long
    try {
        await dataService.createTicket({
            titulo: 'Valid title',
            descripcion: 'a'.repeat(2001),
        }, 'user-id');
        console.error('FAIL: Expected error for description > 2000 chars');
        failures++;
    } catch (e: any) {
        if (e.message === 'La descripción no debe exceder los 2000 caracteres.') {
            console.log('PASS: Caught long description error');
        } else {
            console.error('FAIL: Unexpected error:', e.message);
            failures++;
        }
    }

    // Test 3: Photo too large (if checked)
    try {
        await dataService.createTicket({
            titulo: 'Valid title',
            descripcion: 'Valid description',
            foto: 'a'.repeat(7 * 1024 * 1024 + 1)
        }, 'user-id');
        console.error('FAIL: Expected error for photo > 7MB');
        failures++;
    } catch (e: any) {
        if (e.message === 'La imagen es demasiado grande (máximo 7MB).') {
            console.log('PASS: Caught large photo error');
        } else {
            console.error('FAIL: Unexpected error:', e.message);
            failures++;
        }
    }


    // --- Notice Validation ---
    console.log('--- Testing createNotice ---');

    // Test 4: Notice Title too long
    try {
        await dataService.createNotice({
            titulo: 'a'.repeat(101),
            contenido: 'Valid content',
            tipo: NoticeType.COMUNIDAD
        });
        console.error('FAIL: Expected error for notice title > 100 chars');
        failures++;
    } catch (e: any) {
        if (e.message === 'El título no debe exceder los 100 caracteres.') {
            console.log('PASS: Caught long notice title error');
        } else {
            console.error('FAIL: Unexpected error:', e.message);
            failures++;
        }
    }

    // Test 5: Notice Content too long
    try {
        await dataService.createNotice({
            titulo: 'Valid title',
            contenido: 'a'.repeat(5001),
            tipo: NoticeType.COMUNIDAD
        });
        console.error('FAIL: Expected error for notice content > 5000 chars');
        failures++;
    } catch (e: any) {
        if (e.message === 'El contenido no debe exceder los 5000 caracteres.') {
            console.log('PASS: Caught long notice content error');
        } else {
            console.error('FAIL: Unexpected error:', e.message);
            failures++;
        }
    }


    // --- Expense Validation ---
    console.log('--- Testing addExpense ---');

    // Test 6: Expense Description too long
    try {
        await dataService.addExpense({
            descripcion: 'a'.repeat(201),
            monto: 1000,
            categoria: ExpenseCategory.OTROS
        });
        console.error('FAIL: Expected error for expense description > 200 chars');
        failures++;
    } catch (e: any) {
        if (e.message === 'La descripción no debe exceder los 200 caracteres.') {
            console.log('PASS: Caught long expense description error');
        } else {
            console.error('FAIL: Unexpected error:', e.message);
            failures++;
        }
    }

    // Test 7: Expense Amount <= 0
    try {
        await dataService.addExpense({
            descripcion: 'Valid desc',
            monto: 0,
            categoria: ExpenseCategory.OTROS
        });
        console.error('FAIL: Expected error for expense amount <= 0');
        failures++;
    } catch (e: any) {
        if (e.message === 'El monto debe ser mayor a 0.') {
            console.log('PASS: Caught invalid amount error');
        } else {
            console.error('FAIL: Unexpected error:', e.message);
            failures++;
        }
    }

    if (failures > 0) {
        console.error(`\n${failures} tests failed.`);
        process.exit(1);
    } else {
        console.log('\nAll validation tests passed!');
    }
}

testValidation().catch(console.error);
