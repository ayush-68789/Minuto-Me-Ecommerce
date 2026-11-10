// Owner: Member 1 — Express server bootstrap and future infrastructure startup.
import 'dotenv/config';
import app from './src/app.js';
import userModel, { ROLES } from './src/models/User.js';

// Admins cannot self-register; the first one comes from the environment.
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  await userModel.create({ name: 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: ROLES.ADMIN });
  console.log(`Admin account ready: ${ADMIN_EMAIL}`);
} else {
  console.warn('ADMIN_EMAIL/ADMIN_PASSWORD not set; no admin account exists.');
}

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`Minuto Me API listening on port ${port}`);
});
