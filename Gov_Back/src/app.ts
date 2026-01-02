import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { requestContext } from './middlewares/requestContext.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { servicesRouter } from './modules/services/services.router.js';
import { authRouter } from './modules/auth/otp.router.js';
import { appointmentsRouter } from './modules/appointments/appointments.router.js';
import { adminRouter } from './modules/admin/admin.router.js';
import decisionRouter from "./modules/decision/decision.router";
import { meRouter } from './modules/me/me.router.js';
import { createSmtpEmailProvider } from './modules/notifications/email.provider.js';
const debugEmailProvider = createSmtpEmailProvider();


export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));
  app.use(requestContext);

  app.post('/debug/send-email', async (_req, res, next) => {
  try {
    await debugEmailProvider.sendEmail(
      'lama744423@gmail.com',
      'TEST EMAIL FROM BACKEND ✅',
      'إذا وصلتك هذه الرسالة، فكل النظام شغال 100%'
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
app.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'UP', ts: new Date().toISOString() });
});



  app.use('/services', servicesRouter);
  app.use('/auth', authRouter);
  app.use('/appointments', appointmentsRouter);
  app.use('/admin', adminRouter);
  app.use("/decision", decisionRouter);
  app.use('/me', meRouter);

  app.use(notFound);
  app.use(errorHandler);


  return app;
}
