# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/reservations_concurrency.spec.ts >> Reservations - Concurrency Check >> should prevent double booking on simultaneous requests
- Location: tests/e2e/reservations_concurrency.spec.ts:51:5

# Error details

```
Error: Login failed
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { createClient } from '@supabase/supabase-js';
  3   |
  4   | // Credentials (hardcoded for test execution)
  5   | const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
  6   | const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'dummy_key';
  7   |
  8   | const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  9   |
  10  | const RESIDENT_EMAIL = 'contacto@rockcode.cl';
  11  | const RESIDENT_PASSWORD = process.env.TEST_RESIDENT_PASSWORD || 'dummy_resident_pwd';
  12  |
  13  | test.describe('Reservations - Concurrency Check', () => {
  14  |     let amenityId: number;
  15  |     let typeId: number;
  16  |     let unitId: number;
  17  |     let userId: string;
  18  |
  19  |     test.beforeAll(async () => {
  20  |         // 1. Get User/Unit Info
  21  |         const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  22  |             email: RESIDENT_EMAIL,
  23  |             password: RESIDENT_PASSWORD
  24  |         });
> 25  |         if (authError || !authData.user) throw new Error('Login failed');
      |                                                ^ Error: Login failed
  26  |         userId = authData.user.id;
  27  |
  28  |         const { data: profile } = await supabase.from('profiles').select('unit_id').eq('id', userId).single();
  29  |         if (!profile) throw new Error('Profile not found');
  30  |         unitId = profile.unit_id;
  31  |
  32  |         // Ensure no debt exists (cleanup from other tests)
  33  |         await supabase.from('common_expense_debts').delete().eq('user_id', userId);
  34  |         await supabase.from('parking_debts').delete().eq('user_id', userId);
  35  |
  36  |         // 2. Get Amenity and Type
  37  |         const { data: amenities } = await supabase.from('amenities').select('id').limit(1);
  38  |         if (!amenities || amenities.length === 0) throw new Error('No amenities found');
  39  |         amenityId = amenities[0].id;
  40  |
  41  |         const { data: types } = await supabase.from('reservation_types').select('id').eq('amenity_id', amenityId).limit(1);
  42  |         if (!types || types.length === 0) throw new Error('No reservation types found');
  43  |         typeId = types[0].id;
  44  |     });
  45  |
  46  |     test.afterEach(async () => {
  47  |         // Cleanup reservations created during test
  48  |         await supabase.from('reservations').delete().eq('user_id', userId).eq('amenity_id', amenityId);
  49  |     });
  50  |
  51  |     test('should prevent double booking on simultaneous requests', async () => {
  52  |         // Define a slot for testing
  53  |         const startAt = new Date();
  54  |         startAt.setDate(startAt.getDate() + 20); // 20 days in future
  55  |         startAt.setHours(10, 0, 0, 0);
  56  |
  57  |         const endAt = new Date(startAt);
  58  |         endAt.setHours(14, 0, 0, 0);
  59  |
  60  |         const startIso = startAt.toISOString();
  61  |         const endIso = endAt.toISOString();
  62  |
  63  |         console.log(`Attempting concurrent booking for: ${startIso} - ${endIso}`);
  64  |
  65  |         // Create two simultaneous RPC calls
  66  |         const request1 = supabase.rpc('request_reservation', {
  67  |             p_amenity_id: amenityId,
  68  |             p_type_id: typeId,
  69  |             p_start_at: startIso,
  70  |             p_end_at: endIso,
  71  |             p_form_data: { test: 'concurrency_1' }
  72  |         });
  73  |
  74  |         const request2 = supabase.rpc('request_reservation', {
  75  |             p_amenity_id: amenityId,
  76  |             p_type_id: typeId,
  77  |             p_start_at: startIso,
  78  |             p_end_at: endIso,
  79  |             p_form_data: { test: 'concurrency_2' }
  80  |         });
  81  |
  82  |         // Execute both
  83  |         const results = await Promise.allSettled([request1, request2]);
  84  |
  85  |         const successful = results.filter(r => r.status === 'fulfilled' && !r.value.error);
  86  |         const failed = results.filter(r => {
  87  |             if (r.status === 'rejected') return true;
  88  |             if (r.status === 'fulfilled' && r.value.error) return true;
  89  |             return false;
  90  |         });
  91  |
  92  |         console.log('Successful requests:', successful.length);
  93  |         console.log('Failed requests:', failed.length);
  94  |
  95  |         if (failed.length > 0) {
  96  |             const failure = failed[0] as any;
  97  |             const error = failure.reason || failure.value?.error;
  98  |             console.log('Failure reason:', error);
  99  |         }
  100 |
  101 |         // Assertions
  102 |         expect(successful.length).toBe(1);
  103 |         expect(failed.length).toBe(1);
  104 |
  105 |         // Verify the error message of the failed request
  106 |         const failure = failed[0] as any;
  107 |         const error = failure.reason || failure.value?.error;
  108 |         const msg = error.message || error.details || JSON.stringify(error);
  109 |
  110 |         // We expect a constraint violation OR a timeout (if lock wait exceeded)
  111 |         const isConstraintViolation = msg.includes('reservations_no_overlap_excl') || msg.includes('conflicting key value violates exclusion constraint');
  112 |         const isTimeout = msg.includes('lock_timeout') || msg.includes('canceling statement due to lock timeout');
  113 |
  114 |         expect(isConstraintViolation || isTimeout).toBeTruthy();
  115 |     });
  116 | });
  117 |
```