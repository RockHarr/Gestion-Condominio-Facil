
export interface User {
  id: number | string;
  nombre: string;
  unidad: string;
  role: 'resident' | 'admin';
  hasParking: boolean;
  email?: string;
  alicuota?: number;
}

export interface CommonExpenseDebt {
  id: number;
  userId: number | string;
  mes: string; // YYYY-MM
  monto: number;
  pagado: boolean;
}

export enum TicketStatus {
  NUEVO = 'Nuevo',
  EN_PROCESO = 'En Proceso',
  RESUELTO = 'Resuelto',
  CERRADO = 'Cerrado',
}

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  estado: TicketStatus;
  foto?: string; // base64 encoded image
  user?: Pick<User, 'id' | 'nombre' | 'unidad'>;
}

export enum NoticeType {
  EMERGENCIA = 'Emergencia',
  MANTENIMIENTO = 'Mantenimiento',
  COMUNIDAD = 'Comunidad',
}

export enum NoticeStatus {
  BORRADOR = 'Borrador',
  PUBLICADO = 'Publicado',
}

export interface Notice {
  id: number;
  titulo: string;
  contenido: string;
  fecha: string;
  tipo: NoticeType;
  leido: boolean;
  status: NoticeStatus;
}

export interface Amenity {
  id: string;
  nombre: string;
}

export interface Reservation {
  id: number;
  amenityId: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:00
  userId: number | string;
}

export interface ParkingDebt {
  id: number;
  userId: number | string;
  patente: string;
  monto: number;
  mes: string;
  pagado: boolean;
}

export interface FinancialStatement {
  id: number;
  mes: string;
  url: string;
  ingresos: number;
  egresos: number;
  saldo: number;
}

export interface ReserveFund {
  montoActual: number;
  meta: number;
}

export enum PaymentType {
  GASTO_COMUN = 'Gasto Común',
  ESTACIONAMIENTO = 'Estacionamiento',
}

export enum PaymentMethod {
  TRANSFERENCIA = 'Transferencia',
  EFECTIVO = 'Efectivo',
  CHEQUE = 'Cheque',
  OTRO = 'Otro',
}

export interface PaymentRecord {
  id: number;
  userId: number | string;
  type: PaymentType;
  periodo: string; // Ej: "2025-11"
  monto: number;
  fechaPago: string; // YYYY-MM-DD
  metodoPago?: PaymentMethod;
  observacion?: string;
}

export enum ExpenseStatus {
  EN_REVISION = 'En Revision',
  APROBADO = 'Aprobado',
  RECHAZADO = 'Rechazado',
}

export enum ExpenseCategory {
  MANTENIMIENTO = 'Mantenimiento',
  ADMINISTRACION = 'Administracion',
  SUMINISTROS = 'Suministros',
  SEGURIDAD = 'Seguridad',
  OTROS = 'Otros',
}

export interface Expense {
  id: number;
  descripcion: string;
  monto: number;
  fecha: string;
  categoria: ExpenseCategory;
  status: ExpenseStatus;
  proveedor?: string;
  numeroDocumento?: string;
  evidenciaUrl?: string; // Simulado por ahora
  motivoRechazo?: string;
}

export interface CommunitySettings {
  commonExpense: number;
  parkingCost: number;
}

export interface AppData {
  users: User[];
  commonExpenseDebts: CommonExpenseDebt[];
  tickets: Ticket[];
  notices: Notice[];
  amenities: Amenity[];
  reservations: Reservation[];
  parkingDebts: ParkingDebt[];
  financialStatements: FinancialStatement[];
  reserveFund: ReserveFund;
  paymentHistory: PaymentRecord[];
  expenses: Expense[];
  communitySettings: CommunitySettings;
}

export type Page =
  // Resident Pages
  | 'login'
  | 'home'
  | 'payments'
  | 'payment-method'
  | 'payment-confirm'
  | 'payment-receipt'
  | 'tickets'
  | 'ticket-detail'
  | 'ticket-create'
  | 'notices'
  | 'notice-detail'
  | 'reservations'
  | 'profile'
  | 'more'
  | 'financial-statements'
  | 'reserve-fund'
  | 'resident-expenses'
  // Admin Pages
  | 'admin-dashboard'
  | 'admin-tickets'
  | 'admin-ticket-detail'
  | 'admin-notices'
  | 'admin-notice-create'
  | 'admin-notice-detail'
  | 'admin-units'
  | 'admin-unit-create'
  | 'admin-unit-edit'
  | 'admin-unit-detail'
  | 'admin-payment-entry'
  | 'admin-config';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}