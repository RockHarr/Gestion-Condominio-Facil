
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
  id: string; // Changed from number to string to match DB (text PK)
  name: string;
  description?: string;
  capacity?: number;
  photoUrl?: string;
}

export enum ReservationStatus {
  REQUESTED = 'REQUESTED',
  REJECTED = 'REJECTED',
  APPROVED_PENDING_PAYMENT = 'APPROVED_PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export interface ReservationType {
  id: number;
  amenity_id: string; // Changed to string
  name: string;
  fee_amount: number;
  deposit_amount: number;
  max_duration_minutes: number;
  min_advance_hours?: number;
  form_schema?: any;
  rules?: string;
  requires_approval: boolean;
}

export interface Reservation {
  id: number;
  amenityId: string; // Changed to string

  typeId?: number;
  unitId?: number;
  userId?: string;
  startAt: string; // ISO
  endAt: string; // ISO
  status: ReservationStatus;
  isSystem: boolean;
  systemReason?: string;
  formData?: any;
  feeSnapshot?: number;
  depositSnapshot?: number;
  user?: {
    nombre: string;
    unidad: string;
  };
}

export enum DepositDecisionType {
  RELEASE = 'RELEASE',
  RETAIN_PARTIAL = 'RETAIN_PARTIAL',
  RETAIN_FULL = 'RETAIN_FULL',
}

export interface DepositDecision {
  id: number;
  reservationId: number;
  decision: DepositDecisionType;
  retainedAmount: number;
  reason?: string;
  decidedBy?: string;
  decidedAt: string;
}

export enum IncidentStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  CHARGED = 'CHARGED',
}

export interface Incident {
  id: number;
  reservationId: number;
  description: string;
  evidenceUrls?: string[];
  regulationRef?: string;
  fineAmount: number;
  status: IncidentStatus;
}

export enum WeightingStrategy {
  UNIT = 'UNIT',
  ALICUOTA = 'ALICUOTA',
}

export enum PollResultsVisibility {
  LIVE = 'LIVE',
  CLOSED = 'CLOSED',
}

export interface Poll {
  id: number;
  question: string;
  options: string[]; // JSONB array of strings
  startAt: string;
  endAt: string;
  weightingStrategy: WeightingStrategy;
  showResultsWhen: PollResultsVisibility;
  weightSnapshotJson?: any;
  createdBy?: string;
}

export interface PollResponse {
  id: number;
  pollId: number;
  unitId: number;
  userId?: string;
  optionIndex: number;
  weightUsed: number;
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
  RESERVA = 'Reserva',
  USO_ESPACIO = 'Uso de Espacio',
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
  polls: Poll[];
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
  | 'amenities'
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
  | 'admin-amenities'
  | 'admin-reservation-types'
  | 'admin-reservations'
  | 'admin-config'
  | 'admin-requests'
  | 'admin-menu'
  | 'polls'
  | 'admin-polls';

export enum ChargeType {
  RESERVATION_FEE = 'RESERVATION_FEE',
  RESERVATION_DEPOSIT = 'RESERVATION_DEPOSIT',
  FINE = 'FINE',
  COMMON_EXPENSE = 'COMMON_EXPENSE',
  PARKING = 'PARKING',
}

export enum ChargeStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  RELEASED = 'RELEASED',
  RETAINED = 'RETAINED',
}

export enum ChargeReferenceType {
  RESERVATION = 'RESERVATION',
  INCIDENT = 'INCIDENT',
  MONTH = 'MONTH',
}

export type DbBigInt = number | string;

export interface Charge {
  id: string; // UUID
  unitId: DbBigInt;
  amount: number;
  currency: string;
  type: ChargeType;
  status: ChargeStatus;
  referenceType: ChargeReferenceType;
  referenceId: DbBigInt;
  createdBy?: string;
  createdAt: string;
  paidAt?: string;
  notes?: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface FinancialKpis {
  total_collected: number;
  deposits_custody: number;
  pending_review_count: number;
  total_expenses_approved: number;
}