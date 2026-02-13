/**
 * Suggest Integration Tests Script
 * Identifies components and flows that need integration testing
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { AgentExecutionContext } from '../lib/types.js';

interface IntegrationTestSuggestion {
  area: string;
  components: string[];
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

interface ScriptResult {
  output: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
}

export default async function execute(
  context: AgentExecutionContext
): Promise<ScriptResult> {
  console.log(`[${context.agent_name}] Analyzing integration test needs...`);

  const suggestions: IntegrationTestSuggestion[] = [];

  // 1. Authentication flow
  suggestions.push({
    area: 'Authentication Flow',
    components: ['LoginScreen', 'SignupScreen', 'AuthProvider'],
    reason: 'Critical user flow requiring end-to-end testing',
    priority: 'high',
  });

  // 2. Beer tracking flow
  suggestions.push({
    area: 'Beer Tracking',
    components: ['AddBeerScreen', 'BeerList', 'BeerDetails', 'useBeers'],
    reason: 'Core app functionality with database interactions',
    priority: 'high',
  });

  // 3. Social features
  suggestions.push({
    area: 'Social Features',
    components: ['CommentsList', 'WallOfFame', 'EventsList'],
    reason: 'Complex multi-user interactions',
    priority: 'medium',
  });

  // 4. Offline sync
  suggestions.push({
    area: 'Offline Sync',
    components: ['useOfflineMutations', 'cacheManager', 'syncHandler'],
    reason: 'Critical for offline-first functionality',
    priority: 'high',
  });

  // 5. Push notifications
  suggestions.push({
    area: 'Push Notifications',
    components: ['notificationProcessor', 'usePushNotifications'],
    reason: 'Complex async flow with external services',
    priority: 'medium',
  });

  // 6. Scanning flow
  suggestions.push({
    area: 'QR Code Scanning',
    components: ['ScanScreen', 'useScanHandler', 'scanPayload'],
    reason: 'Multi-step user flow with error handling',
    priority: 'medium',
  });

  const report = generateIntegrationTestReport(suggestions);

  return {
    output: report,
    metrics: {
      total_suggestions: suggestions.length,
      high_priority: suggestions.filter(s => s.priority === 'high').length,
      medium_priority: suggestions.filter(s => s.priority === 'medium').length,
      low_priority: suggestions.filter(s => s.priority === 'low').length,
    },
  };
}

function generateIntegrationTestReport(suggestions: IntegrationTestSuggestion[]): string {
  const lines = [
    '',
    '╔═══════════════════════════════════════════════════════╗',
    '║      INTEGRATION TEST SUGGESTIONS                     ║',
    '╚═══════════════════════════════════════════════════════╝',
    '',
    '📊 SUMMARY',
    '─────────────────────────────────────────────────────────',
    `  Total Areas:       ${suggestions.length}`,
    `  🔴 High Priority:  ${suggestions.filter(s => s.priority === 'high').length}`,
    `  🟡 Medium Priority: ${suggestions.filter(s => s.priority === 'medium').length}`,
    `  🟢 Low Priority:    ${suggestions.filter(s => s.priority === 'low').length}`,
    '',
    '📋 SUGGESTED INTEGRATION TEST SUITES',
    '─────────────────────────────────────────────────────────',
  ];

  // Sort by priority
  const sorted = suggestions.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  for (const suggestion of sorted) {
    const icon = suggestion.priority === 'high' ? '🔴' : suggestion.priority === 'medium' ? '🟡' : '🟢';
    lines.push(`  ${icon} ${suggestion.area}`);
    lines.push(`     Components: ${suggestion.components.join(', ')}`);
    lines.push(`     ${suggestion.reason}`);
    lines.push('');
  }

  lines.push('📝 INTEGRATION TEST TEMPLATE');
  lines.push('─────────────────────────────────────────────────────────');
  lines.push('```typescript');
  lines.push("describe('Beer Tracking Flow (Integration)', () => {");
  lines.push("  it('should allow user to add and view beer', async () => {");
  lines.push('    // 1. Render the app');
  lines.push('    const { getByText, getByPlaceholderText } = render(<App />);');
  lines.push('');
  lines.push('    // 2. Navigate to add beer');
  lines.push("    fireEvent.press(getByText('Add Beer'));");
  lines.push('');
  lines.push('    // 3. Fill in beer details');
  lines.push("    fireEvent.changeText(getByPlaceholderText('Beer Name'), 'IPA');");
  lines.push('');
  lines.push('    // 4. Submit');
  lines.push("    fireEvent.press(getByText('Save'));");
  lines.push('');
  lines.push('    // 5. Verify beer appears in list');
  lines.push("    await waitFor(() => expect(getByText('IPA')).toBeTruthy());");
  lines.push('  });');
  lines.push('});');
  lines.push('```');
  lines.push('');
  lines.push('📚 RESOURCES');
  lines.push('─────────────────────────────────────────────────────────');
  lines.push('  • React Native Testing Library: integration patterns');
  lines.push('  • Jest: beforeEach/afterEach for test setup');
  lines.push('  • Mock Supabase client for database operations');
  lines.push('  • Test navigation flows with @react-navigation/testing');
  lines.push('─────────────────────────────────────────────────────────');
  lines.push('');

  return lines.join('\n');
}
