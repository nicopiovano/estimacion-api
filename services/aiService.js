const Groq = require('groq-sdk');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Eres un arquitecto de software senior especializado en estimación de proyectos digitales. Analizás ideas y devolvés ÚNICAMENTE un JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{
  "tipo_proyecto": "string (web_app | mobile_app | api | saas | ecommerce | otro)",
  "features": ["array de strings con las features principales"],
  "complejidad": "string (baja | media | alta | muy_alta)",
  "usuarios_estimados": number,
  "requests_por_usuario_por_dia": number,
  "almacenamiento_estimado_mb": number,
  "integraciones": ["array de strings con integraciones externas necesarias"],
  "horas_estimadas": number
}

REGLAS DE ESTIMACIÓN — seguí estas referencias con precisión:

COMPLEJIDAD BAJA (multiplicador 1.0):
- Sitio web personal, portfolio, landing page, blog sin CMS propio
- Sin autenticación propia, sin base de datos custom, sin lógica de negocio
- Ejemplos: portfolio personal, página de presentación de un profesional, sitio institucional simple
- Rango de horas: 7–25

COMPLEJIDAD MEDIA (multiplicador 1.3):
- Web app o app con autenticación de usuarios, panel básico, CRUD simple
- Tienda online simple, sistema de turnos, app de gestión básica
- Hasta 2–3 integraciones externas (pagos, email, mapas)
- Rango de horas: 25–80

COMPLEJIDAD ALTA (multiplicador 1.6):
- SaaS con múltiples roles, lógica de negocio compleja, dashboards avanzados
- Marketplace, plataforma con pagos recurrentes, app con notificaciones en tiempo real
- Más de 3 integraciones o integraciones complejas (ERP, APIs bancarias, etc.)
- Rango de horas: 60–105

COMPLEJIDAD MUY_ALTA (multiplicador 2.0):
- Plataforma empresarial, red social, sistema financiero, app con IA propia
- Alta disponibilidad, arquitectura distribuida, >10.000 usuarios concurrentes
- Rango de horas: 80–100

CRITERIOS ADICIONALES:
- "uso personal", "para mí", "sin fines de lucro", "educativo" + sin funcionalidades complejas → complejidad BAJA
- "app móvil" suma +30% de horas respecto a una web equivalente
- "ambas" (web + app) suma +60% de horas respecto a solo web
- "sin apuro" o "solo quiero saber el costo" NO aumenta las horas
- "lo antes posible" sugiere alcance reducido → ajustá las horas a la baja
- Un proyecto con usuarios_estimados < 500 raramente necesita complejidad MUY_ALTA

Sé conservador en horas: es mejor subestimar y ajustar que sobreestimar y asustar al cliente.`;

async function analyzeProjectIdea(userInput) {
  if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
    throw new Error('El input del usuario es requerido y debe ser un string no vacío.');
  }

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analiza esta idea de proyecto y devuelve el JSON: "${userInput.trim()}"`,
      },
    ],
  });

  const rawText = completion.choices[0]?.message?.content ?? '';

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('La IA no devolvió un JSON válido.');
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  validateAIResponse(parsed);
  return parsed;
}

function validateAIResponse(data) {
  const required = [
    'tipo_proyecto',
    'features',
    'complejidad',
    'usuarios_estimados',
    'requests_por_usuario_por_dia',
    'almacenamiento_estimado_mb',
    'integraciones',
    'horas_estimadas',
  ];

  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Campo requerido faltante en respuesta de IA: ${field}`);
    }
  }

  if (!Array.isArray(data.features)) throw new Error('features debe ser un array.');
  if (!Array.isArray(data.integraciones)) throw new Error('integraciones debe ser un array.');
  if (typeof data.usuarios_estimados !== 'number') throw new Error('usuarios_estimados debe ser un número.');
  if (typeof data.horas_estimadas !== 'number') throw new Error('horas_estimadas debe ser un número.');
}

module.exports = { analyzeProjectIdea };
