const fs = require('fs');
const path = 'tests/e2e/setup.spec.ts';
let content = fs.readFileSync(path, 'utf8');
const target = `        const manageTypesBtn = card.getByTitle('Gestionar Tipos de Reserva');`;
const replacement = `        // The button has both title and aria-label "Gestionar Tipos de Reserva"
        const manageTypesBtn = card.getByTitle('Gestionar Tipos de Reserva');`;
content = content.replace(target, replacement);
fs.writeFileSync(path, content, 'utf8');
