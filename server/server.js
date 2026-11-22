// Owner: M1
import './src/config/loadEnv.js';
import mongoose from 'mongoose';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import Store from './src/models/Store.js';
import Order from './src/models/Order.js';
import Idempotency from './src/models/Idempotency.js';
import RefreshToken from './src/models/RefreshToken.js';
import { recoverStaleReservations, recoverStaleCancellations } from './src/services/recoveryService.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();

    await Order.collection.updateMany(
      { $or: [{ trackingTokenHash: { $exists: true } }, { trackingTokenEncrypted: { $exists: true } }] },
      { $unset: { trackingTokenHash: '', trackingTokenEncrypted: '' } }
    );
    await Idempotency.collection.updateMany(
      { 'response.trackingToken': { $exists: true } },
      { $unset: { 'response.trackingToken': '' } }
    );
    await RefreshToken.createIndexes();

    // Reconcile and fix legacy indexes safely
    let indexes = [];
    try {
      indexes = await Store.collection.indexes();
    } catch (err) {
      if (err.code !== 26 && err.codeName !== 'NamespaceNotFound') throw err;
    }
    const uniqueOwnerIndex = indexes.find(
      (index) => index.unique && index.key?.owner === 1 && Object.keys(index.key).length === 1
    );
    if (uniqueOwnerIndex) await Store.collection.dropIndex(uniqueOwnerIndex.name);
    await Store.createIndexes();

    // Run inventory reservation & cancellation recovery on startup
    try {
      const recoveryResult = await recoverStaleReservations(0);
      const cancelRecoveryResult = await recoverStaleCancellations(0);
      if (recoveryResult.recovered > 0 || cancelRecoveryResult.recovered > 0) {
        console.log(`[StartupRecovery] Recovered ${recoveryResult.recovered} stale reservations, ${cancelRecoveryResult.recovered} stale cancellations`);
      }
    } catch (recErr) {
      console.warn('[StartupRecovery] Initial recovery check failed:', recErr.message);
    }

    const server = app.listen(PORT, () => {
      console.log('-'.repeat(50));
      console.log(`Server running at PORT : ${PORT} and Database connection Successful`);
      console.log('-'.repeat(50));
    });

    // Run background reservation & cancellation recovery every 5 minutes
    const recoveryTimer = setInterval(async () => {
      try {
        await recoverStaleReservations();
        await recoverStaleCancellations();
      } catch (err) {
        console.error('[PeriodicRecovery] Error during recovery:', err.message);
      }
    }, 5 * 60 * 1000);
    if (recoveryTimer.unref) recoveryTimer.unref();

    // Graceful Shutdown
    let isShuttingDown = false;
    const gracefulShutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(`\n[Shutdown] Received ${signal}. Closing server gracefully...`);

      clearInterval(recoveryTimer);

      const forceExitTimeout = setTimeout(() => {
        console.error('[Shutdown] Forceful shutdown after 10s timeout.');
        process.exit(1);
      }, 10000);
      if (forceExitTimeout.unref) forceExitTimeout.unref();

      server.close(async () => {
        console.log('[Shutdown] HTTP server closed. Closing MongoDB connection...');
        try {
          await mongoose.connection.close(false);
          console.log('[Shutdown] MongoDB connection closed cleanly. Goodbye!');
          process.exit(0);
        } catch (dbCloseErr) {
          console.error('[Shutdown] Error while closing MongoDB connection:', dbCloseErr.message);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (err) {
    console.error('Fatal initialization error:', err.message);
    process.exit(1);
  }
}

bootstrap();
