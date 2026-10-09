/**
 * db_connection.test.js
 *
 * Focused tests for the MongoDB connection module (server/src/config/db.js).
 *
 * These tests do NOT import setup.js because they need full control over the
 * MONGODB_URI environment variable and the connectDB/disconnectDB lifecycle.
 *
 * Module isolation is achieved via vi.resetModules() + a static import()
 * path — Vitest clears the module registry on resetModules() so each call
 * to freshDb() gets a truly fresh instance with its own module-level state.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import dns from 'node:dns';

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Clear Vitest's module registry and re-import db.js so each test gets a
 * fresh module instance (mongoMemoryServer = null, etc.).
 *
 * Uses a STATIC import() path — Vite requires the specifier to be a plain
 * string literal at build time. vi.resetModules() makes the import fresh.
 */
const freshDb = async () => {
  vi.resetModules();
  return import('../src/config/db.js');
};

// ─── env / DNS state ──────────────────────────────────────────────────────────

let savedUri;
let savedNodeEnv;
let savedDnsServers;

beforeEach(() => {
  savedUri = process.env.MONGODB_URI;
  savedNodeEnv = process.env.NODE_ENV;
  savedDnsServers = dns.getServers();
  // Start every test with a clean slate
  delete process.env.MONGODB_URI;
  process.env.NODE_ENV = 'test';
});

afterEach(async () => {
  // Restore env
  if (savedUri !== undefined) {
    process.env.MONGODB_URI = savedUri;
  } else {
    delete process.env.MONGODB_URI;
  }
  process.env.NODE_ENV = savedNodeEnv;

  // Restore DNS servers
  try {
    dns.setServers(savedDnsServers);
  } catch (_) {
    // ignore if servers list was empty / invalid
  }

  // Disconnect mongoose if a test left it connected
  vi.resetModules();
  try {
    const mongoose = (await import('mongoose')).default;
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (_) {
    // ignore
  }
});

// ─── DNS patch tests ──────────────────────────────────────────────────────────

describe('patchDnsIfNeeded (DNS resolver patching)', () => {
  it('patches DNS servers when a mongodb+srv URI is used and no public DNS is present', async () => {
    // Force a non-public DNS so the patch logic triggers
    dns.setServers(['127.0.0.1']);

    process.env.MONGODB_URI =
      'mongodb+srv://fakeuser:fakepass@fake-cluster.example.mongodb.net/testdb';

    const { connectDB, disconnectDB } = await freshDb();

    // Connection will fail (fake URI) — we only care about the DNS side-effect
    try {
      await connectDB();
    } catch (_) {
      // expected — fake host
    } finally {
      await disconnectDB();
    }

    const servers = dns.getServers();
    expect(servers).toContain('8.8.8.8');
  });

  it('does NOT patch DNS servers for a plain mongodb:// URI', async () => {
    dns.setServers(['127.0.0.1']);

    // No MONGODB_URI → connectDB uses the default plain mongodb:// URI
    delete process.env.MONGODB_URI;

    const { connectDB, disconnectDB } = await freshDb();

    try {
      // Will fail (no local Mongo) but DNS must remain untouched
      await connectDB();
    } catch (_) {
      // expected
    } finally {
      await disconnectDB();
    }

    const servers = dns.getServers();
    expect(servers).toContain('127.0.0.1');
    expect(servers).not.toContain('8.8.8.8');
  });

  it('does not patch DNS again when public DNS is already present', async () => {
    dns.setServers(['8.8.8.8', '1.1.1.1']);

    const setServersSpy = vi.spyOn(dns, 'setServers');

    process.env.MONGODB_URI =
      'mongodb+srv://fakeuser:fakepass@fake-cluster.example.mongodb.net/testdb';

    const { connectDB, disconnectDB } = await freshDb();

    try {
      await connectDB();
    } catch (_) {
      // expected
    } finally {
      await disconnectDB();
    }

    // setServers should NOT have been called because 8.8.8.8 was already present
    expect(setServersSpy).not.toHaveBeenCalled();
    setServersSpy.mockRestore();
  });
});

// ─── Explicit-URI guard tests ─────────────────────────────────────────────────

describe('connectDB — explicit MONGODB_URI guard', () => {
  it('throws and does not fall back to in-memory when MONGODB_URI is set and connection fails', async () => {
    // Use a plain mongodb:// URI pointing at a port nothing listens on,
    // with a tiny timeout so the test runs fast.
    process.env.MONGODB_URI =
      'mongodb://127.0.0.1:19998/nonexistent?serverSelectionTimeoutMS=500';
    process.env.NODE_ENV = 'development';

    const { connectDB, disconnectDB } = await freshDb();

    await expect(connectDB()).rejects.toThrow();

    await disconnectDB();
  });

  it('throws in production when MONGODB_URI is set and connection fails', async () => {
    process.env.MONGODB_URI =
      'mongodb://127.0.0.1:19998/nonexistent?serverSelectionTimeoutMS=500';
    process.env.NODE_ENV = 'production';

    const { connectDB, disconnectDB } = await freshDb();

    await expect(connectDB()).rejects.toThrow();

    await disconnectDB();
  });
});

// ─── In-memory fallback tests ─────────────────────────────────────────────────

describe('connectDB — in-memory fallback', () => {
  it(
    'falls back to MongoMemoryServer when no MONGODB_URI is set and local Mongo is unavailable',
    async () => {
      // No MONGODB_URI → default local URI → will fail → fallback activates
      delete process.env.MONGODB_URI;
      process.env.NODE_ENV = 'development';

      const { connectDB, disconnectDB } = await freshDb();

      // Re-import mongoose AFTER resetModules so we get the same instance db.js uses
      const mongoose = (await import('mongoose')).default;

      await expect(connectDB()).resolves.not.toThrow();
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected

      await disconnectDB();
    },
    60_000 // MongoMemoryServer binary download can take a moment in CI
  );
});
