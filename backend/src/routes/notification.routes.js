import { Router } from 'express';
import * as notifications from '../controllers/notification.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateParam } from '../middlewares/params.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { idParam, notificationPrefsSchema, registerDeviceSchema, removeDeviceSchema } from '../validators/engagement.validator.js';

const router = Router();

router.use(requireAuth);

router.post('/devices', validate(registerDeviceSchema), notifications.addDevice);
router.delete('/devices', validate(removeDeviceSchema), notifications.removeDevice);
router.get('/preferences', notifications.getPrefs);
router.patch('/preferences', validate(notificationPrefsSchema), notifications.updatePrefs);

router.get('/', notifications.list);
router.get('/unread-count', notifications.unread);
router.post('/read-all', notifications.readAll);
router.patch('/:id/read', validateParam('id', idParam), notifications.read);
router.delete('/:id', validateParam('id', idParam), notifications.remove);

export default router;
