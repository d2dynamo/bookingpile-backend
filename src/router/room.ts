import { Router } from 'express';

import { cListRooms, cListAvailableTimes } from '../controllers';
import { timeSlotConsistency } from '../middleware';

const router = Router();

router.get('/list', cListRooms);
router.get('/available', [timeSlotConsistency, cListAvailableTimes]);

export default router;
