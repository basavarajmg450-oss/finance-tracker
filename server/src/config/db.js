import mongoose from 'mongoose';
import dns from 'node:dns';

let mongoMemoryServer = null;

/**
 * Returns true when the URI requires SRV DNS lookup (MongoDB Atlas / +srv scheme).
 */
const isSRVUri = (uri) => typeof uri === 'string' && uri.startsWith('mongodb+srv://');

/**
 * Patches the in-process DNS resolver to use public DNS servers so that Node.js
 * can resolve Atlas SRV records (_mongodb._tcp.<cluster>).
 *
 * IMPORTANT: dns.setServers() only affects the current Node.js process.
 * It does NOT change Windows system-wide DNS settings.
 *
 * Background: On some Windows machines the default resolver (127.0.0.1) cannot
 * forward SRV queries, causing ECONNREFUSED before mongoose.connect() even fires.
 * Calling this before mongoose.connect() ensures SRV resolution succeeds.
 */
const patchDnsIfNeeded = (uri) => {
  if (!isSRVUri(uri)) return;

  const currentServers = dns.getServers();
  const publicDns = ['8.8.8.8', '1.1.1.1', '8.8.4.4'];
  const hasPublicDns = currentServers.some((s) => publicDns.includes(s.replace(/\[|\]/g, '')));

  if (!hasPublicDns) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.log(
      '[MongoDB] SRV URI detected. Patched in-process DNS resolver to use ' +
        'public DNS (8.8.8.8, 1.1.1.1) for Atlas SRV resolution. ' +
        '(No Windows system DNS was changed.)'
    );
  }
};

export const connectDB = async () => {
  // Distinguish between "user explicitly set MONGODB_URI" vs the built-in default.
  const explicitUri = process.env.MONGODB_URI;
  const isExplicitUri = !!explicitUri;
  const uri = explicitUri || 'mongodb://127.0.0.1:27017/smart_expense_tracker';

  // Patch in-process DNS BEFORE mongoose.connect() so SRV resolution works.
  patchDnsIfNeeded(uri);

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      // Give Atlas a fair round-trip budget; 2500 ms was too tight.
      serverSelectionTimeoutMS: 5000,
    });
    console.log(
      `[MongoDB] Connected successfully to: ${mongoose.connection.host}/${mongoose.connection.name}`
    );
  } catch (error) {
    const uriLabel = isSRVUri(uri) ? 'Atlas (SRV)' : uri;
    console.error(`[MongoDB] Connection to ${uriLabel} failed: ${error.message}`);

    // ─── Guard: explicit MONGODB_URI must never silently degrade ────────────
    // When the operator has configured a real URI (Atlas or otherwise), a
    // connection failure is a deployment problem that must be surfaced loudly.
    // Falling back to an in-memory database would hide the real issue.
    if (isExplicitUri) {
      console.error(
        '[MongoDB] MONGODB_URI is explicitly set — refusing silent fallback ' +
          'to in-memory database. Fix the connection issue above and restart.'
      );
      throw error;
    }

    // ─── Fallback: no explicit URI → use MongoMemoryServer ──────────────────
    // Activated only when:
    //   • No MONGODB_URI env var was provided (pure local dev, no MongoDB installed), OR
    //   • USE_MEMORY_DB=true is set (automated tests that intentionally opt in).
    const useMemory =
      process.env.USE_MEMORY_DB === 'true' ||
      (process.env.NODE_ENV !== 'production' && !isExplicitUri);

    if (useMemory) {
      try {
        console.log(
          '[MongoDB] No explicit MONGODB_URI set. Starting MongoMemoryServer ' +
            'for isolated local execution...'
        );
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const memUri = mongoMemoryServer.getUri();
        await mongoose.connect(memUri);
        console.log(`[MongoDB] Connected to in-memory instance at: ${memUri}`);
      } catch (memErr) {
        console.error('[MongoDB] Failed to start in-memory Mongo server:', memErr.message);
        throw memErr;
      }
    } else {
      throw error;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
  } catch (err) {
    console.error('[MongoDB] Error disconnecting DB:', err.message);
  }
};
