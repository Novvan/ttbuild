// tests/backward-compatibility.test.ts
import { describe, it, expect } from 'vitest';
import { buildWebSocketEventEmbed } from '../src/embedbuilder.js';
import { createTeamCityEmbed } from '../src/teamcityEmbeds.js';
import { isTeamCityWebhookEvent } from '../src/types/teamcity.js';

describe('Backward Compatibility Tests', () => {
    describe('Generic Embed Builder Compatibility', () => {
        it('should maintain original function signature', () => {
            // Original usage should still work
            const genericEvent = {
                eventType: 'GENERIC_EVENT',
                payload: {
                    field1: 'value1',
                    field2: 'value2'
                }
            };

            const embed = buildWebSocketEventEmbed(genericEvent);
            expect(embed).not.toBeNull();

            const embedData = embed.toJSON();
            expect(embedData.title).toContain('Webhook Event: GENERIC_EVENT');
            expect(embedData.color).toBe(0x00AE86); // Original teal color
            expect(embedData.footer?.text).toBe('Webhook Notification');
        });

        it('should handle non-TeamCity events exactly as before', () => {
            const nonTeamCityEvents = [
                {
                    eventType: 'DEPLOYMENT_STARTED',
                    payload: { service: 'api', version: '1.2.3' }
                },
                {
                    eventType: 'ALERT_TRIGGERED',
                    payload: { severity: 'high', message: 'CPU usage critical' }
                },
                {
                    eventType: 'USER_ACTION',
                    payload: { user: 'admin', action: 'login' }
                }
            ];

            nonTeamCityEvents.forEach(event => {
                // Should not be detected as TeamCity events
                expect(isTeamCityWebhookEvent(event)).toBe(false);

                // Should create generic embeds
                const embed = buildWebSocketEventEmbed(event);
                expect(embed).not.toBeNull();

                const embedData = embed.toJSON();
                expect(embedData.title).toContain(`Webhook Event: ${event.eventType}`);
                expect(embedData.color).toBe(0x00AE86);
                expect(embedData.footer?.text).toBe('Webhook Notification');
            });
        });

        it('should handle legacy payload structures', () => {
            // Test with old-style flat payload
            const legacyEvent = {
                eventType: 'LEGACY_EVENT',
                payload: {
                    id: 123,
                    name: 'test',
                    status: 'active',
                    timestamp: '2025-01-01T00:00:00Z',
                    url: 'https://example.com'
                }
            };

            const embed = buildWebSocketEventEmbed(legacyEvent);
            expect(embed).not.toBeNull();

            const embedData = embed.toJSON();
            const fields = embedData.fields || [];

            // Should create fields for all payload properties
            expect(fields.some(f => f.name === 'Id')).toBe(true);
            expect(fields.some(f => f.name === 'Name')).toBe(true);
            expect(fields.some(f => f.name === 'Status')).toBe(true);
        });
    });

    describe('Mixed Event Type Handling', () => {
        it('should handle mixed TeamCity and non-TeamCity events in sequence', () => {
            const events = [
                // TeamCity event
                {
                    eventType: 'BUILD_STARTED',
                    payload: {
                        id: 123,
                        buildTypeId: 'test',
                        number: '456',
                        status: 'SUCCESS',
                        state: 'running',
                        webUrl: 'http://example.com',
                        buildType: {
                            name: 'Test Build',
                            projectName: 'Test Project'
                        }
                    }
                },
                // Non-TeamCity event
                {
                    eventType: 'DEPLOYMENT_FINISHED',
                    payload: {
                        service: 'api',
                        version: '1.2.3',
                        status: 'success'
                    }
                },
                // Another TeamCity event
                {
                    eventType: 'BUILD_FINISHED',
                    payload: {
                        id: 124,
                        buildTypeId: 'test',
                        number: '457',
                        status: 'FAILURE',
                        state: 'finished',
                        webUrl: 'http://example.com',
                        buildType: {
                            name: 'Test Build',
                            projectName: 'Test Project'
                        }
                    }
                }
            ];

            events.forEach((event) => {
                if (isTeamCityWebhookEvent(event)) {
                    // Should create specialized TeamCity embed
                    const teamCityEmbed = createTeamCityEmbed(event);
                    expect(teamCityEmbed).not.toBeNull();

                    const embedData = teamCityEmbed!.toJSON();
                    if (event.eventType === 'BUILD_STARTED') {
                        expect(embedData.title).toContain('🚀 Build Started');
                        expect(embedData.color).toBe(0x3498DB);
                    } else if (event.eventType === 'BUILD_FINISHED') {
                        expect(embedData.title).toContain('❌ Build Finished'); // Failed build
                        expect(embedData.color).toBe(0xE74C3C);
                    }
                } else {
                    // Should create generic embed
                    const genericEmbed = buildWebSocketEventEmbed(event);
                    expect(genericEmbed).not.toBeNull();

                    const embedData = genericEmbed.toJSON();
                    expect(embedData.title).toContain(`Webhook Event: ${event.eventType}`);
                    expect(embedData.color).toBe(0x00AE86);
                }
            });
        });
    });

    describe('Graceful Degradation', () => {
        it('should gracefully degrade from specialized to generic embeds', () => {
            // Malformed TeamCity event that should fall back to generic
            const malformedTeamCityEvent = {
                eventType: 'BUILD_STARTED',
                payload: {
                    id: 123
                    // Missing required fields
                }
            };

            // Should be detected as TeamCity event
            expect(isTeamCityWebhookEvent(malformedTeamCityEvent)).toBe(true);

            // Specialized embed should fail
            const teamCityEmbed = createTeamCityEmbed(malformedTeamCityEvent as any);
            expect(teamCityEmbed).toBeNull();

            // Generic embed should work as fallback
            const genericEmbed = buildWebSocketEventEmbed(malformedTeamCityEvent);
            expect(genericEmbed).not.toBeNull();

            const embedData = genericEmbed.toJSON();
            expect(embedData.title).toContain('Webhook Event: BUILD_STARTED');
            expect(embedData.color).toBe(0x00AE86);
        });

        it('should handle edge cases without breaking existing functionality', () => {
            const edgeCases = [
                null,
                undefined,
                {},
                { eventType: null },
                { eventType: '', payload: null },
                { eventType: 'TEST', payload: {} },
                { eventType: 'TEST', payload: { circular: null } }
            ];

            // Create circular reference for the last item that has a payload
            const lastItem = edgeCases[edgeCases.length - 1] as any;
            if (lastItem && lastItem.payload && typeof lastItem.payload === 'object') {
                lastItem.payload.circular = lastItem.payload;
            }

            edgeCases.forEach((edgeCase) => {
                // Should not crash
                expect(() => {
                    const embed = buildWebSocketEventEmbed(edgeCase);
                    expect(embed).not.toBeNull();
                }).not.toThrow();

                // TeamCity embed creation should handle gracefully
                expect(() => {
                    const teamCityEmbed = createTeamCityEmbed(edgeCase as any);
                    // Should return null for invalid cases
                    expect(teamCityEmbed).toBeNull();
                }).not.toThrow();
            });
        });
    });

    describe('API Compatibility', () => {
        it('should maintain all original export signatures', () => {
            // Verify all expected functions are exported and callable
            expect(typeof buildWebSocketEventEmbed).toBe('function');
            expect(typeof createTeamCityEmbed).toBe('function');
            expect(typeof isTeamCityWebhookEvent).toBe('function');

            // Verify function signatures haven't changed
            expect(buildWebSocketEventEmbed.length).toBe(1); // Takes 1 parameter
            expect(createTeamCityEmbed.length).toBe(1); // Takes 1 parameter
            expect(isTeamCityWebhookEvent.length).toBe(1); // Takes 1 parameter
        });

        it('should return compatible embed objects', () => {
            const testEvent = {
                eventType: 'TEST',
                payload: { test: 'value' }
            };

            const embed = buildWebSocketEventEmbed(testEvent);

            // Should have all expected methods
            expect(typeof embed.toJSON).toBe('function');
            expect(typeof embed.setTitle).toBe('function');
            expect(typeof embed.setColor).toBe('function');
            expect(typeof embed.setTimestamp).toBe('function');
            expect(typeof embed.setFooter).toBe('function');
            expect(typeof embed.addFields).toBe('function');

            // Should produce valid embed data
            const embedData = embed.toJSON();
            expect(embedData).toHaveProperty('title');
            expect(embedData).toHaveProperty('color');
            expect(embedData).toHaveProperty('timestamp');
            expect(embedData).toHaveProperty('footer');
        });
    });

    describe('Performance Compatibility', () => {
        it('should not significantly impact performance for non-TeamCity events', () => {
            const nonTeamCityEvent = {
                eventType: 'GENERIC_EVENT',
                payload: { data: 'test' }
            };

            const startTime = performance.now();

            // Process 100 events
            for (let i = 0; i < 100; i++) {
                const embed = buildWebSocketEventEmbed(nonTeamCityEvent);
                expect(embed).not.toBeNull();
            }

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // Should complete reasonably quickly (less than 1 second for 100 events)
            expect(totalTime).toBeLessThan(1000);
        });

        it('should handle large payloads efficiently', () => {
            const largePayload = {
                eventType: 'LARGE_EVENT',
                payload: {}
            };

            // Create large payload
            for (let i = 0; i < 1000; i++) {
                largePayload.payload[`field${i}`] = `value${i}`;
            }

            const startTime = performance.now();
            const embed = buildWebSocketEventEmbed(largePayload);
            const endTime = performance.now();

            expect(embed).not.toBeNull();
            expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
        });
    });
});