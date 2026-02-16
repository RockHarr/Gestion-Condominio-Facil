## 2025-02-18 - Dynamic Form Accessibility
**Learning:** Dynamic lists of inputs (like poll options) require explicit, unique `id`s for labels to be properly associated. Also, "remove" buttons for these items need index-specific `aria-label`s to be meaningful to screen reader users (e.g., "Eliminar opción 1").
**Action:** Always generate unique IDs based on item index or unique ID when mapping dynamic inputs, and use `aria-label` with index for corresponding action buttons.
