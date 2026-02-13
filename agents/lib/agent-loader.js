/**
 * Agent Manifest Loader
 * Loads and validates agent configurations from YAML files
 */
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ajv = new Ajv({ allErrors: true, strictSchema: false });
addFormats(ajv);
const agentSchema = require('./agent-schema.json');
const validateManifest = ajv.compile(agentSchema);
export class AgentLoader {
    configDir;
    manifests = new Map();
    constructor(options = {}) {
        this.configDir = options.config_dir || path.join(process.cwd(), 'agents', 'config');
    }
    /**
     * Load all agent manifests from config directory
     */
    async loadAll() {
        const files = fs.readdirSync(this.configDir)
            .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
        const manifests = [];
        for (const file of files) {
            try {
                const manifest = await this.loadManifest(path.join(this.configDir, file));
                manifests.push(manifest);
                this.manifests.set(manifest.name, manifest);
            }
            catch (error) {
                console.error(`Failed to load agent manifest: ${file}`, error);
            }
        }
        return manifests;
    }
    /**
     * Load a single agent manifest from file
     */
    async loadManifest(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = yaml.load(content);
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
    getAgent(name) {
        return this.manifests.get(name);
    }
    /**
     * Get all enabled agents
     */
    getEnabledAgents() {
        return Array.from(this.manifests.values()).filter(m => m.enabled !== false);
    }
    /**
     * Get agents that can be triggered by a specific event
     */
    getAgentsByTrigger(event) {
        return this.getEnabledAgents().filter(agent => agent.triggers.some(trigger => trigger.event === event && trigger.enabled !== false));
    }
    /**
     * Validate a manifest without loading
     */
    static validateManifest(data) {
        const valid = validateManifest(data);
        return {
            valid,
            errors: valid ? undefined : validateManifest.errors,
        };
    }
}
