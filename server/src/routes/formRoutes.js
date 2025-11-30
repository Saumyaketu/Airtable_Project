const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const auth = require('../middleware/authMiddleware');

router.get('/my-forms', auth, formController.getMyForms);
router.get('/:formId/responses', auth, formController.getFormResponses);
router.post('/', auth, formController.createForm);

router.get('/bases', auth, formController.getBases);
router.get('/bases/:baseId/tables', auth, formController.getTables);

router.get('/:id', formController.getFormPublic);
router.post('/:id/submit', formController.submitResponse);

module.exports = router;