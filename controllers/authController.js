const passport = require('passport');
const Usuarios = require('../models/Usuarios');
const moment = require('moment');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const crypto = require('crypto');
const bcrypt = require('bcrypt-nodejs');
const enviarEmail = require('../handlers/emails');

// autenticar el usuario
exports.autenticarUsuario = passport.authenticate('local', {
	successRedirect : '/administracion',
	failureRedirect : '/iniciar-sesion',
	failureFlash : true,
	badRequestMessage : 'Ambos campos son obligatorios'

});

// revisa si el usuario esta autenticado o no
exports.usuarioAutenticado = (req, res, next) => {
	//si el usuario esta autenticado, adelante
	if(req.isAuthenticated() ) {
		return next();
	}

	// sino esta autenticado
	return res.redirect('/iniciar-sesion');
}

// cerrar sesion
exports.cerrarSesion = (req, res, next) => {
	req.logout();
	req.flash('correcto', 'Cerraste Sesion correctamente');
	res.redirect('/iniciar-sesion');
	next();
}

// genera un token si el usuario es valido
exports.enviarToken = async (req, res) => {
	// verificar que el usuario exista
	const usuario = await Usuarios.findOne({where: {email: req.body.email }});

	// si no existe el usuario 
	if(!usuario) {
		req.flash('error', 'No existe esa cuenta');
		res.redirect('/reestablecer');
	}

	// usuario existe
	usuario.tokenPassword = crypto.randomBytes(20).toString('hex');
	usuario.expiraToken = Date.now() + 3600000; // una hora

	// guardarlos en la base de datos
	await usuario.save();

	// url de reset
	const url =`http://${req.headers.host}/reestablecer/${usuario.tokenPassword}`;

	//enviar el correo con el token

	await enviarEmail.enviarEmail({
		usuario,
		subject: 'Password Reset',
		url,
		archivo: 'reestablecer-password'
	})

	//  flash message y redireccionar

	req.flash('exito', 'Hemos enviado un email, Reestablece tu Password');
	res.redirect('/iniciar-sesion');
}

exports.validarToken = async (req, res) => {
	const usuario = await Usuarios.findOne({
		where: {
			tokenPassword: req.params.tokenPassword
		}
	});

	// sino encuentra el usuario
	if(!usuario) {
		req.flash('error','No valido');
		res.redirect('/reestablecer');
	}

	// formulario para generar el password
	res.render('resetPassword', {
		nombrePagina : 'Reestablecer Contrasena'
	})

}

// cambia el password por uno nuevo

exports.actualizarPassword = async (req, res) => {

	// verificar el token valido pero tambien la fecha de expiracion
	const usuario = await Usuarios.findOne({		
		where: { tokenPassword: req.params.tokenPassword, 
			expiraToken : { [Op.gte] : Date.now() }
		}
	});

	// verificamos si el usuario existe
	console.log(usuario);

	if(!usuario) {
			req.flash('error','No valido');
			res.redirect('/reestablecer');
	}

	// hashear el nuevo password
		usuario.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10),null );
		usuario.tokenPassword = null;
		usuario.expiraToken = null;

	// guardamos el neuvo password
	await usuario.save();
	req.flash('exito','Tu password se ha modificado correctamente');
	res.redirect('/iniciar-sesion');
				
}

