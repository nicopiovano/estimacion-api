require('dotenv').config();
const fs = require('fs');

const API_BASE = 'http://localhost:3001';
const DESCRIPCION = 'Quiero una plataforma digital para gestionar mi negocio, con registro de usuarios, panel de control y reportes básicos.';

// -- Labels (replica de frontend/constants) --
const PLATAFORMA_LABELS = { web: 'sitio web', app: 'aplicación móvil', ambas: 'sitio web y aplicación móvil' };
const PUBLICO_LABELS = { personas: 'uso personal / para mí', emprendimiento: 'emprendedores y pequeñas empresas', profesionales: 'profesionales independientes', tiendas: 'comercio, tiendas o vendedores' };
const VOLUMEN_LABELS = { menos_100: 'menos de 100 visitas/ventas al mes (etapa inicial)', '100_1000': 'entre 100 y 1.000 visitas/ventas al mes', '1000_10000': 'entre 1.000 y 10.000 visitas/ventas al mes', mas_10000: 'más de 10.000 visitas/ventas al mes (alto volumen)' };
const FIN_LABELS = { lucrativo: 'fines lucrativos (generar ingresos)', educativo: 'fines educativos o de divulgación', salud: 'orientado a la salud o bienestar', mas_adelante: 'propósito a definir' };
const MODELO_LABELS = { suscripcion: 'suscripción mensual', pago_unico: 'pago único', gratuito: 'gratuita', no_se: 'modelo de negocio a definir' };
const CUANDO_LABELS = { ya: 'lo antes posible (aprox. 4 a 7 días)', semanas: 'en unas semanas (aprox. 8 a 14 días)', sin_apuro: 'sin apuro (aprox. 15 a 20 días)', solo_costo: 'solo quiere saber el costo estimado' };

function buildIdeaText({ publico, plataforma, contexto, modelo_negocio, cuando }) {
  const isVolumen = publico === 'emprendimiento' || publico === 'tiendas';
  const contextoLabel = isVolumen
    ? `Volumen actual: ${VOLUMEN_LABELS[contexto] ?? contexto}.`
    : `Propósito del proyecto: ${FIN_LABELS[contexto] ?? contexto}.`;

  return [
    `Público objetivo: ${PUBLICO_LABELS[publico] ?? publico}.`,
    `Plataforma: ${PLATAFORMA_LABELS[plataforma] ?? plataforma}.`,
    contexto ? contextoLabel : null,
    `Modelo de negocio: ${MODELO_LABELS[modelo_negocio] ?? modelo_negocio}.`,
    `Urgencia: ${CUANDO_LABELS[cuando] ?? cuando}.`,
    DESCRIPCION,
  ].filter(Boolean).join(' ');
}

// Combinaciones representativas: eje plataforma × eje público × contexto significativo
const COMBOS = [
  // -- WEB --
  { plataforma: 'web', publico: 'personas',       contexto: 'lucrativo',    modelo_negocio: 'suscripcion', cuando: 'semanas' },
  { plataforma: 'web', publico: 'personas',       contexto: 'salud',        modelo_negocio: 'pago_unico',  cuando: 'semanas' },
  { plataforma: 'web', publico: 'profesionales',  contexto: 'lucrativo',    modelo_negocio: 'suscripcion', cuando: 'semanas' },
  { plataforma: 'web', publico: 'profesionales',  contexto: 'educativo',    modelo_negocio: 'gratuito',    cuando: 'semanas' },
  { plataforma: 'web', publico: 'emprendimiento', contexto: 'menos_100',    modelo_negocio: 'suscripcion', cuando: 'semanas' },
  { plataforma: 'web', publico: 'emprendimiento', contexto: 'mas_10000',    modelo_negocio: 'suscripcion', cuando: 'ya'      },
  { plataforma: 'web', publico: 'tiendas',        contexto: '100_1000',     modelo_negocio: 'pago_unico',  cuando: 'semanas' },
  { plataforma: 'web', publico: 'tiendas',        contexto: 'mas_10000',    modelo_negocio: 'suscripcion', cuando: 'ya'      },

  // -- APP --
  { plataforma: 'app', publico: 'personas',       contexto: 'lucrativo',    modelo_negocio: 'pago_unico',  cuando: 'semanas' },
  { plataforma: 'app', publico: 'profesionales',  contexto: 'salud',        modelo_negocio: 'suscripcion', cuando: 'semanas' },
  { plataforma: 'app', publico: 'emprendimiento', contexto: '100_1000',     modelo_negocio: 'suscripcion', cuando: 'semanas' },
  { plataforma: 'app', publico: 'tiendas',        contexto: '1000_10000',   modelo_negocio: 'suscripcion', cuando: 'ya'      },

  // -- AMBAS --
  { plataforma: 'ambas', publico: 'personas',       contexto: 'educativo',  modelo_negocio: 'gratuito',    cuando: 'sin_apuro' },
  { plataforma: 'ambas', publico: 'profesionales',  contexto: 'lucrativo',  modelo_negocio: 'suscripcion', cuando: 'semanas'   },
  { plataforma: 'ambas', publico: 'emprendimiento', contexto: '1000_10000', modelo_negocio: 'suscripcion', cuando: 'semanas'   },
  { plataforma: 'ambas', publico: 'tiendas',        contexto: 'mas_10000',  modelo_negocio: 'suscripcion', cuando: 'ya'        },
];

