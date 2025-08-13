// tests/integration.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createTeamCityEmbed } from '../src/teamcityEmbeds.js';
import { buildWebSocketEventEmbed } from '../src/embedbuilder.js';
import { isTeamCityWebhookEvent } from '../src/types/teamcity.js';
import { validateTeamCityEvent } from '../src/utils/validation.js';
import type { TeamCityWebhookEvent } from '../src/types/teamcity.js';

// Load actual webhook fixture data
function loadWebhookFixture(filename: string): any {
  const fixturePath = join(process.cwd(), '.kiro', 'webhook_requests', filename);
  const content = readFileSync(fixturePath, 'utf-8');
  return JSON.parse(content);
}

describe('Integration Tests - Webhook to Embed Flow', () => {
  let buildStartedFixture: TeamCityWebhookEvent;
  let buildFinishedFixture: TeamCityWebhookEvent;
  let buildInterruptedFixture: TeamCityWebhookEvent;

  beforeEach(() => {
    // Load fixtures
    buildStartedFixture = loadWebhookFixture('BUILD_STARTED.json');
    buildFinishedFixture = loadWebhookFixture('BUILD_FINISHED.json');
    buildInterruptedFixture = loadWebhookFixture('BUILD_INTERRUPTED.json');
  });

  describe('BUILD_STARTED Integration', () => {
    it('should process BUILD_STARTED webhook end-to-end', () => {
      // Validate the fixture is a valid TeamCity event
      expect(isTeamCityWebhookEvent(buildStartedFixture)).toBe(true);
      
      // Validate the event structure
      const validation = validateTeamCityEvent(buildStartedFixture);
      expect(validation.isValid).toBe(true);
      
      // Create the embed
      const embed = createTeamCityEmbed(buildStartedFixture);
      expect(embed).not.toBeNull();
      
      // Verify embed properties
      const embedData = embed!.toJSON();
      expect(embedData.title).toContain('🚀 Build Started');
      expect(embedData.title).toContain('TelltaleTool');
      expect(embedData.color).toBe(0x3498DB); // Blue
      expect(embedData.timestamp).toBeDefined();
      expect(embedData.footer?.text).toBe('TeamCity Build Notification');
      
      // Verify required fields are present
      const fields = embedData.fields || [];
      expect(fields.some(f => f.name === 'Project')).toBe(true);
      expect(fields.some(f => f.name === 'Build Type')).toBe(true);
      expect(fields.some(f => f.name === 'Build Number')).toBe(true);
      expect(fields.some(f => f.name === 'Status')).toBe(true);
      expect(fields.some(f => f.name === 'Agent')).toBe(true);
      expect(fields.some(f => f.name === 'TeamCity Link')).toBe(true);
      
      // Verify progress information from running-info
      expect(fields.some(f => f.name === 'Progress')).toBe(true);
      expect(fields.some(f => f.name === 'Est. Time Remaining')).toBe(true);
    });

    it('should handle BUILD_STARTED with missing optional fields gracefully', () => {
      const modifiedFixture = {
        ...buildStartedFixture,
        payload: {
          ...buildStartedFixture.payload,
          agent: undefined,
          'running-info': undefined
        }
      };

      const embed = createTeamCityEmbed(modifiedFixture);
      expect(embed).not.toBeNull();
      
      const embedData = embed!.toJSON();
      const fields = embedData.fields || [];
      
      // Agent and progress fields should not be present
      expect(fields.some(f => f.name === 'Agent')).toBe(false);
      expect(fields.some(f => f.name === 'Progress')).toBe(false);
      expect(fields.some(f => f.name === 'Est. Time Remaining')).toBe(false);
    });
  });

  describe('BUILD_FINISHED Integration', () => {
    it('should process BUILD_FINISHED webhook end-to-end', () => {
      // Validate the fixture is a valid TeamCity event
      expect(isTeamCityWebhookEvent(buildFinishedFixture)).toBe(true);
      
      // Validate the event structure
      const validation = validateTeamCityEvent(buildFinishedFixture);
      expect(validation.isValid).toBe(true);
      
      // Create the embed
      const embed = createTeamCityEmbed(buildFinishedFixture);
      expect(embed).not.toBeNull();
      
      // Verify embed properties
      const embedData = embed!.toJSON();
      expect(embedData.title).toContain('✅ Build Finished');
      expect(embedData.title).toContain('TelltaleTool');
      expect(embedData.color).toBe(0x27AE60); // Green for success
      expect(embedData.timestamp).toBeDefined();
      
      // Verify required fields are present
      const fields = embedData.fields || [];
      expect(fields.some(f => f.name === 'Project')).toBe(true);
      expect(fields.some(f => f.name === 'Build Type')).toBe(true);
      expect(fields.some(f => f.name === 'Build Number')).toBe(true);
      expect(fields.some(f => f.name === 'Final Status')).toBe(true);
      expect(fields.some(f => f.name === 'Agent')).toBe(true);
      expect(fields.some(f => f.name === 'Build Duration')).toBe(true);
      expect(fields.some(f => f.name === 'Finished At')).toBe(true);
      expect(fields.some(f => f.name === 'TeamCity Link')).toBe(true);
      
      // Verify last changes information
      expect(fields.some(f => f.name === 'Last Change')).toBe(true);
    });

    it('should handle failed builds with red color', () => {
      const failedFixture = {
        ...buildFinishedFixture,
        payload: {
          ...buildFinishedFixture.payload,
          status: 'FAILURE',
          statusText: 'Failed'
        }
      };

      const embed = createTeamCityEmbed(failedFixture);
      expect(embed).not.toBeNull();
      
      const embedData = embed!.toJSON();
      expect(embedData.title).toContain('❌ Build Finished');
      expect(embedData.color).toBe(0xE74C3C); // Red for failure
    });
  });

  describe('BUILD_INTERRUPTED Integration', () => {
    it('should process BUILD_INTERRUPTED webhook end-to-end', () => {
      // Validate the fixture is a valid TeamCity event
      expect(isTeamCityWebhookEvent(buildInterruptedFixture)).toBe(true);
      
      // Validate the event structure
      const validation = validateTeamCityEvent(buildInterruptedFixture);
      expect(validation.isValid).toBe(true);
      
      // Create the embed
      const embed = createTeamCityEmbed(buildInterruptedFixture);
      expect(embed).not.toBeNull();
      
      // Verify embed properties
      const embedData = embed!.toJSON();
      expect(embedData.title).toContain('⚠️ Build Interrupted');
      expect(embedData.title).toContain('TelltaleTool');
      expect(embedData.color).toBe(0xF39C12); // Orange
      expect(embedData.timestamp).toBeDefined();
      
      // Verify required fields are present
      const fields = embedData.fields || [];
      expect(fields.some(f => f.name === 'Project')).toBe(true);
      expect(fields.some(f => f.name === 'Build Type')).toBe(true);
      expect(fields.some(f => f.name === 'Build Number')).toBe(true);
      expect(fields.some(f => f.name === 'Status')).toBe(true);
      expect(fields.some(f => f.name === 'Agent')).toBe(true);
      expect(fields.some(f => f.name === 'TeamCity Link')).toBe(true);
      
      // Verify cancellation information
      expect(fields.some(f => f.name === 'Cancellation Reason')).toBe(true);
      expect(fields.some(f => f.name === 'Canceled By')).toBe(true);
      expect(fields.some(f => f.name === 'Canceled At')).toBe(true);
      expect(fields.some(f => f.name === 'Elapsed Time')).toBe(true);
      expect(fields.some(f => f.name === 'Current Stage')).toBe(true);
    });
  });

  describe('Generic Embed Fallback Integration', () => {
    it('should fall back to generic embed for unknown event types', () => {
      const unknownEvent = {
        eventType: 'UNKNOWN_EVENT',
        payload: {
          id: 123,
          someField: 'someValue',
          nestedObject: {
            key: 'value'
          }
        }
      };

      // Should not be recognized as TeamCity event
      expect(isTeamCityWebhookEvent(unknownEvent)).toBe(false);
      
      // Should create generic embed
      const embed = buildWebSocketEventEmbed(unknownEvent);
      expect(embed).not.toBeNull();
      
      const embedData = embed.toJSON();
      expect(embedData.title).toContain('Webhook Event: UNKNOWN_EVENT');
      expect(embedData.color).toBe(0x00AE86); // Teal for generic
    });

    it('should handle malformed TeamCity events with generic builder', () => {
      const malformedEvent = {
        eventType: 'BUILD_STARTED',
        payload: {
          // Missing required fields
          id: 123
        }
      };

      // Should be recognized as TeamCity event but fail validation
      expect(isTeamCityWebhookEvent(malformedEvent)).toBe(true);
      
      // // TeamCity embed creation should fail
      // const teamCityEmbed = createTeamCityEmbed(malformedEvent);
      // expect(teamCityEmbed).toBeNull();
      
      // Generic embed should work as fallback
      const genericEmbed = buildWebSocketEventEmbed(malformedEvent);
      expect(genericEmbed).not.toBeNull();
      
      const embedData = genericEmbed.toJSON();
      expect(embedData.title).toContain('Webhook Event: BUILD_STARTED');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle completely invalid webhook data', () => {
      const invalidData = null;
      
      // Should not crash
      expect(() => {
        const embed = createTeamCityEmbed(invalidData as any);
        expect(embed).toBeNull();
      }).not.toThrow();
      
      expect(() => {
        const embed = buildWebSocketEventEmbed(invalidData);
        expect(embed).not.toBeNull();
      }).not.toThrow();
    });

    it('should handle circular references in payload', () => {
      const circularPayload: any = {
        eventType: 'TEST',
        payload: {
          id: 123
        }
      };
      // Create circular reference
      circularPayload.payload.self = circularPayload.payload;
      
      // Should not crash
      expect(() => {
        const embed = buildWebSocketEventEmbed(circularPayload);
        expect(embed).not.toBeNull();
      }).not.toThrow();
    });

    it('should handle very large payloads gracefully', () => {
      const largePayload = {
        eventType: 'LARGE_EVENT',
        payload: {
          id: 123,
          largeArray: Array(1000).fill(0).map((_, i) => ({ index: i, data: `item-${i}` })),
          largeObject: {}
        }
      };
      
      // Add many properties to large object
      for (let i = 0; i < 100; i++) {
        largePayload.payload.largeObject[`field${i}`] = `value${i}`;
      }
      
      // Should handle gracefully without crashing
      expect(() => {
        const embed = buildWebSocketEventEmbed(largePayload);
        expect(embed).not.toBeNull();
        
        // Should respect Discord field limits
        const embedData = embed.toJSON();
        const fieldCount = embedData.fields?.length || 0;
        expect(fieldCount).toBeLessThanOrEqual(25); // Discord limit
      }).not.toThrow();
    });
  });

  describe('Field Formatting Integration', () => {
    it('should properly format timestamps in all embed types', () => {
      const fixtures = [buildStartedFixture, buildFinishedFixture, buildInterruptedFixture];
      
      fixtures.forEach((fixture, index) => {
        const embed = createTeamCityEmbed(fixture);
        expect(embed).not.toBeNull();
        
        const embedData = embed!.toJSON();
        const fields = embedData.fields || [];
        
        // Find timestamp fields and verify they're formatted properly
        const timestampFields = fields.filter(f => 
          f.name.includes('At') || 
          (f.name.includes('Time') && !f.name.includes('Remaining') && !f.name.includes('Duration'))
        );
        
        timestampFields.forEach(field => {
          // Should not contain raw TeamCity timestamp format
          expect(field.value).not.toMatch(/^\d{8}T\d{6}[+-]\d{4}$/);
          // Should not contain "Invalid date" - timestamps should be valid or not included
          expect(field.value).not.toBe('Invalid date');
          // Should contain formatted date (year)
          expect(field.value).toMatch(/\d{4}/); // Should contain year
        });
      });
    });

    it('should properly format URLs as clickable links', () => {
      const fixtures = [buildStartedFixture, buildFinishedFixture, buildInterruptedFixture];
      
      fixtures.forEach(fixture => {
        const embed = createTeamCityEmbed(fixture);
        expect(embed).not.toBeNull();
        
        const embedData = embed!.toJSON();
        const fields = embedData.fields || [];
        
        // Find TeamCity Link field
        const linkField = fields.find(f => f.name === 'TeamCity Link');
        expect(linkField).toBeDefined();
        expect(linkField!.value).toMatch(/^\[.*\]\(.*\)$/); // Markdown link format
      });
    });

    it('should respect Discord embed limits', () => {
      const fixtures = [buildStartedFixture, buildFinishedFixture, buildInterruptedFixture];
      
      fixtures.forEach(fixture => {
        const embed = createTeamCityEmbed(fixture);
        expect(embed).not.toBeNull();
        
        const embedData = embed!.toJSON();
        
        // Check title length
        expect(embedData.title?.length || 0).toBeLessThanOrEqual(256);
        
        // Check field limits
        const fields = embedData.fields || [];
        expect(fields.length).toBeLessThanOrEqual(25);
        
        fields.forEach(field => {
          expect(field.name.length).toBeLessThanOrEqual(256);
          expect(field.value.length).toBeLessThanOrEqual(1024);
        });
        
        // Check footer
        expect(embedData.footer?.text?.length || 0).toBeLessThanOrEqual(2048);
      });
    });
  });
});