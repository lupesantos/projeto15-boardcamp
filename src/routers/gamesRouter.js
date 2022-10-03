import { Router } from 'express';
import { getGames, postGames } from '../controllers/gamesController.js';

const gamesRouter = Router();

gamesRouter.post('/games', postGames);

gamesRouter.get('/games', getGames);

export default gamesRouter;
