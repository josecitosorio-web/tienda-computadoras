// Utilidades de manejo monetario con dos decimales.
// Se usa redondeo "half away from zero" para evitar errores de coma flotante.

function round2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  // Se multiplica, se redondea y se divide para trabajar en enteros.
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Formatea un número como moneda (sin símbolo) para respuestas si se necesita.
function formatMoney(value) {
  return round2(value).toFixed(2);
}

module.exports = { round2, formatMoney };
