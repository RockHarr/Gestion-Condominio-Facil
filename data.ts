
import { AppData, TicketStatus, NoticeType, Ticket, Reservation, User, Notice, PaymentRecord, PaymentType, CommonExpenseDebt, ParkingDebt, NoticeStatus, Expense, ExpenseStatus, ExpenseCategory, FinancialStatement, CommunitySettings } from './types';

const SEED_DATA: AppData = {
  users: [
    { id: 1, nombre: "María Pérez", unidad: "B-302", role: 'resident', hasParking: true, email: "maria.perez@email.com" },
    { id: 2, nombre: "Juan González", unidad: "A-101", role: 'resident', hasParking: false, email: "juan.gonzalez@email.com" },
    { id: 10, nombre: "Admin Condominio", unidad: "Admin", role: 'admin', hasParking: false, email: "admin@condominio.com" },
  ],
  commonExpenseDebts: [
    { id: 1, userId: 1, mes: "2025-11", monto: 65000, pagado: false },
    { id: 2, userId: 1, mes: "2025-10", monto: 62000, pagado: true },
    { id: 3, userId: 1, mes: "2025-09", monto: 62000, pagado: false }, // Moroso
    { id: 4, userId: 2, mes: "2025-11", monto: 65000, pagado: false },
    { id: 5, userId: 2, mes: "2025-10", monto: 62000, pagado: true },
  ],
  tickets: [
    { id: 1, user: { id: 1, nombre: "María Pérez", unidad: "B-302"}, titulo: "Fuga de agua en lavaplatos", descripcion: "Hay una gotera constante bajo el lavaplatos de la cocina.", fecha: "2025-10-28", estado: TicketStatus.RESUELTO },
    { id: 2, user: { id: 2, nombre: "Juan González", unidad: "A-101"}, titulo: "Luz de pasillo quemada", descripcion: "La ampolleta del pasillo del piso 3 está quemada.", fecha: "2025-11-01", estado: TicketStatus.EN_PROCESO },
    { id: 3, user: { id: 1, nombre: "María Pérez", unidad: "B-302"}, titulo: "Ruido molesto en la noche", descripcion: "Se escuchan ruidos fuertes desde el departamento de arriba después de las 11 PM.", fecha: "2025-11-02", estado: TicketStatus.NUEVO },
  ],
  notices: [
    { id: 1, titulo: "Corte de agua programado", contenido: "Se realizará un corte de agua el día 15 de Noviembre de 9:00 a 13:00 por mantención de las bombas.", fecha: "2025-11-05", tipo: NoticeType.MANTENIMIENTO, leido: false, status: NoticeStatus.PUBLICADO },
    { id: 2, titulo: "Asamblea general de comuneros", contenido: "Se cita a asamblea extraordinaria el Sábado 20 de Noviembre a las 19:00 en el salón de eventos.", fecha: "2025-11-02", tipo: NoticeType.COMUNIDAD, leido: true, status: NoticeStatus.PUBLICADO },
    { id: 3, titulo: "Falla en portón de acceso", contenido: "El portón de acceso vehicular se encuentra en reparación. Se ruega usar la salida alternativa.", fecha: "2025-11-06", tipo: NoticeType.EMERGENCIA, leido: false, status: NoticeStatus.PUBLICADO },
    { id: 4, titulo: "Recordatorio: Cuotas de Estacionamiento", contenido: "Se recuerda a los residentes que la cuota de estacionamiento debe ser pagada antes del día 10.", fecha: "2025-11-07", tipo: NoticeType.COMUNIDAD, leido: false, status: NoticeStatus.BORRADOR },
  ],
  amenities: [
      { id: 'quincho', nombre: 'Quincho' },
      { id: 'sala_eventos', nombre: 'Salón de Eventos' }
  ],
  reservations: [
    { id: 1, amenityId: 'quincho', fecha: '2025-11-12', hora: '19:00', userId: 2 },
  ],
  parkingDebts: [
      { id: 1, userId: 1, patente: 'BC-DE-56', monto: 12000, mes: '2025-11', pagado: false },
      { id: 2, userId: 1, patente: 'BC-DE-56', monto: 12000, mes: '2025-10', pagado: true },
      { id: 3, userId: 1, patente: 'BC-DE-56', monto: 12000, mes: '2025-09', pagado: false }, // Moroso
  ],
  financialStatements: [
      { id: 1, mes: 'Octubre 2025', url: '#', ingresos: 5500000, egresos: 4800000, saldo: 700000 },
      { id: 2, mes: 'Septiembre 2025', url: '#', ingresos: 5450000, egresos: 5100000, saldo: 350000 },
      { id: 3, mes: 'Agosto 2025', url: '#', ingresos: 5520000, egresos: 4900000, saldo: 620000 },
  ],
  reserveFund: {
      montoActual: 8500000,
      meta: 15000000,
  },
  paymentHistory: [
    { id: 1, userId: 1, type: PaymentType.GASTO_COMUN, periodo: '2025-10', monto: 62000, fechaPago: '2025-10-05' },
    { id: 2, userId: 1, type: PaymentType.ESTACIONAMIENTO, periodo: '2025-10', monto: 12000, fechaPago: '2025-10-05' },
    { id: 3, userId: 2, type: PaymentType.GASTO_COMUN, periodo: '2025-10', monto: 62000, fechaPago: '2025-10-08' },
  ],
  expenses: [
    { id: 1, descripcion: "Reparación bomba de agua", monto: 350000, fecha: "2025-11-02", categoria: ExpenseCategory.MANTENIMIENTO, status: ExpenseStatus.APROBADO, proveedor: "Bombas S.A.", numeroDocumento: "F-1234", evidenciaUrl: "#" },
    { id: 2, descripcion: "Sueldo conserje", monto: 600000, fecha: "2025-11-01", categoria: ExpenseCategory.ADMINISTRACION, status: ExpenseStatus.APROBADO, proveedor: "Juan Pérez", numeroDocumento: "Liq-11-25", evidenciaUrl: "#" },
    { id: 3, descripcion: "Compra de ampolletas pasillos", monto: 45000, fecha: "2025-11-05", categoria: ExpenseCategory.SUMINISTROS, status: ExpenseStatus.EN_REVISION, proveedor: "Easy", numeroDocumento: "B-5678", evidenciaUrl: "#" },
    { id: 4, descripcion: "Servicio de seguridad Noviembre", monto: 1200000, fecha: "2025-11-05", categoria: ExpenseCategory.SEGURIDAD, status: ExpenseStatus.APROBADO, proveedor: "Seguridad Total", numeroDocumento: "F-91011", evidenciaUrl: "#" },
    { id: 5, descripcion: "Artículos de limpieza", monto: 75000, fecha: "2025-11-06", categoria: ExpenseCategory.SUMINISTROS, status: ExpenseStatus.EN_REVISION, proveedor: "Líder", numeroDocumento: "B-121314", evidenciaUrl: undefined },
    { id: 6, descripcion: "Mantención Ascensor", monto: 250000, fecha: "2025-11-07", categoria: ExpenseCategory.MANTENIMIENTO, status: ExpenseStatus.RECHAZADO, proveedor: "Otis", numeroDocumento: "F-1516", evidenciaUrl: "#", motivoRechazo: "Factura con monto incorrecto." },
  ],
  communitySettings: {
    commonExpense: 65000,
    parkingCost: 12000,
  }
};

