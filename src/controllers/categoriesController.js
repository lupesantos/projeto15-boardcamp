import connection from '../postgres/postgres.js';
import Joi from 'joi';

const categorieSchema = Joi.object({
	name: Joi.string().required(),
});

const getCategories = async (req, res) => {
	const categorias = await connection.query('SELECT * FROM categories;');
	res.send(categorias.rows);
};

const postCategories = async (req, res) => {
	const { name } = req.body;

	const validation = categorieSchema.validate({ name });

	if (validation.error) {
		const errors = validation.error.details
			.map((value) => value.message)
			.join(',');

		return res.status(400).send(errors);
	}

	try {
		const existe = await connection.query(
			'SELECT categories.id FROM categories WHERE name = $1;',
			[name]
		);

		if (existe.rows.length !== 0) {
			return res.status(409).send('Categoria já existe');
		}

		await connection.query('INSERT INTO categories (name) VALUES ($1);', [
			name,
		]);
		res.sendStatus(201);
	} catch (error) {
		console.log(error);
	}
};

export { getCategories, postCategories };
