// Owner: M1
import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import Store from './src/models/Store.js';

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // Older installations enforced one store per owner with a unique MongoDB index.
  // Drop only that unique owner index, then recreate the non-unique schema indexes.
  let indexes = [];
  try {
    indexes = await Store.collection.indexes();
  } catch (err) {
    if (err.code !== 26 && err.codeName !== 'NamespaceNotFound') throw err;
  }
  const uniqueOwnerIndex = indexes.find((index) => index.unique && index.key?.owner === 1 && Object.keys(index.key).length === 1);
  if (uniqueOwnerIndex) await Store.collection.dropIndex(uniqueOwnerIndex.name);
  await Store.createIndexes();
  app.listen(PORT, () => {
    console.log('-'.repeat(50));
    console.log(`Server running at PORT : ${PORT} and Database connection Successfull`);
    console.log('-'.repeat(50));
  });
});