const DB_KEY = 'condoAppData';

class DataManager {
  constructor() {
    if (!localStorage.getItem(DB_KEY)) {
      localStorage.setItem(DB_KEY, JSON.stringify(SEED_DATA));
    }
  }

  private getData(): AppData {
    return JSON.parse(localStorage.getItem(DB_KEY) || '{}');
  }

  private saveData(data: AppData): void {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }

  public resetData(): void {
    localStorage.setItem(DB_KEY, JSON.stringify(SEED_DATA));
  }

  public getUsers(): AppData['users'] {
    return this.getData().users;
  }
  
  public addUser(userData: Omit<User, 'id' | 'role'>): User {
      const data = this.getData();
      const newUser: User = {
          ...userData,
          id: Math.max(0, ...data.users.map(u => u.id)) + 1,
          role: 'resident',
      };
      data.users.push(newUser);

      // --- Automatically generate debts for the new user based on community settings ---
      const settings = this.getCommunitySettings();
      const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

      const newCommonExpense: CommonExpenseDebt = {
        id: Math.max(0, ...data.commonExpenseDebts.map(d => d.id)) + 1,
        userId: newUser.id,
        mes: currentMonth,
        monto: settings.commonExpense,
        pagado: false,
      };
      data.commonExpenseDebts.push(newCommonExpense);

      if(newUser.hasParking) {
        const newParkingDebt: ParkingDebt = {
            id: Math.max(0, ...data.parkingDebts.map(d => d.id)) + 1,
            userId: newUser.id,
            mes: currentMonth,
            monto: settings.parkingCost,
            pagado: false,
            patente: 'PENDIENTE',
        };
        data.parkingDebts.push(newParkingDebt);
      }
      
      this.saveData(data);
      return newUser;
  }

