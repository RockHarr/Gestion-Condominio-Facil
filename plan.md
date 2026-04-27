1. **Fix Supabase Migration Order Error**
   - The error output shows `ERROR: relation "reservation_types" does not exist (SQLSTATE 42P01)` running the migration file `20260103_add_reservation_cols.sql`.
   - In `supabase/migrations/`, `20260103_add_reservation_cols.sql` runs before `20260103_phase4_schema.sql`. But `20260103_phase4_schema.sql` creates the `reservation_types` table.
   - We must rename `20260103_add_reservation_cols.sql` to sort after `20260103_phase4_schema.sql` (e.g. `20260103_z_add_reservation_cols.sql` or `20260103_phase4_schema_01_add_reservation_cols.sql`) so it runs in the correct order.
2. **Test and Verify**
   - Run `npx supabase start` locally and run tests.
3. **Submit the Fix**
   - Commit the renamed migration file.
