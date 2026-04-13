const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres un arquitecto de software senior. Analiza ideas de proyectos y devuelve ÚNICAMENTE un JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{
  "tipo_proyecto": "string (web_app | mobile_app | api | saas | ecommerce | otro)",
  "features": ["array de strings con las features principales"],
  "complejidad": "string (baja | media | alta | muy_alta)",
  "usuarios_estimados": number,
  "requests_por_usuario_por_dia": number,
  "almacenamiento_estimado_mb": number,
  "integraciones": ["array de strings con integraciones externas necesarias"],
  "horas_estimadas": number
}`;

async function analyzeProjectIdea(userInput) {
  if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
    throw new Error('El input del usuario es requerido y debe ser un string no vacío.');
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analiza esta idea de proyecto y devuelve el JSON: "${userInput.trim()}"`,
      },
    ],
  });

  const rawText = message.content[0]?.text ?? '';

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
