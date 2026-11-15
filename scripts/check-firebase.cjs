/** Read-only credential/API readiness check. Never prints keys/tokens or sends a message. */
require('dotenv').config({ path: '.env.develop', quiet: true });
const { applicationDefault, initializeApp, deleteApp } = require('firebase-admin/app');
async function main() {
  const project = process.env.FIREBASE_PROJECT_ID;
  if (!project || !process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('FIREBASE_CONFIG_MISSING');
  const app = initializeApp({ credential: applicationDefault(), projectId: project }, 'readiness-check');
  try {
    const credential = app.options.credential;
    const access = await credential.getAccessToken();
    if (!access.access_token || access.expires_in <= 0) throw new Error('FIREBASE_TOKEN_UNAVAILABLE');
    const response = await fetch('https://serviceusage.googleapis.com/v1/projects/' + encodeURIComponent(project) + '/services/fcm.googleapis.com', {
      headers: { Authorization: 'Bearer ' + access.access_token }, signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      // Service Usage metadata needs a separate permission; probe FCM validation without any recipient/delivery.
      const { getMessaging } = require('firebase-admin/messaging');
      try {
        await getMessaging(app).send({ token: 'nihonix-readiness-invalid-token', data: { type: 'setup_check' } }, true);
      } catch (error) {
        const accepted = ['messaging/invalid-argument', 'messaging/invalid-recipient'].includes(error.code);
        console.log(JSON.stringify({ project, credentials: 'valid', fcmValidationApi: accepted ? 'reachable' : 'not_verified',
          code: error.code || 'UNKNOWN', notificationSent: false }));
        if (!accepted) process.exitCode = 1;
        return;
      }
      throw new Error('UNEXPECTED_FCM_PROBE_RESULT');
    }
    const service = await response.json();
    const enabled = service.state === 'ENABLED';
    console.log(JSON.stringify({ project, credentials: 'valid', fcmApi: enabled ? 'enabled' : 'disabled', notificationSent: false }));
    if (!enabled) process.exitCode = 1;
  } finally { await deleteApp(app); }
}
main().catch(() => {
  console.error(JSON.stringify({ result: 'failed', code: 'FIREBASE_READINESS_FAILED', notificationSent: false }));
  process.exitCode = 1;
});
