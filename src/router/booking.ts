import { Router } from 'express';

import { cCreateBooking, cGetBooking, cUpdateBooking } from '../controllers';
import { timeSlotConsistency } from '../middleware';

const router = Router();

router.use(timeSlotConsistency);

router.get('/:id', cGetBooking);
router.post('/create', cCreateBooking);
router.post('/update', cUpdateBooking);

export default router;
