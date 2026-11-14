// Explicitly invoked SMTP diagnostic. Does not log credentials or create accounts.
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
dotenv.config({ path: '.env.develop', quiet: true });
async function run() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: process.env.SMTP_SECURE !== 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000,
    logger: false, debug: false,
  });
  let stage = 'SMTP connection and authentication';
  try {
    await transporter.verify();
    console.log('SMTP_VERIFY_OK');
    stage = 'test mail submission';
    const sent = await transporter.sendMail({
      from: { name: process.env.FROM_NAME || 'Nihonix', address: process.env.FROM_EMAIL || process.env.SMTP_USER },
      to: 'helloanhne@gmail.com',
      subject: 'Nihonix - SMTP connection test',
      text: 'This is the SMTP delivery test you requested for Nihonix. This message confirms that the backend can submit mail using the configured SMTP account. It contains no verification code and requires no action.',
    });
    console.log(JSON.stringify({ stage, accepted: sent.accepted, rejected: sent.rejected, messageId: sent.messageId, response: sent.response }));
  } catch (error) {
    console.error(JSON.stringify({ stage, code: error.code, responseCode: error.responseCode, command: error.command,
      response: String(error.response || error.message || '').replaceAll(process.env.SMTP_PASS || 'NO_SECRET', '[REDACTED]').slice(0, 600) }));
    process.exitCode = 1;
  } finally { transporter.close(); }
}
run();
