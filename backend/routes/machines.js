const express = require('express');
const { protect, ensureDataIsolation } = require('../middlewares/auth');
const {
  getMachines,
  getMachine,
  createMachine,
  updateMachine,
  deleteMachine
} = require('../controllers/machineController');

const router = express.Router();

router.use(protect);
router.use(ensureDataIsolation);

router.route('/')
  .get(getMachines)
  .post(createMachine);

router.route('/:id')
  .get(getMachine)
  .put(updateMachine)
  .delete(deleteMachine);

module.exports = router;