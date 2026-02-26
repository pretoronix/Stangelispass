/**
 * Agent Manifest Loader
 * Loads and validates agent configurations from YAML files
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { AgentManifest, AgentLoaderOptions } from './types.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ajv = new Ajv({ allErrors: true, strictSchema: false });
addFormats(ajv);
const agentSchema = require('./agent-schema.json');
const validateManifest = ajv.compile(agentSchema);

export class AgentLoader {
  private configDir: string;
  private manifests: Map<string, AgentManifest> = new Map();

  constructor(options: AgentLoaderOptions = {}) {
    this.configDir = options.config_dir || path.join(process.cwd(), 'agents', 'config');
  }

  /**
   * Load all agent manifests from config directory
   */
  async loadAll(): Promise<AgentManifest[]> {
    const files = fs.readdirSync(this.configDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

    const manifests: AgentManifest[] = [];

    for (const file of files) {
      try {
        const manifest = await this.loadManifest(path.join(this.configDir, file));
        manifests.push(manifest);
        this.manifests.set(manifest.name, manifest);
      } catch (error) {
        console.error(`Failed to load agent manifest: ${file}`, error);
      }
    }

    return manifests;
  }

  /**
   * Load a single agent manifest from file
   */
  async loadManifest(filePath: string): Promise<AgentManifest> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = yaml.load(content) as AgentManifest;

    // Validate against schema
    const valid = validateManifest(data);
    if (!valid) {
      throw new Error(`Invalid agent manifest: ${JSON.stringify(validateManifest.errors, null, 2)}`);
    }

    // Set defaults
    if (data.enabled === undefined) {
      data.enabled = true;
    }

    return data;
  }

  /**
   * Get agent manifest by name
   */
  getAgent(name: string): AgentManifest | undefined {
    return this.manifests.get(name);
  }

  /**
   * Get all enabled agents
   */
  getEnabledAgents(): AgentManifest[] {
    return Array.from(this.manifests.values()).filter(m => m.enabled !== false);
  }

  /**
   * Get agents that can be triggered by a specific event
   */
  getAgentsByTrigger(event: string): AgentManifest[] {
    return this.getEnabledAgents().filter(agent => 
      agent.triggers.some(trigger => 
        trigger.event === event && trigger.enabled !== false
      )
    );
  }

  /**
   * Validate a manifest without loading
   */
  static validateManifest(data: any): { valid: boolean; errors?: any[] } {
    const valid = validateManifest(data);
    const errors = valid ? undefined : validateManifest.errors ?? undefined;
    return {
      valid,
      errors: errors as any[] | undefined,
    };
  }
}
