export const validateTicket = (ticket: { titulo: string; descripcion: string }) => {
  if (!ticket.titulo || ticket.titulo.trim().length === 0) {
    throw new Error('El título es obligatorio.');
  }
  if (ticket.titulo.length > 100) {
    throw new Error('El título no puede exceder los 100 caracteres.');
  }
  if (!ticket.descripcion || ticket.descripcion.trim().length === 0) {
    throw new Error('La descripción es obligatoria.');
  }
  if (ticket.descripcion.length > 2000) {
    throw new Error('La descripción no puede exceder los 2000 caracteres.');
  }
};

export const validateNotice = (notice: { titulo: string; contenido: string }) => {
  if (!notice.titulo || notice.titulo.trim().length === 0) {
    throw new Error('El título es obligatorio.');
  }
  if (notice.titulo.length > 100) {
    throw new Error('El título no puede exceder los 100 caracteres.');
  }
  if (!notice.contenido || notice.contenido.trim().length === 0) {
    throw new Error('El contenido es obligatorio.');
  }
  if (notice.contenido.length > 5000) {
    throw new Error('El contenido no puede exceder los 5000 caracteres.');
  }
};

export const validateExpense = (expense: { descripcion: string; monto: number }) => {
  if (!expense.descripcion || expense.descripcion.trim().length === 0) {
    throw new Error('La descripción es obligatoria.');
  }
  if (expense.descripcion.length > 200) {
    throw new Error('La descripción no puede exceder los 200 caracteres.');
  }
  if (expense.monto <= 0) {
    throw new Error('El monto debe ser mayor a 0.');
  }
};

export const validatePoll = (question: string, options: string[]) => {
  if (!question || question.trim().length === 0) {
    throw new Error('La pregunta es obligatoria.');
  }
  if (question.length > 200) {
    throw new Error('La pregunta no puede exceder los 200 caracteres.');
  }
  if (!options || options.length < 2) {
    throw new Error('Debe haber al menos 2 opciones.');
  }
  if (options.length > 20) {
    throw new Error('No puede haber más de 20 opciones.');
  }
  options.forEach((opt, index) => {
    if (!opt || opt.trim().length === 0) {
      throw new Error(`La opción ${index + 1} no puede estar vacía.`);
    }
    if (opt.length > 100) {
      throw new Error(`La opción ${index + 1} no puede exceder los 100 caracteres.`);
    }
  });
};
