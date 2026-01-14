// server/src/routes/kpi.js
const express = require('express');
const router = express.Router();
const {
  getKPIs,
  getKPIById,
  createKPI,
  updateKPI,
  deleteKPI,
  calculateKPI
} = require('../controllers/kpiController');
const { protect } = require('../middleware/auth');


router.use(protect);

router.route('/')
  .get(getKPIs)
  .post(createKPI);

router.post('/calculate', calculateKPI);

router.route('/:id')
  .get(getKPIById)
  .put(updateKPI)
  .delete(deleteKPI);

module.exports = router;