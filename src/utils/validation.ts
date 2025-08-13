// src/utils/validation.ts

/**
 * Validation utilities for webhook events and embed creation
 */

import { TeamCityWebhookEvent, TeamCityWebhookPayload } from '../types/teamcity.js';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate webhook event structure
 * @param event - Event to validate
 * @returns Validation result
 */
export function validateWebhookEvent(event: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check if event exists
  if (!event) {
    result.isValid = false;
    result.errors.push('Event is null or undefined');
    return result;
  }

  // Check if event is an object
  if (typeof event !== 'object') {
    result.isValid = false;
    result.errors.push('Event must be an object');
    return result;
  }

  // Check eventType
  if (!event.eventType) {
    result.isValid = false;
    result.errors.push('Event must have an eventType');
  } else if (typeof event.eventType !== 'string') {
    result.isValid = false;
    result.errors.push('eventType must be a string');
  }

  // Check payload
  if (!event.payload) {
    result.isValid = false;
    result.errors.push('Event must have a payload');
    return result;
  }

  if (typeof event.payload !== 'object') {
    result.isValid = false;
    result.errors.push('Payload must be an object');
    return result;
  }

  return result;
}

/**
 * Validate TeamCity webhook event structure
 * @param event - TeamCity event to validate
 * @returns Validation result
 */
export function validateTeamCityEvent(event: any): ValidationResult {
  const result = validateWebhookEvent(event);
  
  if (!result.isValid) {
    return result;
  }

  const payload = event.payload;

  // Required fields for TeamCity events
  const requiredFields = ['id', 'buildTypeId', 'number', 'status', 'state', 'webUrl', 'buildType'];
  
  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null) {
      result.errors.push(`Missing required field: ${field}`);
      result.isValid = false;
    }
  }

  // Validate buildType structure
  if (payload.buildType) {
    if (typeof payload.buildType !== 'object') {
      result.errors.push('buildType must be an object');
      result.isValid = false;
    } else {
      const requiredBuildTypeFields = ['name', 'projectName'];
      for (const field of requiredBuildTypeFields) {
        if (!payload.buildType[field]) {
          result.errors.push(`Missing required buildType field: ${field}`);
          result.isValid = false;
        }
      }
    }
  }

  // Validate numeric fields
  if (payload.id !== undefined && (typeof payload.id !== 'number' || payload.id <= 0)) {
    result.warnings.push('id should be a positive number');
  }

  // Validate URL fields
  if (payload.webUrl && typeof payload.webUrl !== 'string') {
    result.warnings.push('webUrl should be a string');
  }

  return result;
}

/**
 * Sanitize and provide default values for TeamCity event
 * @param event - Event to sanitize
 * @returns Sanitized event
 */
export function sanitizeTeamCityEvent(event: any): TeamCityWebhookEvent {
  const sanitized: TeamCityWebhookEvent = {
    eventType: event.eventType || 'UNKNOWN',
    payload: {
      id: event.payload?.id || 0,
      buildTypeId: event.payload?.buildTypeId || 'unknown',
      number: event.payload?.number || '0',
      status: event.payload?.status || 'UNKNOWN',
      state: event.payload?.state || 'unknown',
      href: event.payload?.href || '',
      webUrl: event.payload?.webUrl || '',
      statusText: event.payload?.statusText || event.payload?.status || 'Unknown',
      buildType: {
        id: event.payload?.buildType?.id || 'unknown',
        name: event.payload?.buildType?.name || 'Unknown Build',
        description: event.payload?.buildType?.description || '',
        projectName: event.payload?.buildType?.projectName || 'Unknown Project',
        projectId: event.payload?.buildType?.projectId || 'unknown',
        href: event.payload?.buildType?.href || '',
        webUrl: event.payload?.buildType?.webUrl || ''
      },
      // Copy optional fields if they exist
      ...(event.payload?.queuedDate && { queuedDate: event.payload.queuedDate }),
      ...(event.payload?.startDate && { startDate: event.payload.startDate }),
      ...(event.payload?.finishDate && { finishDate: event.payload.finishDate }),
      ...(event.payload?.finishOnAgentDate && { finishOnAgentDate: event.payload.finishOnAgentDate }),
      ...(event.payload?.['running-info'] && { 'running-info': event.payload['running-info'] }),
      ...(event.payload?.canceledInfo && { canceledInfo: event.payload.canceledInfo }),
      ...(event.payload?.triggered && { triggered: event.payload.triggered }),
      ...(event.payload?.lastChanges && { lastChanges: event.payload.lastChanges }),
      ...(event.payload?.changes && { changes: event.payload.changes }),
      ...(event.payload?.revisions && { revisions: event.payload.revisions }),
      ...(event.payload?.agent && { agent: event.payload.agent }),
      ...(event.payload?.artifacts && { artifacts: event.payload.artifacts }),
      ...(event.payload?.relatedIssues && { relatedIssues: event.payload.relatedIssues }),
      ...(event.payload?.properties && { properties: event.payload.properties }),
      ...(event.payload?.statistics && { statistics: event.payload.statistics }),
      ...(event.payload?.vcsLabels && { vcsLabels: event.payload.vcsLabels }),
      ...(event.payload?.customization && { customization: event.payload.customization })
    }
  };

  return sanitized;
}

/**
 * Create error message for validation failures
 * @param validation - Validation result
 * @returns Formatted error message
 */
export function formatValidationErrors(validation: ValidationResult): string {
  const messages: string[] = [];
  
  if (validation.errors.length > 0) {
    messages.push(`Errors: ${validation.errors.join(', ')}`);
  }
  
  if (validation.warnings.length > 0) {
    messages.push(`Warnings: ${validation.warnings.join(', ')}`);
  }
  
  return messages.join('; ');
}