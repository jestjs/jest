const express = require('express');
const router = new express.Router();

const planTeam = require('../componentsAPI/teamAmericaAPI.js');

//Plan-Team Routes
router.get('/teamamerica', planTeam.getTeam);

module.exports = router;
