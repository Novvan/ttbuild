// tests/validation.test.ts
import { describe, it, expect } from 'vitest';
import { 
  validateWebhookEvent, 
  validateTeamCityEvent, 
  sanitizeTeamCityEvent, 
  formatValidationErrors 
} from '../src/utils/validation.js';

describe('validateWebhookEvent', () => {
  it('should validate a proper webhook event', () => {
    const validEvent = {
      eventType: 'BUILD_STARTED',
      payload: {
        id: 123,
        buildTypeId: 'test'
      }
    };

    const result = validateWebhookEvent(validEvent);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject null or undefined events', () => {
    const result1 = validateWebhookEvent(null);
    expect(result1.isValid).toBe(false);
    expect(result1.errors).toContain('Event is null or undefined');

    const result2 = validateWebhookEvent(undefined);
    expect(result2.isValid).toBe(false);
    expect(result2.errors).toContain('Event is null or undefined');
  });

  it('should reject non-object events', () => {
    const result = validateWebhookEvent('not an object');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Event must be an object');
  });

  it('should reject events without eventType', () => {
    const result = validateWebhookEvent({ payload: {} });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Event must have an eventType');
  });

  it('should reject events with non-string eventType', () => {
    const result = validateWebhookEvent({ eventType: 123, payload: {} });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('eventType must be a string');
  });

  it('should reject events without payload', () => {
    const result = validateWebhookEvent({ eventType: 'TEST' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Event must have a payload');
  });

  it('should reject events with non-object payload', () => {
    const result = validateWebhookEvent({ eventType: 'TEST', payload: 'not an object' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Payload must be an object');
  });
});

describe('validateTeamCityEvent', () => {
  const validTeamCityEvent = {
    eventType: 'BUILD_STARTED',
    payload: {
      id: 123,
      buildTypeId: 'test_build',
      number: '456',
      status: 'SUCCESS',
      state: 'finished',
      webUrl: 'http://example.com',
      buildType: {
        name: 'Test Build',
        projectName: 'Test Project'
      }
    }
  };

  it('should validate a proper TeamCity event', () => {
    const result = validateTeamCityEvent(validTeamCityEvent);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject events missing required fields', () => {
    const incompleteEvent = {
      eventType: 'BUILD_STARTED',
      payload: {
        id: 123
        // Missing other required fields
      }
    };

    const result = validateTeamCityEvent(incompleteEvent);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('Missing required field'))).toBe(true);
  });

  it('should reject events with invalid buildType', () => {
    const invalidBuildTypeEvent = {
      ...validTeamCityEvent,
      payload: {
        ...validTeamCityEvent.payload,
        buildType: 'not an object'
      }
    };

    const result = validateTeamCityEvent(invalidBuildTypeEvent);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('buildType must be an object');
  });

  it('should reject events with incomplete buildType', () => {
    const incompleteBuildTypeEvent = {
      ...validTeamCityEvent,
      payload: {
        ...validTeamCityEvent.payload,
        buildType: {
          name: 'Test Build'
          // Missing projectName
        }
      }
    };

    const result = validateTeamCityEvent(incompleteBuildTypeEvent);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing required buildType field: projectName');
  });

  it('should add warnings for invalid numeric fields', () => {
    const invalidNumericEvent = {
      ...validTeamCityEvent,
      payload: {
        ...validTeamCityEvent.payload,
        id: 'not a number'
      }
    };

    const result = validateTeamCityEvent(invalidNumericEvent);
    expect(result.warnings.some(w => w.includes('id should be a positive number'))).toBe(true);
  });
});

describe('sanitizeTeamCityEvent', () => {
  it('should provide default values for missing fields', () => {
    const incompleteEvent = {
      eventType: 'BUILD_STARTED',
      payload: {
        buildType: {
          name: 'Test Build',
          projectName: 'Test Project'
        }
      }
    };

    const sanitized = sanitizeTeamCityEvent(incompleteEvent);
    
    expect(sanitized.eventType).toBe('BUILD_STARTED');
    expect(sanitized.payload.id).toBe(0);
    expect(sanitized.payload.buildTypeId).toBe('unknown');
    expect(sanitized.payload.number).toBe('0');
    expect(sanitized.payload.status).toBe('UNKNOWN');
    expect(sanitized.payload.state).toBe('unknown');
    expect(sanitized.payload.buildType.name).toBe('Test Build');
    expect(sanitized.payload.buildType.projectName).toBe('Test Project');
  });

  it('should preserve existing valid fields', () => {
    const validEvent = {
      eventType: 'BUILD_FINISHED',
      payload: {
        id: 123,
        buildTypeId: 'test_build',
        number: '456',
        status: 'SUCCESS',
        state: 'finished',
        webUrl: 'http://example.com',
        buildType: {
          name: 'Test Build',
          projectName: 'Test Project'
        },
        startDate: '20250812T000012-0300'
      }
    };

    const sanitized = sanitizeTeamCityEvent(validEvent);
    
    expect(sanitized.eventType).toBe('BUILD_FINISHED');
    expect(sanitized.payload.id).toBe(123);
    expect(sanitized.payload.buildTypeId).toBe('test_build');
    expect(sanitized.payload.startDate).toBe('20250812T000012-0300');
  });

  it('should handle completely malformed events', () => {
    const malformedEvent = {
      eventType: null,
      payload: null
    };

    const sanitized = sanitizeTeamCityEvent(malformedEvent);
    
    expect(sanitized.eventType).toBe('UNKNOWN');
    expect(sanitized.payload.buildType.name).toBe('Unknown Build');
    expect(sanitized.payload.buildType.projectName).toBe('Unknown Project');
  });
});

describe('formatValidationErrors', () => {
  it('should format errors and warnings correctly', () => {
    const validation = {
      isValid: false,
      errors: ['Error 1', 'Error 2'],
      warnings: ['Warning 1']
    };

    const formatted = formatValidationErrors(validation);
    expect(formatted).toContain('Errors: Error 1, Error 2');
    expect(formatted).toContain('Warnings: Warning 1');
  });

  it('should handle empty errors and warnings', () => {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const formatted = formatValidationErrors(validation);
    expect(formatted).toBe('');
  });

  it('should handle only errors', () => {
    const validation = {
      isValid: false,
      errors: ['Error 1'],
      warnings: []
    };

    const formatted = formatValidationErrors(validation);
    expect(formatted).toBe('Errors: Error 1');
  });

  it('should handle only warnings', () => {
    const validation = {
      isValid: true,
      errors: [],
      warnings: ['Warning 1']
    };

    const formatted = formatValidationErrors(validation);
    expect(formatted).toBe('Warnings: Warning 1');
  });
});