// src/routes/contact.js
const express = require('express');
const { body } = require('express-validator');
const contactController = require('../controllers/contactController.js');

const router = express.Router();

router.post(
  '/',
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Email inválido'),
    body('mensaje').notEmpty().withMessage('El mensaje es obligatorio'),
  ],
  contactController.sendContact
);

module.exports = router;