/**
 * Rollback Utility
 * Handles file backups and restoration for safe autonomous actions
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger.js';

export interface BackupInfo {
  backup_id: string;
  timestamp: Date;
  files: Map<string, string>; // original path -> backup path
}

export class RollbackManager {
  private backupDir: string;

  constructor(backupDir: string = path.join(process.cwd(), 'agents', '.backups')) {
    this.backupDir = backupDir;
    this.ensureBackupDir();
  }

  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create a backup of files before modification
   */
  async createBackup(files: string[], agentName: string, actionName: string): Promise<BackupInfo> {
    const backup_id = `${agentName}-${actionName}-${Date.now()}`;
    const backupPath = path.join(this.backupDir, backup_id);
    
    fs.mkdirSync(backupPath, { recursive: true });

    const backupMap = new Map<string, string>();

    for (const file of files) {
      if (!fs.existsSync(file)) {
        logger.warn(`File not found for backup: ${file}`, undefined, agentName, actionName);
        continue;
      }

      // Create relative path structure in backup
      const relativePath = path.relative(process.cwd(), file);
      const backupFilePath = path.join(backupPath, relativePath);
      const backupFileDir = path.dirname(backupFilePath);

      // Ensure directory exists
      if (!fs.existsSync(backupFileDir)) {
        fs.mkdirSync(backupFileDir, { recursive: true });
      }

      // Copy file to backup
      fs.copyFileSync(file, backupFilePath);
      backupMap.set(file, backupFilePath);
      
      logger.debug(`Backed up: ${file} -> ${backupFilePath}`, undefined, agentName, actionName);
    }

    const info: BackupInfo = {
      backup_id,
      timestamp: new Date(),
      files: backupMap,
    };

    // Save backup metadata
    const metadataPath = path.join(backupPath, 'backup-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify({
      backup_id,
      timestamp: info.timestamp.toISOString(),
      agent: agentName,
      action: actionName,
      files: Array.from(backupMap.entries()).map(([original, backup]) => ({
        original,
        backup,
      })),
    }, null, 2));

    logger.info(`Created backup: ${backup_id}`, { files_count: backupMap.size }, agentName, actionName);

    return info;
  }

  /**
   * Restore files from a backup
   */
  async restoreBackup(backupInfo: BackupInfo, agentName: string, actionName: string): Promise<void> {
    logger.info(`Restoring backup: ${backupInfo.backup_id}`, undefined, agentName, actionName);

    let restoredCount = 0;
    let failedCount = 0;

    for (const [originalPath, backupPath] of backupInfo.files.entries()) {
      try {
        if (!fs.existsSync(backupPath)) {
          logger.warn(`Backup file not found: ${backupPath}`, undefined, agentName, actionName);
          failedCount++;
          continue;
        }

        // Restore the file
        fs.copyFileSync(backupPath, originalPath);
        restoredCount++;
        
        logger.debug(`Restored: ${backupPath} -> ${originalPath}`, undefined, agentName, actionName);
      } catch (error) {
        logger.error(`Failed to restore ${originalPath}`, { error: (error as Error).message }, agentName, actionName);
        failedCount++;
      }
    }

    logger.info(`Backup restored`, { 
      restored: restoredCount, 
      failed: failedCount,
    }, agentName, actionName);
  }

  /**
   * Delete a backup after successful operation
   */
  async deleteBackup(backupInfo: BackupInfo): Promise<void> {
    const backupPath = path.join(this.backupDir, backupInfo.backup_id);
    
    if (fs.existsSync(backupPath)) {
      fs.rmSync(backupPath, { recursive: true, force: true });
      logger.debug(`Deleted backup: ${backupInfo.backup_id}`);
    }
  }

  /**
   * Get files that would be affected by a glob pattern
   */
  async getAffectedFiles(pattern: string): Promise<string[]> {
    const { glob } = await import('glob');
    return await glob(pattern, { 
      cwd: process.cwd(),
      absolute: true,
      ignore: ['node_modules/**', 'agents/.backups/**'],
    });
  }

  /**
   * Clean up old backups (older than 7 days)
   */
  async cleanOldBackups(daysToKeep: number = 7): Promise<void> {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    if (!fs.existsSync(this.backupDir)) return;

    const entries = fs.readdirSync(this.backupDir);
    let deletedCount = 0;

    for (const entry of entries) {
      const entryPath = path.join(this.backupDir, entry);
      const stats = fs.statSync(entryPath);

      if (stats.isDirectory() && stats.mtimeMs < cutoffTime) {
        fs.rmSync(entryPath, { recursive: true, force: true });
        deletedCount++;
        logger.debug(`Cleaned old backup: ${entry}`);
      }
    }

    if (deletedCount > 0) {
      logger.info(`Cleaned ${deletedCount} old backups`);
    }
  }
}

// Global rollback manager instance
export const rollbackManager = new RollbackManager();
