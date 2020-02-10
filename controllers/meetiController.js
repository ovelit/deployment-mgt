const Grupos = require('../models/Grupos');
const Meeti = require('../models/Meeti');

const uuid = require('uuid/v4');


// Muestra el formulario para nuevos meeti
exports.formNuevoMeeti = async (req, res) => {
	const grupos = await Grupos.findAll({ where : { usuarioId : req.user.id }});
	
	res.render('nuevo-meeti', {
		nombrePagina : 'Crear Nuevo Meeti',
		grupos
	})
}


// inserta nuevos meeti en la BD
exports.crearMeeti = async (req, res) => {
	// obtener los datos 
	const meeti = req.body;

	// asignar el usuario
	meeti.usuarioId = req.user.id;

	//const point = {type : 'Point', coordinates :[ parseFloat(req.body.lat), parseFloat(req.body.lng)] };
	//meeti.ubicacion = point;

	//cupo opcional
	if(req.body.cupo === '') {
		meeti.cupo = 0;
	}
	
	 meeti.id = uuid();

	// almacenar en la BD 
	try {
		await Meeti.create(meeti);
		req.flash('exito','Se ha creado el Meeti correctamente');
		res.redirect('/administracion');
	} catch (error) {
		// extraer el message de los errores
		const erroresSequelize = error.errors.map(err => err.message);
		req.flash('error',erroresSequelize);
		res.redirect('/nuevo-meeti');
	}

}

// sanitiza los meeti
exports.sanitizarMeeti = (req, res, next) => {
	req.sanitizeBody('titulo');
	req.sanitizeBody('invitado');
	req.sanitizeBody('cupo');
	req.sanitizeBody('fecha');
	req.sanitizeBody('hora');
	req.sanitizeBody('direccion');
	req.sanitizeBody('ciudad');
	req.sanitizeBody('estado');
	req.sanitizeBody('pais');
	req.sanitizeBody('lat');
	req.sanitizeBody('lng');
	req.sanitizeBody('grupoId');

	next();
}

// Muestra el formulario para editar un meeti
exports.formEditarMeeti = async (req, res, next) => {
	const consultas = [];
	consultas.push(Grupos.findAll({ where : { usuarioId : req.user.id }}) );
	consultas.push(Meeti.findByPk(req.params.id) );

	// return un promise
	const [grupos, meeti] = await Promise.all(consultas);

	if(!grupos || !meeti ){
		req.flash('error', 'Operacion no Valida');
		res.redirect('/administracion');
		return next();
	}

	// mostramos la vista
	res.render('editar-meeti', {
		nombrePagina : `Editar Meeti : ${meeti.titulo}`,
		grupos,
		meeti
	})

}

//almacena los cambios en el meeti (DB)

exports.editarMeeti =async (req, res, next) => {
	const meeti = await Meeti.findOne({ where : { id: req.params.id, usuarioId : req.user.id }});

	if(!meeti) {
		req.flash('error', 'Operacion no Valida');
		res.redirect('/administracion');
		return next();
	}

	// asignar los valores

	const { grupoId, titulo, invitado, fecha, hora, cupo, descripcion, direccion, ciudad, estado, pais, lat, lng } = req.body;

	meeti.grupoId = grupoId;
	meeti.titulo = titulo;
	meeti.invitado = invitado;
	meeti.fecha = fecha;
	meeti.hora = hora;
	meeti.cupo = cupo;
	meeti.descripcion = descripcion;
	meeti.direccion = direccion;
	meeti.ciudad = ciudad;
	meeti.estado = estado;
	meeti.pais = pais;
	meeti.lat =lat;
	meeti.lng =lng;

	//asignar point

//	const point { type: 'Point', coordinates: [parseFloat(lat), parseFloat(lng)]};
//	meeti.ubicacion = point;

	// almacenar en la BD

	await meeti.save();
	req.flash('exito','Cambios guardados correctamente');
	res.redirect('/administracion');
}

// muestra un formulario para eliminar meeti

exports.formEliminarMeeti = async (req, res, next) => {
	const meeti = await Meeti.findOne({ where : { id: req.params.id, usuarioId : req.user.id }});

	if(!meeti) {
		req.flash('error', 'Operacion no Valida');
		res.redirect('/administracion');
		return next();
	}

	// mostrar la vista
	res.render('eliminar-meeti', {
		nombrePagina : `Eliminar Meeti : ${meeti.titulo}`
	})

}

// elimina el meeti de la BD

exports.eliminarMeeti = async (req, res) => {
	 await Meeti.destroy({
		where: {
			id: req.params.id
		}
	});

	req.flash('exito', 'Meeti Eliminado');
	res.redirect('/administracion');

}