  public updateUser(id: number, updatedData: Partial<Pick<User, 'nombre' | 'hasParking' | 'email'>>): User | null {
      const data = this.getData();
      const userIndex = data.users.findIndex(u => u.id === id);
      if (userIndex > -1) {
          data.users[userIndex] = { ...data.users[userIndex], ...updatedData };
          this.saveData(data);
          return data.users[userIndex];
      }
      return null;
  }

  public deleteUser(id: number): void {
      let data = this.getData();
      data.users = data.users.filter(u => u.id !== id);
      this.saveData(data);
  }

  public getCommonExpenseDebts(userId?: number): CommonExpenseDebt[] {
    const debts = this.getData().commonExpenseDebts;
    if (userId) {
        return debts.filter(d => d.userId === userId);
    }
    return debts;
  }

  public getParkingDebts(userId?: number): ParkingDebt[] {
    const debts = this.getData().parkingDebts;
    if (userId) {
        return debts.filter(d => d.userId === userId);
    }
    return debts;
  }

  public getTickets(userId?: number): AppData['tickets'] {
    const tickets = this.getData().tickets.sort((a, b) => b.id - a.id);
    if(userId) {
        return tickets.filter(t => t.user?.id === userId);
    }
    return tickets;
  }
  
  public getTicket(id: number) {
    return this.getTickets().find(t => t.id === id);
  }
  
  public addTicket(ticketData: Omit<Ticket, 'id' | 'fecha'>, user: User): Ticket {
    const data = this.getData();
    const newTicket: Ticket = {
        ...ticketData,
        id: Math.max(0, ...data.tickets.map(t => t.id)) + 1,
        fecha: new Date().toISOString().split('T')[0],
        estado: TicketStatus.NUEVO,
        user: { id: user.id, nombre: user.nombre, unidad: user.unidad }
    };
    data.tickets.push(newTicket);
    this.saveData(data);
    return newTicket;
  }

  public updateTicketStatus(id: number, estado: TicketStatus): void {
    const data = this.getData();
    const ticket = data.tickets.find(t => t.id === id);
    if(ticket) {
        ticket.estado = estado;
        this.saveData(data);
    }
  }

  public getNotices(): AppData['notices'] {
    return this.getData().notices.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  public getNotice(id: number) {
    return this.getNotices().find(n => n.id === id);
  }

  public createNotice(noticeData: Omit<Notice, 'id' | 'fecha' | 'leido' | 'status'>): Notice {
      const data = this.getData();
      const newNotice: Notice = {
          ...noticeData,
          id: Math.max(0, ...data.notices.map(n => n.id)) + 1,
          fecha: new Date().toISOString().split('T')[0],
          leido: false,
          status: NoticeStatus.BORRADOR,
      };
      data.notices.unshift(newNotice); // Añadir al principio
      this.saveData(data);
      return newNotice;
  }
  
  public updateNoticeStatus(id: number, status: NoticeStatus): void {
      const data = this.getData();
      const notice = data.notices.find(n => n.id === id);
      if (notice) {
          notice.status = status;
          this.saveData(data);
      }
  }

  public markNoticeAsRead(id: number): void {
    const data = this.getData();
    const notice = data.notices.find(n => n.id === id);
    if (notice) {
        notice.leido = true;
        this.saveData(data);
    }
  }

  public getAmenities(): AppData['amenities'] {
      return this.getData().amenities;
  }

  public getReservations(): AppData['reservations'] {
      return this.getData().reservations;
  }

  public addReservation(res: Omit<Reservation, 'id'>): Reservation | null {
    const data = this.getData();
    const existing = data.reservations.find(r => r.fecha === res.fecha && r.hora === res.hora && r.amenityId === res.amenityId);
    if (existing) {
        return null; // Conflicto
    }
    const newReservation: Reservation = {
        ...res,
        id: Math.max(0, ...data.reservations.map(r => r.id)) + 1,
    };
    data.reservations.push(newReservation);
    this.saveData(data);
    return newReservation;
  }

  public cancelReservation(id: number): void {
    let data = this.getData();
    data.reservations = data.reservations.filter(r => r.id !== id);
    this.saveData(data);
  }
  
  public getFinancialStatements(): AppData['financialStatements'] {
      return this.getData().financialStatements.sort((a, b) => b.id - a.id);
  }
  
  public getReserveFund(): AppData['reserveFund'] {
      return this.getData().reserveFund;
  }

  public getPaymentHistory(userId?: number): PaymentRecord[] {
    const paymentHistory = this.getData().paymentHistory
        .sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());
    if (userId) {
        return paymentHistory.filter(p => p.userId === userId);
    }
    return paymentHistory;
  }

