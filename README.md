# Gestión Condominio Fácil — RockCode

Prototipo funcional de plataforma liviana para la gestión de gastos
comunes y comunicación básica en condominios y edificios pequeños.

Pensado para administradores que hoy trabajan con Excel, correos y
WhatsApp, y necesitan algo más ordenado pero sin la complejidad de un
ERP grande.

## Problema que resuelve

Muchos condominios y edificios:

- Llevan los gastos comunes en planillas sueltas.
- No tienen un lugar único donde ver deuda, pagos y avisos.
- Dependen de correos manuales y mensajes dispersos.

**Gestión Condominio Fácil** apunta a:

- Simplificar el cálculo y publicación de gastos comunes.
- Registrar pagos de manera ordenada.
- Entregar un panel simple para que residentes vean su situación
  y los avisos del edificio.

## Módulos v1 (MVP)

> Esto es un MVP en construcción, no un producto terminado.

El alcance funcional esperado para la v1 es:

### 1. Administración de unidades

- Lista de departamentos / casas (ej: 101, 102, 201…).
- Definición de coeficiente de participación por unidad.

### 2. Gastos comunes y prorrateo

- Registro de gastos del mes (monto, categoría, comentario).
- Cálculo automático de gasto común por unidad según coeficiente.
- Resumen mensual en tabla (total por unidad, total general).

### 3. Registro de pagos

- Registro de pagos por unidad (monto, fecha, medio de pago, nota).
- Indicadores básicos:
  - unidades al día / atrasadas,
  - deuda acumulada.

### 4. Tablón de avisos

- Publicación de avisos (texto + fecha).
- Listado de avisos visibles para residentes.

### 5. Vista residente (solo lectura v1)

- Acceso básico por unidad / identificador simple.
- Visualización de:
  - deuda actual,
  - últimos pagos registrados,
  - avisos del condominio.

## Tecnologías

Este proyecto fue generado inicialmente desde una plantilla de Google AI
Studio y se está adaptando a las necesidades de RockCode y del producto
“Gestión Condominio Fácil”.

- TypeScript
- React
- Vite

## Ejecutar en local

Prerrequisito: Node.js instalado.

1. Instalar dependencias:

   ```bash
   npm install
