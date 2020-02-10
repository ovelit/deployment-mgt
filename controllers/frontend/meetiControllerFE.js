const Meeti = require('../../models/Meeti');
const Grupos = require('../../models/Grupos');
const Usuarios = require('../../models/Usuarios');
const Categorias = require('../../models/Categorias');
const Comentarios = require('../../models/Comentarios');
const moment = require('moment');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;


exports.mostrarMeeti = async (req, res ) => {
	const meeti = await Meeti.findOne({
		where : {
			slug :req.params.slug
		},
		include : [
			{
				model: Grupos
			},
			{
				model: Usuarios,
				attributes : ['id', 'nombre', 'imagen']
			}
		]		
	});

	

	// si no existe
	if(!meeti) {
		res.redirec('/');
	}

	// // consultar por meeti cercanos
	// const ubicacion = Sequelize.literal(`ST_GeomFromText( 'POINT( ${meeti.lat} ${meeti.lng} )' )`);

	// // ST_DISTANCE_Sphere = retorna una linea en metros
	// const distancia = Sequelize.fn('ST_Distance_Sphere', Sequelize.col('ubicacion'),ubicacion);

	// // encontrar meetis cercanos
	// const cercanos = await Meeti.findAll({
	// 	order: distancia, // los ordena del mas cercano al lejano
	// 	where : Sequelize.where(distancia, { [Op.lte] :2000 } ), // 2000 metros o 2 km
	// 	limit: 3, // maximo 3
	// 	include : [
	// 		{
	// 			model: Grupos
	// 		},
	// 		{
	// 			model: Usuarios,
	// 			attributes : ['id', 'nombre', 'imagen']
	// 		}
	// 	]	
	// })

	//consultar despues de verificar que existe el meeti
	const comentarios = await Comentarios.findAll({
											where: { meetiId : meeti.id },
											include : [
												{
													model: Usuarios,
													attributes : ['id', 'nombre', 'imagen']
												}
											]
	})

	// pasar el resultado hacia la vista
	res.render('mostrar-meeti', {
		nombrePagina : meeti.titulo,
		meeti,
		comentarios,
//		cercanos,
		moment
	})
}

// Confirma o cancela si el usuario asistrira al meeti
exports.confirmarAsistencia = async (req, res) => {
	console.log(req.body);

	const { accion } = req.body;

	if(accion === 'confirmar') {
		//agrega el usuario
		const meeti = await Meeti.findOne({ where : { slug: req.params.slug }});
		meeti.interesados = meeti.interesados + 1;
		await meeti.save();
		// mensaje
		res.send('Has confirmado tu asistencia');

	} else {
		// cancela la asitencia
		const meeti = await Meeti.findOne({ where : { slug: req.params.slug }});
		meeti.interesados = meeti.interesados - 1;
		await meeti.save();
		// mensaje
		res.send('Has cancelado tu asistencia');
	}
}

// muestra los meetis agrupados por categoria
exports.mostrarCategoria = async (req, res, next) => {
	const categoria = await Categorias.findOne({
									attributes: ['id','nombre'], 
									where : { slug : req.params.categoria}
	});
	const meetis = await Meeti.findAll({
									order: [
										['fecha', 'ASC'],
										['hora', 'ASC']
									],
									include: [
										{
											model: Grupos,
											where : { categoriaId : categoria.id}
										},
										{
											model : Usuarios
										}
									]
	});
	res.render('categoria', {
		nombrePagina : `Categoria: ${categoria.nombre}`,
		meetis,
		moment
	})

	
}