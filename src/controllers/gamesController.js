import connection from '../postgres/postgres.js';
import Joi from 'joi';

const gameSchema = Joi.object({
	name: Joi.string().required(),
	stockTotal: Joi.number().min(1),
	pricePerDay: Joi.number().min(1),
});

const postGames = async (req, res) => {
	const { name, image, stockTotal, categoryId, pricePerDay } = req.body;
	const validation = gameSchema.validate(
		{
			name,
			stockTotal,
			pricePerDay,
		},
		{ abortEarly: false }
	);

	if (validation.error) {
		const errors = validation.error.details
			.map((value) => value.message)
			.join(',');

		return res.status(400).send(errors);
	}

	try {
		const existe = await connection.query(
			'SELECT games.id FROM games WHERE name = $1;',
			[name]
		);

		if (existe.rows.length !== 0) {
			return res.status(409).send('Jogo já existe');
		}

		await connection.query(
			'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);',
			[name, image, stockTotal, categoryId, pricePerDay]
		);
		res.sendStatus(201);
	} catch (error) {
		console.log(error);
	}
};
const getGames = async (req, res) => {
	const games = await connection.query(
		`SELECT 
			games.*, 
			categories.name AS "categoryName"
		FROM games JOIN categories ON games."categoryId" = categories.id;`
	);

	const { name } = req.query;

	if (name) {
		const gamesFiltrados = games.rows.filter(
			(game) => game.name.toLowerCase().indexOf(name.toLowerCase()) >= 0
		);

		return res.send(gamesFiltrados);
	} else {
		res.send(games.rows);
	}
};

export { postGames, getGames };
