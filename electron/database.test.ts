import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import Database from 'better-sqlite3';
import { migrateLegacyInstall } from './database';

// better-sqlite3's compiled binary in this repo targets Electron's Node ABI, which plain
// vitest can't load - mock both fs and the driver so this test doesn't need the real native
// module at all, and exercises just the migration branching logic.
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    rmSync: vi.fn()
  }
}));

vi.mock('better-sqlite3', () => ({
  default: vi.fn()
}));

const mockedFs = vi.mocked(fs, true);
const MockedDatabase = vi.mocked(Database, true);

describe('migrateLegacyInstall', () => {
  const legacyPath = 'C:\\Users\\test\\AppData\\Roaming\\FormVault\\formvault.sqlite3';
  const newPath = 'C:\\Users\\test\\AppData\\Roaming\\Retrivo\\retrivo.sqlite3';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when there is no legacy database', () => {
    mockedFs.existsSync.mockReturnValue(false);

    migrateLegacyInstall(legacyPath, newPath);

    expect(mockedFs.copyFileSync).not.toHaveBeenCalled();
  });

  it('copies the legacy database when no new database exists yet', () => {
    mockedFs.existsSync.mockImplementation((p) => p === legacyPath);

    migrateLegacyInstall(legacyPath, newPath);

    expect(mockedFs.copyFileSync).toHaveBeenCalledWith(legacyPath, newPath);
  });

  it('overwrites an empty auto-seeded database at the new path with the real legacy data', () => {
    mockedFs.existsSync.mockImplementation((p) => p === legacyPath || p === newPath);
    MockedDatabase.mockImplementation(function () {
      return {
        prepare: () => ({ get: () => ({ count: 0 }) }),
        close: vi.fn()
      } as unknown as Database.Database;
    });

    migrateLegacyInstall(legacyPath, newPath);

    expect(mockedFs.copyFileSync).toHaveBeenCalledWith(legacyPath, newPath);
  });

  it('leaves an already-populated new database alone', () => {
    mockedFs.existsSync.mockImplementation((p) => p === legacyPath || p === newPath);
    MockedDatabase.mockImplementation(function () {
      return {
        prepare: () => ({ get: () => ({ count: 2 }) }),
        close: vi.fn()
      } as unknown as Database.Database;
    });

    migrateLegacyInstall(legacyPath, newPath);

    expect(mockedFs.copyFileSync).not.toHaveBeenCalled();
  });

  it('leaves the new database alone if it cannot be safely inspected', () => {
    mockedFs.existsSync.mockImplementation((p) => p === legacyPath || p === newPath);
    MockedDatabase.mockImplementation(() => {
      throw new Error('file is not a database');
    });

    migrateLegacyInstall(legacyPath, newPath);

    expect(mockedFs.copyFileSync).not.toHaveBeenCalled();
  });
});
