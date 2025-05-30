import { Router } from 'express';
import { TunnelController } from '../controllers/tunnelController.cjs';

const router = Router();

// Tunnel routes
router.post('/start', TunnelController.startTunnel);
router.post('/stop', TunnelController.stopTunnel);

export default router; 