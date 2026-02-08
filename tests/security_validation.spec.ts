import { dataService } from '../services/data';

async function testValidation() {
  console.log('Starting validation tests...');
  let passed = 0;
  let failed = 0;

  // Test Ticket Validation
  try {
    console.log('Testing createTicket validation (title)...');
    const longTitle = 'a'.repeat(101);
    await dataService.createTicket({ titulo: longTitle, descripcion: 'ok', foto: '' }, 'user1');
    console.error('❌ createTicket should have failed with long title');
    failed++;
  } catch (e: any) {
    if (e.message.includes('título es demasiado largo')) {
      console.log('✅ createTicket caught long title');
      passed++;
    } else {
      console.error('❌ createTicket failed with unexpected error:', e.message);
      failed++;
    }
  }

  try {
    console.log('Testing createTicket validation (description)...');
    const longDesc = 'a'.repeat(2001);
    await dataService.createTicket({ titulo: 'ok', descripcion: longDesc, foto: '' }, 'user1');
    console.error('❌ createTicket should have failed with long description');
    failed++;
  } catch (e: any) {
    if (e.message.includes('descripción es demasiado larga')) {
      console.log('✅ createTicket caught long description');
      passed++;
    } else {
      console.error('❌ createTicket failed with unexpected error:', e.message);
      failed++;
    }
  }

  // Test Notice Validation
  try {
    console.log('Testing createNotice validation (content)...');
    const longContent = 'a'.repeat(5001);
    // Cast to any to bypass strict type check on missing fields if needed, or provide full mock object
    // Notice requires: titulo, contenido, tipo (enum)
    await dataService.createNotice({
        titulo: 'ok',
        contenido: longContent,
        tipo: 'Comunidad'
    } as any);
    console.error('❌ createNotice should have failed with long content');
    failed++;
  } catch (e: any) {
    if (e.message.includes('contenido es demasiado largo')) {
      console.log('✅ createNotice caught long content');
      passed++;
    } else {
      console.error('❌ createNotice failed with unexpected error:', e.message);
      failed++;
    }
  }

  // Test Expense Validation
  try {
    console.log('Testing addExpense validation (amount)...');
    await dataService.addExpense({
        descripcion: 'ok',
        monto: -100,
        categoria: 'Otros'
    } as any);
    console.error('❌ addExpense should have failed with negative amount');
    failed++;
  } catch (e: any) {
    if (e.message.includes('monto debe ser positivo')) {
      console.log('✅ addExpense caught negative amount');
      passed++;
    } else {
      console.error('❌ addExpense failed with unexpected error:', e.message);
      failed++;
    }
  }

  // Test Poll Validation
  try {
      console.log('Testing createPoll validation (options)...');
      await dataService.createPoll('Question?', ['Option 1'], '2025-01-01', '2025-01-02', 'UNIT', 'LIVE');
      console.error('❌ createPoll should have failed with too few options');
      failed++;
  } catch (e: any) {
      if (e.message.includes('Debe haber al menos 2 opciones')) {
          console.log('✅ createPoll caught too few options');
          passed++;
      } else {
          console.error('❌ createPoll failed with unexpected error:', e.message);
          failed++;
      }
  }

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

testValidation().catch(e => {
    console.error('Unhandled error in test script:', e);
    process.exit(1);
});
