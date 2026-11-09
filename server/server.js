// Owner: Member 1 — Express server bootstrap and future infrastructure startup.
import 'dotenv/config';
import app from './src/app.js';

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`Minuto Me API listening on port ${port}`);
});
