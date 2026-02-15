export const TICKET_TITLE_MAX_LENGTH = 100;
export const TICKET_DESC_MAX_LENGTH = 2000;
export const PHOTO_MAX_LENGTH = 7000000; // ~5MB base64

export const POLL_QUESTION_MAX_LENGTH = 250;
export const POLL_OPTIONS_MAX_COUNT = 20;
export const POLL_OPTION_MAX_LENGTH = 100;

export const validateTicketInput = (title: string, description: string, photo?: string | null) => {
  if (title.length > TICKET_TITLE_MAX_LENGTH) {
    throw new Error(`El título no puede exceder los ${TICKET_TITLE_MAX_LENGTH} caracteres.`);
  }
  if (description.length > TICKET_DESC_MAX_LENGTH) {
    throw new Error(`La descripción no puede exceder los ${TICKET_DESC_MAX_LENGTH} caracteres.`);
  }
  if (photo && photo.length > PHOTO_MAX_LENGTH) {
    throw new Error('La foto adjunta es demasiado grande (máximo 5MB).');
  }
};

export const validatePollInput = (
  question: string,
  options: string[],
  startAt: string,
  endAt: string,
) => {
  if (question.length > POLL_QUESTION_MAX_LENGTH) {
    throw new Error(`La pregunta no puede exceder los ${POLL_QUESTION_MAX_LENGTH} caracteres.`);
  }
  if (options.length > POLL_OPTIONS_MAX_COUNT) {
    throw new Error(`No puede haber más de ${POLL_OPTIONS_MAX_COUNT} opciones.`);
  }
  for (const option of options) {
    if (option.length > POLL_OPTION_MAX_LENGTH) {
      throw new Error(`Las opciones no pueden exceder los ${POLL_OPTION_MAX_LENGTH} caracteres.`);
    }
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Fechas inválidas.');
  }

  if (endDate <= startDate) {
    throw new Error('La fecha de fin debe ser posterior a la de inicio.');
  }
};
