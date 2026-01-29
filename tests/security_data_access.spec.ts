
import 'dotenv/config'; // Load env vars before other imports

import { test, expect } from '@playwright/test';
import { dataService } from '../services/data';
import { supabase } from '../lib/supabase';

// Use env vars or fail if missing (to avoid hardcoding secrets)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rockwell.harrison@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '270386';

test('security: getTickets respects userId filter for Admin', async () => {
    // 1. Login as Admin
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });
    if (loginError) throw loginError;
    const adminId = authData.user.id;

    // 2. Get Resident ID (we need a valid resident email)
    const RESIDENT_EMAIL = process.env.RESIDENT_EMAIL || 'contacto@rockcode.cl';

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', RESIDENT_EMAIL)
        .single();

    if (!profile) throw new Error('Resident profile not found');
    const residentId = profile.id;

    // 3. Create a "Noise" Ticket for Admin
    // This ticket should NOT appear when we ask for Resident's tickets
    const { data: adminTicket, error: createError } = await supabase.from('tickets').insert({
        titulo: 'Admin Noise Ticket - Security Test',
        descripcion: 'This ticket should not be visible when filtering for resident',
        user_id: adminId,
        estado: 'Nuevo'
    }).select().single();

    if (createError) throw createError;

    try {
        // 4. Call getTickets requesting ONLY Resident's tickets
        console.log(`Fetching tickets for resident ${residentId}...`);
        const tickets = await dataService.getTickets(residentId);

        // 5. Verify Admin Ticket is NOT in the list
        const leakedTicket = tickets.find(t => t.id === adminTicket.id);

        if (leakedTicket) {
            console.error('FAIL: Found admin ticket in resident query results!');
            throw new Error(`Security Leak: getTickets(residentId) returned a ticket belonging to another user (Ticket ID ${adminTicket.id})`);
        }

        console.log('Success: Admin ticket was correctly filtered out.');

    } finally {
        // 6. Cleanup
        await supabase.from('tickets').delete().eq('id', adminTicket.id);
    }
});
