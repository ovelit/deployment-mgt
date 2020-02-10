const Usuarios = require('../models/Usuarios');
const enviarEmail = require('../handlers/emails');

const multer = require('multer');
const shortid = require('shortid');
const fs = require('fs');
//const uuid = require('uuid/v4');

const configuracionMulter = {
	limits : { fileSize : 5000000},
	storage: fileStorage = multer.diskStorage({
		destination: (req, file, next) =>{
			next(null, __dirname+'/../public/uploads/perfiles/');
		},
		filename : (req, file, next) => {
			const extension = file.mimetype.split('/')[1];
			next(null, `${shortid.generate()}.${extension}`);
		}
	}),
	fileFilter(req, file, next) {
		if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
			// el formato es valido
			next(null, true);
		} else {
			// el formato no es valido
			next(new Error('Formato no valido'), false);
		}
	}
}

const upload = multer(configuracionMulter).single('imagen');

// sube imagen en el servidor
exports.subirImagen = (req, res, next) => {
	upload(req, res, function(error) {
		if(error) {
			if(error instanceof multer.MulterError) {
				if(error.code=== 'LIMIT_FILE_SIZE') {
				req.flash('error','El archivo es muy grande')
				} else {
					req.flash('error',error.message);
				}
			} else if(error.hasOwnProperty('message')) {
				req.flash('error', error.message);
			}
			res.redirect('back');
			return;
			
		} else {
			next();
		}
	})
}


exports.formCrearCuenta = (req,res) => {
		res.render('crear-cuenta',{
			nombrePagina :'Crea tu Cuenta'
		})
	}

exports.crearNuevaCuenta = async (req,res) => {
	const usuario = req.body;

	req.checkBody('confirmar', 'El password confirmado no puede ir vacio').notEmpty();
	req.checkBody('confirmar', 'El password es diferente').equals(req.body.password);

	// leer los errores de express
	const erroresExpress = req.validationErrors();

	try {
		await Usuarios.create(usuario);

		// Url de confirmacion
		const url = `http://${req.headers.host}/confirmar-cuenta/${usuario.email}`;
		

		// enviar emal de confirmacion
		await enviarEmail.enviarEmail({
			usuario,
			url,
			subject : 'Confirma tu cuenta de MGT',
			archivo : 'confirmar-cuenta'
		})
	
	//  flash message y redireccionar

	req.flash('exito', 'Hemos enviado un email, confirma tu cuenta');
	res.redirect('/iniciar-sesion');

	} catch (error) {

		// extraer el message de los errores
		const erroresSequelize = error.errors.map(err => err.message);
		//console.log(erroresSequelize);

		// extraer unicamente el msg de los errores
		const errExp = erroresExpress.map(err => err.msg);

		console.log(errExp);

		// unirlos
		const listaErrores = [...erroresSequelize, ...errExp];

		req.flash('error',listaErrores);
		res.redirect('/crear-cuenta');
	}
}

// Confirma la suscripcion del usuario
exports.confirmarCuenta = async (req, res, next) => {
	//verificar que el usuario existe
	const usuario = await Usuarios.findOne({ where : { email: req.params.correo }});

	// sino existe, redireccionar
	if(!usuario) {
		req.flash('error', 'No existe esa cuenta');
		res.redirect('/crear-cuenta');
		return next();
	}

	// si existe, confirmar suscripcion y redireccionar

	//console.log(usuario.activo);

	usuario.activo = 1;
	await usuario.save();

	req.flash('exito', 'la cuenta se ha confirmado, ya puedes iniciar sesion');
	res.redirect('/iniciar-sesion');

}

// formulario para iniciar sesion

exports.formIniciarSesion = (req,res) => {
		res.render('iniciar-sesion',{
			nombrePagina :'Iniciar Sesion'
		})
	}
	// muestra el formulario para editar el perfil
	exports.formEditarPerfil = async (req, res) => {
		const usuario = await Usuarios.findByPk(req.user.id);

		res.render('editar-perfil', {
			nombrePagina : 'Ediar Perfil',
			usuario
		})
	}

	// almacena en la BD los cambio al perfil
		exports.editarPerfil = async (req, res) => {
			const usuario = await Usuarios.findByPk(req.user.id);

			req.sanitizeBody('nombre');
			req.sanitizeBody('email');

			//leer datos del form
			const { nombre, descripcion, email} = req.body;

			// asignar los valores
			usuario.nombre = nombre;
			usuario.descripcion =descripcion;
			usuario.email = email;

			//guardar en la BD
			await usuario.save();
			req.flash('exito','Cambios Guardados Correctamente');
			res.redirect('/administracion');
		}

		// muestra el formulario para cambiar el password
		exports.formCambiarPassword = (req, res) => {
			res.render('cambiar-password', {
				nombrePagina :'Cambiar Password'
			})
		} 

		// revisa si el password anterior es correcto y l modifica por uno uevo

		exports.cambiarPassword = async (req, res, next) => {
			const usuario = await Usuarios.findByPk(req.user.id);

			// verificar que el password sea correcto
			if(!usuario.validarPassword(req.body.anterior)) {
				req.flash('error','el password actual es incorrecto');
				res.redirect('/administracion');
				return next();
			}

			// si el password es correcto, hashear el nuevo
			const hash = usuario.hashPassword(req.body.nuevo);

			// asignar el password al usuario
				usuario.password =hash;
			
			// guardar en la BD
				await usuario.save();

			// redireccionar
				req.logout();
				req.flash('exito','Password Modificado Correctamente');
				res.redirect('/iniciar-sesion');
		}

		// muestra el formulario para subir una imagen de perfil
		exports.formSubirImagenPerfil = async (req, res ) => {
			const usuario = await Usuarios.findByPk(req.user.id);

			// mostrar la vista
			res.render('imagen-perfil',{
				nombrePagina : 'Subir Imagen Perfil',
				usuario
			});
		} 

		// guarda la imagen nueva, elimina la anterior (si aplica) y gusrda el registro enb la BD
		exports.guardarImagenPerfil = async (req, res ) => {
			const usuario = await Usuarios.findByPk(req.user.id);

		// si hay imagen anterior, eliminarla
			if(req.file && usuario.imagen) {
			const imagenAnteriorPath =__dirname + `/../public/uploads/perfiles/${usuario.imagen}`;

			// eliminar archivos con filesystem
				fs.unlink(imagenAnteriorPath, (error) => {
					if(error) {
						console.log(error);
					}
					return;
				})
			}

		// almacenar en la BD
		if(req.file) {
			usuario.imagen = req.file.filename;
		}

		// redireccionar
		await usuario.save();
		req.flash('exito', 'Cambios Almacenado correctamente');
		res.redirect('/administracion');

		}

// reestablecer la contrasena

exports.formReestablecerPassword = (req, res) => {
	res.render('reestablecer', {
		nombrePagina:' Reestablecer tu contrasena'
	})
}