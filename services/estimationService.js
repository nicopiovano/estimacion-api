const COMPLEXITY_MULTIPLIERS = {
  baja: 1.0,
  media: 1.3,
  alta: 1.6,
  muy_alta: 2.0,
};

const HOURLY_RATE_USD = 50;
const HOURS_PER_DAY = 8;
const CONCURRENT_USERS_RATIO = 0.05;

function calculateRequestsPerDay(usuariosEstimados, requestsPorUsuario) {
  if (typeof usuariosEstimados !== 'number' || typeof requestsPorUsuario !== 'number') {
    throw new Error('usuariosEstimados y requestsPorUsuario deben ser números.');
  }
  return usuariosEstimados * requestsPorUsuario;
}

function calculateConcurrentUsers(usuariosEstimados) {
  if (typeof usuariosEstimados !== 'number') {
    throw new Error('usuariosEstimados debe ser un número.');
  }
  return Math.ceil(usuariosEstimados * CONCURRENT_USERS_RATIO);
}

function calculateAdjustedHours(horasEstimadas, complejidad) {
  const multiplier = COMPLEXITY_MULTIPLIERS[complejidad];
  if (!multiplier) {
    throw new Error(`Complejidad inválida: ${complejidad}. Valores válidos: baja, media, alta, muy_alta.`);
  }
  return Math.ceil(horasEstimadas * multiplier);
}

function calculateFinalPrice(adjustedHours, hourlyRate = HOURLY_RATE_USD) {
  if (typeof adjustedHours !== 'number') {
    throw new Error('adjustedHours debe ser un número.');
  }
  return adjustedHours * hourlyRate;
}

function calculateDeliveryDays(adjustedHours) {
  return Math.ceil(adjustedHours / HOURS_PER_DAY);
}

function computeEstimation(analysisData) {
  const {
    complejidad,
    usuarios_estimados,
    requests_por_usuario_por_dia,
    almacenamiento_estimado_mb,
    horas_estimadas,
  } = analysisData;

  const requestsTotalesDiarios = calculateRequestsPerDay(usuarios_estimados, requests_por_usuario_por_dia);
  const usuariosConcurrentes = calculateConcurrentUsers(usuarios_estimados);
  const horasTotalesAjustadas = calculateAdjustedHours(horas_estimadas, complejidad);
  const precioFinal = calculateFinalPrice(horasTotalesAjustadas);
  const diasEntrega = calculateDeliveryDays(horasTotalesAjustadas);

  return {
    requests_totales_diarios: requestsTotalesDiarios,
    requests_totales_mensuales: requestsTotalesDiarios * 30,
    usuarios_concurrentes: usuariosConcurrentes,
    horas_totales_ajustadas: horasTotalesAjustadas,
    precio_final_usd: precioFinal,
    dias_entrega_estimados: diasEntrega,
    almacenamiento_estimado_mb: almacenamiento_estimado_mb,
    costo_por_hora_usd: HOURLY_RATE_USD,
    multiplicador_complejidad: COMPLEXITY_MULTIPLIERS[complejidad],
  };
}

module.exports = { computeEstimation };
