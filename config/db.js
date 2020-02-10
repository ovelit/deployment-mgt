const Sequelize = require('sequelize');
require('dotenv').config({ path: 'variables.env'});

 module.exports = new Sequelize(process.env.BD_NOMBRE,process.env.BD_USER,process.env.BD_PASS, {
 	host: process.env.BD_HOST,
 	dialect :'mysql',
 
 	// para desactivar los msg de corrida en la terminal
 	//logging :false,

 });