async function callAnalyze(idea) {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function formatUsd(n) { return `$${n.toLocaleString('es-AR')}` }

async function run() {
  console.log(`Probando ${COMBOS.length} combinaciones contra ${API_BASE}...\n`);

  const results = [];
  let ok = 0, fail = 0;

  for (let i = 0; i < COMBOS.length; i++) {
    const combo = COMBOS[i];
    const idea = buildIdeaText(combo);
    const label = `[${String(i + 1).padStart(2, '0')}] ${combo.plataforma.toUpperCase()} | ${combo.publico} | ${combo.contexto}`;

    process.stdout.write(`${label} → `);

    try {
      const { analysis, estimation } = await callAnalyze(idea);
      const row = {
        ...combo,
        tipo_proyecto: analysis.tipo_proyecto,
        complejidad: analysis.complejidad,
        horas_estimadas: analysis.horas_estimadas,
        horas_ajustadas: estimation.horas_totales_ajustadas,
        multiplicador: estimation.multiplicador_complejidad,
        precio_usd: estimation.precio_final_usd,
        dias_entrega: estimation.dias_entrega_estimados,
      };
      results.push({ status: 'ok', ...row });
      console.log(`${analysis.complejidad.toUpperCase().padEnd(8)} ${formatUsd(estimation.precio_final_usd).padStart(10)}`);
      ok++;
    } catch (err) {
      results.push({ status: 'error', ...combo, error: err.message });
      console.log(`ERROR: ${err.message}`);
      fail++;
    }

    // Pausa entre llamadas para no saturar rate limit
    if (i < COMBOS.length - 1) await sleep(1500);
  }

  // -- Generar reporte --
  const now = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
  const lines = [];

  lines.push('REPORTE DE PRECIOS — TEST AUTOMATIZADO');
  lines.push(`Generado: ${now}`);
  lines.push(`Backend: ${API_BASE} | Modelo: llama-3.3-70b-versatile`);
  lines.push(`Descripción fija: "${DESCRIPCION}"`);
  lines.push('='.repeat(90));
  lines.push('');

  // Tabla
  const header = ['#', 'Plataforma', 'Público', 'Contexto', 'Modelo negocio', 'Urgencia', 'Complejidad', 'Hs IA', 'Mult.', 'Hs ajust.', 'Precio USD', 'Días'].join('\t');
  lines.push(header);
  lines.push('-'.repeat(90));

  results.forEach((r, i) => {
    if (r.status === 'error') {
      lines.push(`${i + 1}\tERROR: ${r.error}`);
      return;
    }
    lines.push([
      String(i + 1).padStart(2, '0'),
      r.plataforma,
      r.publico,
      r.contexto,
      r.modelo_negocio,
      r.cuando,
      r.complejidad,
      r.horas_estimadas,
      r.multiplicador,
      r.horas_ajustadas,
      `$${r.precio_usd}`,
      r.dias_entrega,
    ].join('\t'));
  });

  lines.push('');
  lines.push('='.repeat(90));
  lines.push('RESUMEN');
  lines.push('-'.repeat(40));

  const okRows = results.filter(r => r.status === 'ok');
  if (okRows.length > 0) {
    const precios = okRows.map(r => r.precio_usd).sort((a, b) => a - b);
    const min = precios[0];
    const max = precios[precios.length - 1];
    const avg = Math.round(precios.reduce((a, b) => a + b, 0) / precios.length);
    lines.push(`Total probadas : ${COMBOS.length}`);
    lines.push(`Exitosas       : ${ok}`);
    lines.push(`Fallidas       : ${fail}`);
    lines.push(`Precio mínimo  : $${min}`);
    lines.push(`Precio máximo  : $${max}`);
    lines.push(`Precio promedio: $${avg}`);
    lines.push('');
    lines.push('Por complejidad:');
    ['baja', 'media', 'alta', 'muy_alta'].forEach(c => {
      const grupo = okRows.filter(r => r.complejidad === c);
      if (grupo.length === 0) return;
      const gPrecios = grupo.map(r => r.precio_usd);
      const gMin = Math.min(...gPrecios);
      const gMax = Math.max(...gPrecios);
      lines.push(`  ${c.padEnd(10)}: ${grupo.length} casos | $${gMin} – $${gMax}`);
    });
    lines.push('');
    lines.push('Por plataforma:');
    ['web', 'app', 'ambas'].forEach(p => {
      const grupo = okRows.filter(r => r.plataforma === p);
      if (grupo.length === 0) return;
      const gPrecios = grupo.map(r => r.precio_usd);
      const gAvg = Math.round(gPrecios.reduce((a, b) => a + b, 0) / gPrecios.length);
      lines.push(`  ${p.padEnd(10)}: promedio $${gAvg}`);
    });
  }

  const report = lines.join('\n');
  const filename = `test-prices-${Date.now()}.txt`;
  fs.writeFileSync(filename, report, 'utf8');

  console.log('\n' + '='.repeat(50));
  console.log(`Reporte guardado: ${filename}`);
  console.log(`OK: ${ok} | Fallidas: ${fail}`);
}

run().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
