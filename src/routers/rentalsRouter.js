import { Router } from 'express';
import {
	postRentals,
	getRentals,
	deleteRentals,
	postRentalsReturnById,
} from '../controllers/rentalsController.js';

const rentalsRouter = Router();

rentalsRouter.post('/rentals', postRentals);

rentalsRouter.post('/rentals/:id/return', postRentalsReturnById);

rentalsRouter.get('/rentals', getRentals);

rentalsRouter.delete('/rentals/:id', deleteRentals);

export default rentalsRouter;
