const express = require('express');
const expresslayouts =require('express-ejs-layouts');
const path = require('path');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const expressValidator = require('express-validator');
const passport = require('./config/passport');
const router = require('./routes');

//configuracion y modelos
const db = require('./config/db');
require('./models/Usuarios');
require('./models/Categorias');
require('./models/Comentarios');
require('./models/Grupos');
require('./models/Meeti');

db.sync().then(() => console.log('DB Conectada')).catch((error) => console.log(error));

// variables de desarrollo
require('dotenv').config({path:'variables.env'});

// aplicacion principal
const app = express();

// Body parser, leer formularios
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

// express validator (validacion con bastantes funciones)
app.use(expressValidator());

// habilitar EJS como template engine
app.use(expresslayouts);
app.set('view engine', 'ejs');

// ubicacion vista
app.set('views', path.join(__dirname, './views'));

// archivos staticos
app.use(express.static('public'));

// habilitar cookie parser
app.use(session({
	secret: process.env.SECRETO,
	key: process.env.key,
	resave: false,
	saveUninitialized: false
}))

//inicializar passport
app.use(passport.initialize());
app.use(passport.session());

// agrega flash message
app.use(flash());

//middleware (usuario logueado, flash messages, fecha actual)
app.use((req, res, next) => {
	res.locals.usuario = {...req.user} || null;
	res.locals.mensajes = req.flash();
	const fecha = new Date();
	res.locals.year = fecha.getFullYear();
	next();
});

// routing
app.use('/', router());

// leer el host y el puerto
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 5000;

// agrega el puerto
app.listen(port, host, () =>{
	console.log('el servidor esta funcionado');
})

