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

  // API Route: Send Email
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

      if (!host || !user || !pass) {
        return res.json({
          success: false,
          reason: 'smtp_not_configured',
          message:
            'Servidor SMTP no configurado. Utilice el despacho directo por Webmail GCBA, Outlook o Gmail.',
        });
      }

      // Create transporter
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
      console.log('Email sent successfully:', info.messageId);

      return res.json({
        success: true,
        messageId: info.messageId,
        message: 'Correo despachado exitosamente mediante servidor SMTP.',
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
