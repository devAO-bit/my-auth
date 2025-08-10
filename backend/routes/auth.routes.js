import express from 'express';
import { registerController, loginController, logoutController, refreshAccessTokenController, logoutAllController} from '../controllers/auth.controller.js';
import {requireAuth} from '../middleware/auth.middleware.js'

const router = express.Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/logout', requireAuth, logoutController);
router.post('/logout-all', requireAuth, logoutAllController);
router.post('/refresh-token', requireAuth, refreshAccessTokenController);


export default router;