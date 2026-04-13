const { Router } = require('express');
const { analyze, projection } = require('../controllers/estimateController');

const router = Router();

// POST /api/analyze
// Body: { idea: string }
// Response: { analysis: AIAnalysis, estimation: Estimation }
router.post('/analyze', analyze);

// POST /api/projection
// Body: { usuarios_iniciales, precio_mensual, crecimiento_mensual, churn_rate, costos_mensuales }
// Response: { proyecciones: MonthProjection[], resumen: Summary }
router.post('/projection', projection);

module.exports = router;
