const Comentarios = require('../../models/Comentarios');
const Meeti = require('../../models/Meeti');


exports.agregarComentario = async (req, res, next) => {
	//obtener el comentario
	const { comentario } = req.body;

	// crea comentario en la BD
	await Comentarios.create({
		mensaje : comentario,
		usuarioId : req.user.id,
		meetiId : req.params.id
	});

	// redireccionar a la misma pagina
	res.redirect('back'); // va a una pagina previa
	next();

}
// elimina un comentario de la DB
exports.eliminarComentario = async (req, res, next) => {
	
	// tomar el ID del comentario
	const { comentarioId} = req.body;

	// Consultar el Comentario
	const comentario = await Comentarios.findOne({ where : { id: comentarioId }});


	// verificar si existe el comentario

	if(!comentario) {
		res.status(404).send('Accion no Valida');
		return next();
	}

	// consultar el meeti del comentario
	const meeti = await Meeti.findOne({ where : { id: comentario.meetiId }});

	//verificar que quien lo borra sea el creador
	if(comentario.usuarioId === req.user.id || meeti.usuarioId === req.user.id ){
		await Comentarios.destroy({ where: {
			id : comentarioId
		}});
		res.status(200).send('Eliminado Correctamente');
		return next();
	} else {
		res.status(403).send('Accion no Valida');
		return next();
	}
}