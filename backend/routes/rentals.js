const express = require('express');
const { protect, ensureDataIsolation } = require('../middlewares/auth');
const {
  getRentals,
  getRental,
  createRental,
  updateRental,
  deleteRental
} = require('../controllers/rentalController');

const router = express.Router();

router.use(protect);
router.use(ensureDataIsolation);

router.route('/')
  .get(getRentals)
  .post(createRental);

router.route('/:id')
  .get(getRental)
  .put(updateRental)
  .delete(deleteRental);

module.exports = router;