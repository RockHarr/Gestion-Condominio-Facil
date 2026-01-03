import { supabase } from '../lib/supabase';
import { Ticket, Notice, Reservation, PaymentRecord, Expense, CommunitySettings, TicketStatus, NoticeStatus, User } from '../types';

// Helper for timeouts
const withTimeout = async <T>(promise: PromiseLike<T>, ms = 10000): Promise<T> => {
    return Promise.race([
        Promise.resolve(promise),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))
    ]) as Promise<T>;
};

export const dataService = {
    // --- Tickets ---
    async getTickets(userId?: string | number) {
        let query = supabase.from('tickets').select('*, user:profiles(nombre, unidad)');
        // if (userId) query = query.eq('user_id', userId);

        const { data, error } = await withTimeout(query.order('created_at', { ascending: false }));
        if (error) throw error;

        return data.map((t: any) => ({
            ...t,
            user: t.user,
            fecha: t.fecha,
            estado: t.estado as TicketStatus
        }));
    },

    async createTicket(ticket: Omit<Ticket, 'id' | 'fecha' | 'user' | 'estado'>, userId: string) {
        const { data, error } = await withTimeout(supabase
            .from('tickets')
            .insert({
                titulo: ticket.titulo,
                descripcion: ticket.descripcion,
                user_id: userId,
                estado: 'Nuevo'
            })
            .select()
            .single());

        if (error) throw error;
        return data;
    },

    async updateTicketStatus(id: number, estado: TicketStatus) {
        const { error } = await withTimeout(supabase
            .from('tickets')
            .update({ estado })
            .eq('id', id));
        if (error) throw error;
    },

    // --- Notices ---
    async getNotices() {
        const { data, error } = await withTimeout(supabase
            .from('notices')
            .select('*')
            .order('created_at', { ascending: false }));

        if (error) throw error;
        return data;
    },

    async createNotice(notice: Omit<Notice, 'id' | 'fecha' | 'leido' | 'status'>) {
        const { data, error } = await withTimeout(supabase
            .from('notices')
            .insert({
                ...notice,
                status: 'Borrador'
            })
            .select()
            .single());

        if (error) throw error;
        return data;
    },

    async markNoticeAsRead(id: number) {
        console.warn("markNoticeAsRead not fully implemented in Supabase schema yet");
    },

    // --- Expenses ---
    async getExpenses() {
        const { data, error } = await withTimeout(supabase
            .from('expenses')
            .select('*')
            .order('fecha', { ascending: false }));

        if (error) throw error;
        return data;
    },

    // --- Community Settings ---
    async getSettings() {
        const { data, error } = await withTimeout(supabase
            .from('community_settings')
            .select('*')
            .single());

        if (error) throw error;
        return data;
    },

    // --- Debts & Payments ---
    async getCommonExpenseDebts(userId?: string | number) {
        let query = supabase.from('common_expense_debts').select('*');
        if (userId) query = query.eq('user_id', userId);

        const { data, error } = await withTimeout(query.order('mes', { ascending: false }));
        if (error) throw error;
        return data;
    },

    async getParkingDebts(userId?: string | number) {
        let query = supabase.from('parking_debts').select('*');
        if (userId) query = query.eq('user_id', userId);

        const { data, error } = await withTimeout(query.order('mes', { ascending: false }));
        if (error) throw error;
        return data;
    },

    async getPaymentHistory(userId?: string | number) {
        let query = supabase.from('payments').select('*');
        if (userId) query = query.eq('user_id', userId);

        const { data, error } = await withTimeout(query.order('fecha_pago', { ascending: false }));
        if (error) throw error;

        return data.map((p: any) => ({
            ...p,
            userId: p.user_id,
            fechaPago: p.fecha_pago,
            metodoPago: p.metodo_pago,
            observacion: p.observacion
        }));
    },

    // --- Reservations ---
    async getReservations() {
        const { data, error } = await withTimeout(supabase
            .from('reservations')
            .select('*'));

        if (error) throw error;
        return data;
    },

    async createReservation(reservation: any) {
        const { data, error } = await withTimeout(supabase
            .from('reservations')
            .insert(reservation)
            .select()
            .single());

        if (error) throw error;
        return data;
    },

    async cancelReservation(id: number) {
        const { error } = await withTimeout(supabase
            .from('reservations')
            .delete()
            .eq('id', id));
        if (error) throw error;
    },

    async payAllDebts(userId: string | number) {
        const { error: error1 } = await withTimeout(supabase
            .from('common_expense_debts')
            .update({ pagado: true })
            .eq('user_id', userId));

        const { error: error2 } = await withTimeout(supabase
            .from('parking_debts')
            .update({ pagado: true })
            .eq('user_id', userId));

        if (error1 || error2) throw new Error("Error paying debts");
    },

    // --- Admin: Users ---
    async getUsers() {
        const { data, error } = await withTimeout(supabase
            .from('profiles')
            .select('*')
            .order('unidad', { ascending: true }));

        if (error) throw error;
        return data;
    },

    async updateUser(id: string | number, updates: Partial<User>) {
        const dbUpdates: any = { ...updates };
        if ('hasParking' in updates) {
            dbUpdates.has_parking = updates.hasParking;
            delete dbUpdates.hasParking;
        }

        // Email is in auth.users, not profiles (usually). 
        // We cannot update it directly here without Admin API.
        if ('email' in dbUpdates) {
            delete dbUpdates.email;
        }

        // TEMPORARY FIX: The 'alicuota' column does not exist in the DB yet.
        // We remove it to allow updating other fields (Name, Unit, Parking).
        if ('alicuota' in dbUpdates) {
            delete dbUpdates.alicuota;
        }

        const { error } = await withTimeout(supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', id));

        if (error) throw error;
    },

    async deleteUser(id: string | number) {
        const { error } = await withTimeout(supabase
            .from('profiles')
            .delete()
            .eq('id', id));

        if (error) throw error;
    },

    // --- Admin: Notices ---
    async approveNotice(id: number) {
        const { error } = await withTimeout(supabase
            .from('notices')
            .update({ status: 'Publicado' })
            .eq('id', id));

        if (error) throw error;
    },

    // --- Admin: Expenses ---
    async addExpense(expense: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>) {
        const { data, error } = await withTimeout(supabase
            .from('expenses')
            .insert({
                descripcion: expense.descripcion,
                monto: expense.monto,
                categoria: expense.categoria,
                proveedor: expense.proveedor || null,
                numero_documento: expense.numeroDocumento || null,
                evidencia_url: expense.evidenciaUrl || null,
                status: 'En Revision',
                fecha: new Date().toISOString().split('T')[0]
            })
            .select()
            .single());

        if (error) throw error;
        return data;
    },

    async approveExpense(id: number) {
        const { error } = await withTimeout(supabase
            .from('expenses')
            .update({ status: 'Aprobado' })
            .eq('id', id));

        if (error) throw error;
    },

    async rejectExpense(id: number, motivo: string) {
        const { error } = await withTimeout(supabase
            .from('expenses')
            .update({
                status: 'Rechazado',
                motivo_rechazo: motivo
            })
            .eq('id', id));

        if (error) throw error;
    },

    async registerPayment(payment: Omit<PaymentRecord, 'id'>) {
        // 1. Insert payment record
        const { data, error } = await withTimeout(supabase
            .from('payments')
            .insert({
                user_id: payment.userId,
                monto: payment.monto,
                fecha_pago: payment.fechaPago,
                periodo: payment.periodo,
                type: payment.type,
                metodo_pago: payment.metodoPago,
                observacion: payment.observacion
            })
            .select()
            .single());

        if (error) throw error;
        return data;
    },

    async closeMonthAndGenerateStatement() {
        // 1. Get approved expenses
        const { data: expenses, error: expError } = await withTimeout(supabase
            .from('expenses')
            .select('*')
            .eq('status', 'Aprobado'));

        if (expError) throw expError;
        if (!expenses || expenses.length === 0) return null;

        const egresos = expenses.reduce((sum, e) => sum + e.monto, 0);

        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = now.toLocaleString('es-CL', { month: 'long' });
        const year = now.getFullYear();
        const mesNombre = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

        // 2. Get payments for income calculation
        const { data: payments, error: payError } = await withTimeout(supabase
            .from('payments')
            .select('monto')
            .eq('periodo', currentMonthStr));

        if (payError) throw payError;

        const ingresos = payments?.reduce((sum, p) => sum + p.monto, 0) || 0;

        // 3. Get previous balance
        const { data: lastStatement } = await withTimeout(supabase
            .from('financial_statements')
            .select('saldo')
            .order('id', { ascending: false })
            .limit(1)
            .single());

        const saldoAnterior = lastStatement?.saldo || 0;
        const saldo = saldoAnterior + ingresos - egresos;

        // 4. Generate Debts for Residents
        const { data: residents, error: resError } = await withTimeout(supabase
            .from('profiles')
            .select('id, alicuota, has_parking')
            .eq('role', 'resident'));

        if (resError) throw resError;

        if (residents) {
            const debtsToInsert = [];
            const parkingDebtsToInsert = [];

            // Get parking cost setting
            const { data: settings } = await withTimeout(supabase
                .from('community_settings')
                .select('parking_cost_amount')
                .single());

            const parkingCost = settings?.parking_cost_amount || 12000;

            for (const resident of residents) {
                // Common Expense Debt
                // If alicuota is 0 or null, we might default to equal split or 0. 
                // For now, if 0, debt is 0 (or handle as equal split if preferred, but alicuota is safer)
                const alicuota = resident.alicuota || 0;
                const montoGastoComun = Math.round((egresos * alicuota) / 100);

                if (montoGastoComun > 0) {
                    debtsToInsert.push({
                        user_id: resident.id,
                        mes: currentMonthStr,
                        monto: montoGastoComun,
                        pagado: false
                    });
                }

                // Parking Debt
                if (resident.has_parking) {
                    parkingDebtsToInsert.push({
                        user_id: resident.id,
                        mes: currentMonthStr,
                        monto: parkingCost,
                        patente: 'Sin Registrar', // Placeholder
                        pagado: false
                    });
                }
            }

            if (debtsToInsert.length > 0) {
                const { error: debtError } = await withTimeout(supabase
                    .from('common_expense_debts')
                    .insert(debtsToInsert));
                if (debtError) console.error("Error inserting common expense debts", debtError);
            }

            if (parkingDebtsToInsert.length > 0) {
                const { error: parkError } = await withTimeout(supabase
                    .from('parking_debts')
                    .insert(parkingDebtsToInsert));
                if (parkError) console.error("Error inserting parking debts", parkError);
            }
        }

        // 5. Create Financial Statement Record
        const { data: newStatement, error: stmtError } = await withTimeout(supabase
            .from('financial_statements')
            .insert({
                mes: mesNombre,
                ingresos,
                egresos,
                saldo,
                url: '#'
            })
            .select()
            .single());

        if (stmtError) throw stmtError;

        return newStatement;
    },

    // --- Admin: Settings ---
    async updateCommunitySettings(settings: CommunitySettings) {
        const { error } = await withTimeout(supabase
            .from('community_settings')
            .update(settings)
            .eq('id', 1));

        if (error) throw error;
    }
};
