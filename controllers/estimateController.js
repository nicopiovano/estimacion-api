const { analyzeProjectIdea } = require('../services/aiService');
const { computeEstimation } = require('../services/estimationService');
const { generateProjection } = require('../services/projectionService');

async function analyze(req, res) {
  try {
    const { idea } = req.body;

    if (!idea || typeof idea !== 'string') {
      return res.status(400).json({ error: 'El campo "idea" es requerido y debe ser un string.' });
    }

    const analysis = await analyzeProjectIdea(idea);
    const estimation = computeEstimation(analysis);

    return res.status(200).json({ analysis, estimation });
  } catch (error) {
    console.error('[estimateController.analyze]', error.message);
    return res.status(500).json({ error: error.message || 'Error interno al analizar la idea.' });
  }
}

async function projection(req, res) {
  try {
    const { usuarios_iniciales, precio_mensual, crecimiento_mensual, churn_rate, costos_mensuales } = req.body;

    const missingFields = ['usuarios_iniciales', 'precio_mensual', 'crecimiento_mensual', 'churn_rate', 'costos_mensuales'].filter(
      (field) => req.body[field] === undefined
    );

    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Campos requeridos faltantes: ${missingFields.join(', ')}` });
    }

    const result = generateProjection({
      usuarios_iniciales: Number(usuarios_iniciales),
      precio_mensual: Number(precio_mensual),
      crecimiento_mensual: Number(crecimiento_mensual),
      churn_rate: Number(churn_rate),
      costos_mensuales: Number(costos_mensuales),
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[estimateController.projection]', error.message);
    return res.status(500).json({ error: error.message || 'Error interno al generar la proyección.' });
  }
}

module.exports = { analyze, projection };
