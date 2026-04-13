function validateProjectionInput({ usuarios_iniciales, precio_mensual, crecimiento_mensual, churn_rate, costos_mensuales }) {
  if (typeof usuarios_iniciales !== 'number' || usuarios_iniciales < 0) {
    throw new Error('usuarios_iniciales debe ser un número >= 0.');
  }
  if (typeof precio_mensual !== 'number' || precio_mensual < 0) {
    throw new Error('precio_mensual debe ser un número >= 0.');
  }
  if (typeof crecimiento_mensual !== 'number' || crecimiento_mensual < 0 || crecimiento_mensual > 1) {
    throw new Error('crecimiento_mensual debe ser un número entre 0 y 1 (ej: 0.10 para 10%).');
  }
  if (typeof churn_rate !== 'number' || churn_rate < 0 || churn_rate > 1) {
    throw new Error('churn_rate debe ser un número entre 0 y 1 (ej: 0.05 para 5%).');
  }
  if (typeof costos_mensuales !== 'number' || costos_mensuales < 0) {
    throw new Error('costos_mensuales debe ser un número >= 0.');
  }
}

function calcularMes(mesAnterior, params) {
  const { precio_mensual, crecimiento_mensual, churn_rate, costos_mensuales } = params;

  const usuariosNuevos = Math.floor(mesAnterior.usuarios * crecimiento_mensual);
  const usuariosChurn = Math.floor(mesAnterior.usuarios * churn_rate);
  const usuarios = mesAnterior.usuarios + usuariosNuevos - usuariosChurn;

  const ingresos = parseFloat((usuarios * precio_mensual).toFixed(2));
  const costos = parseFloat(costos_mensuales.toFixed(2));
  const ganancia = parseFloat((ingresos - costos).toFixed(2));

  return {
    mes: mesAnterior.mes + 1,
    usuarios,
    ingresos,
    costos,
    ganancia,
  };
}

function calcularBreakEven(proyecciones) {
  const breakEvenMes = proyecciones.find((m) => m.ganancia >= 0);
  return breakEvenMes ? breakEvenMes.mes : null;
}

function generateProjection(params) {
  validateProjectionInput(params);

  const { usuarios_iniciales, precio_mensual, costos_mensuales, crecimiento_mensual, churn_rate } = params;
  const MESES = 12;

  const ingresosMes1 = parseFloat((usuarios_iniciales * precio_mensual).toFixed(2));
  const gananciasMes1 = parseFloat((ingresosMes1 - costos_mensuales).toFixed(2));

  const proyecciones = [
    {
      mes: 1,
      usuarios: usuarios_iniciales,
      ingresos: ingresosMes1,
      costos: parseFloat(costos_mensuales.toFixed(2)),
      ganancia: gananciasMes1,
    },
  ];

  for (let i = 1; i < MESES; i++) {
    const mesActual = calcularMes(proyecciones[i - 1], { precio_mensual, crecimiento_mensual, churn_rate, costos_mensuales });
    proyecciones.push(mesActual);
  }

  const breakEvenMes = calcularBreakEven(proyecciones);

  return {
    proyecciones,
    resumen: {
      ingresos_totales: parseFloat(proyecciones.reduce((acc, m) => acc + m.ingresos, 0).toFixed(2)),
      costos_totales: parseFloat(proyecciones.reduce((acc, m) => acc + m.costos, 0).toFixed(2)),
      ganancia_total: parseFloat(proyecciones.reduce((acc, m) => acc + m.ganancia, 0).toFixed(2)),
      usuarios_mes_12: proyecciones[11].usuarios,
      break_even_mes: breakEvenMes,
    },
  };
}

module.exports = { generateProjection };
