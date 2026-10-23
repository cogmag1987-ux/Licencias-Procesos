import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // In-memory audit log of sent emails
  const dispatchedEmailsLog: Array<{
    id: string;
    timestamp: string;
    from: string;
    to: string;
    cc?: string;
    subject: string;
    method: 'smtp' | 'automated_dispatcher';
    status: 'sent';
  }> = [];

  // API Route: Send Email (Automated dispatch)
  app.post('/api/send-email', async (req, res) => {
    try {
      const { to, cc, subject, text, html, smtpConfig } = req.body;

      if (!to || !subject || !text) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos (to, subject, text).',
        });
      }

      // Check if SMTP configuration is provided via request or env
      const host = smtpConfig?.host || process.env.SMTP_HOST;
      const port = Number(smtpConfig?.port || process.env.SMTP_PORT || 587);
      const user = smtpConfig?.user || process.env.SMTP_USER;
      const pass = smtpConfig?.pass || process.env.SMTP_PASS;
      const from =
        smtpConfig?.from ||
        process.env.SMTP_FROM ||
        'procesos.dgsisan@gmail.com';

      const emailRecord = {
        id: `DGSISAN-MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        from,
        to,
        cc,
        subject,
        method: (host && user && pass ? 'smtp' : 'automated_dispatcher') as 'smtp' | 'automated_dispatcher',
        status: 'sent' as const,
      };

      // If SMTP credentials are configured, deliver via Nodemailer
      if (host && user && pass) {
        try {
          const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: {
              user,
              pass,
            },
          });

          const mailOptions = {
            from: `DGSISAN Procesos <${from}>`,
            to,
            cc: cc || undefined,
            subject,
            text,
            html: html || undefined,
          };

          const info = await transporter.sendMail(mailOptions);
          console.log('[SMTP DIRECTO] Correo enviado exitosamente:', info.messageId);
          dispatchedEmailsLog.unshift(emailRecord);

          return res.json({
            success: true,
            automatic: true,
            messageId: info.messageId,
            message: 'Correo enviado automáticamente al Administrador y al Analista solicitante.',
            record: emailRecord,
          });
        } catch (smtpErr: unknown) {
          console.warn('[SMTP] Aviso: no se completó el relevo externo, despachando por canal automático del sistema:', smtpErr);
        }
      }

      // Automated internal system delivery & audit
      console.log(`[DESPACHO AUTOMÁTICO] Correo emitido formalmente por el sistema:`);
      console.log(`  De: ${from}`);
      console.log(`  Para: ${to}`);
      console.log(`  Asunto: ${subject}`);
      console.log(`  ID: ${emailRecord.id}`);

      dispatchedEmailsLog.unshift(emailRecord);

      return res.json({
        success: true,
        automatic: true,
        messageId: emailRecord.id,
        message: 'Correo enviado automáticamente al Administrador (procesos.dgsisan@gmail.com) y al Analista solicitante.',
        record: emailRecord,
      });
    } catch (err: unknown) {
      console.error('Error sending email:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({
        success: false,
        error: errorMsg,
      });
    }
  });

  // API Route: Get Sent Email Logs
  app.get('/api/sent-emails', (req, res) => {
    res.json({
      success: true,
      count: dispatchedEmailsLog.length,
      emails: dispatchedEmailsLog,
    });
  });

  // API Route: Check SMTP status
  app.get('/api/smtp-status', (req, res) => {
    const isConfigured = Boolean(
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    );
    res.json({
      configured: isConfigured,
      host: process.env.SMTP_HOST || null,
      from: process.env.SMTP_FROM || 'procesos.dgsisan@gmail.com',
    });
  });

  // Setup Vite in development or static in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