  public payAllDebts(userId: number): void {
    const data = this.getData();
    const user = this.getUsers().find(u => u.id === userId);
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    let nextPaymentId = Math.max(0, ...data.paymentHistory.map(p => p.id)) + 1;

    // Pagar deudas de gasto común y registrarlas
    data.commonExpenseDebts.forEach(debt => {
        if (debt.userId === userId && !debt.pagado) {
            const paymentRecord: PaymentRecord = {
                id: nextPaymentId++,
                userId: user.id,
                type: PaymentType.GASTO_COMUN,
                periodo: debt.mes,
                monto: debt.monto,
                fechaPago: today,
            };
            data.paymentHistory.push(paymentRecord);
            debt.pagado = true;
        }
    });

    // Pagar deudas de estacionamiento y registrarlas
    data.parkingDebts.forEach(debt => {
        if (debt.userId === userId && !debt.pagado) {
            const paymentRecord: PaymentRecord = {
                id: nextPaymentId++,
                userId: user.id,
                type: PaymentType.ESTACIONAMIENTO,
                periodo: debt.mes,
                monto: debt.monto,
                fechaPago: today,
            };
            data.paymentHistory.push(paymentRecord);
            debt.pagado = true;
        }
    });

    this.saveData(data);
  }

  // --- Expense Management ---

  public getExpenses(): Expense[] {
      return this.getData().expenses.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  public addExpense(expenseData: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>): Expense {
      const data = this.getData();
      const newExpense: Expense = {
          ...expenseData,
          id: Math.max(0, ...data.expenses.map(e => e.id)) + 1,
          status: ExpenseStatus.EN_REVISION,
          fecha: new Date().toISOString().split('T')[0],
      };
      data.expenses.push(newExpense);
      this.saveData(data);
      return newExpense;
  }

  public approveExpense(id: number): void {
      const data = this.getData();
      const expense = data.expenses.find(e => e.id === id);
      if (expense) {
          expense.status = ExpenseStatus.APROBADO;
          this.saveData(data);
      }
  }

  public rejectExpense(id: number, motivo: string): void {
      const data = this.getData();
      const expense = data.expenses.find(e => e.id === id);
      if (expense) {
          expense.status = ExpenseStatus.RECHAZADO;
          expense.motivoRechazo = motivo;
          this.saveData(data);
      }
  }
  
  public closeMonthAndGenerateStatement(): FinancialStatement | null {
      const data = this.getData();
      const approvedExpenses = data.expenses.filter(e => e.status === ExpenseStatus.APROBADO);
      if (approvedExpenses.length === 0) {
          return null;
      }

      const egresos = approvedExpenses.reduce((sum, e) => sum + e.monto, 0);

      // Simulación de Ingresos: suma de todos los pagos del mes actual
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      const ingresos = data.paymentHistory
          .filter(p => p.periodo === currentMonthStr)
          .reduce((sum, p) => sum + p.monto, 0);

      const lastStatement = data.financialStatements[0];
      const saldoAnterior = lastStatement ? lastStatement.saldo : 0;
      const saldo = saldoAnterior + ingresos - egresos;

      const monthName = now.toLocaleString('es-CL', { month: 'long' });
      const year = now.getFullYear();
      
      const newStatement: FinancialStatement = {
          id: Math.max(0, ...data.financialStatements.map(s => s.id)) + 1,
          mes: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
          url: '#', // Simulado
          ingresos,
          egresos,
          saldo,
      };
      
      data.financialStatements.unshift(newStatement);
      // "Archivar" gastos procesados (aprobados y rechazados)
      data.expenses = data.expenses.filter(e => e.status === ExpenseStatus.EN_REVISION);
      
      this.saveData(data);
      return newStatement;
  }

  // --- Settings ---
  public getCommunitySettings(): CommunitySettings {
      return this.getData().communitySettings;
  }

  public updateCommunitySettings(settings: CommunitySettings): void {
      const data = this.getData();
      data.communitySettings = settings;
      this.saveData(data);
  }
}

export const db = new DataManager();
