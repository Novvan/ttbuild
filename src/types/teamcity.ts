// TeamCity webhook event types and interfaces

/**
 * TeamCity build status values
 */
export type TeamCityBuildStatus = 'SUCCESS' | 'FAILURE' | 'UNKNOWN' | string;

/**
 * TeamCity build state values
 */
export type TeamCityBuildState = 'running' | 'finished' | 'queued' | string;

/**
 * TeamCity event types
 */
export type TeamCityEventType = 'BUILD_STARTED' | 'BUILD_FINISHED' | 'BUILD_INTERRUPTED' | string;

/**
 * TeamCity trigger types
 */
export type TeamCityTriggerType = 'schedule' | 'user' | 'vcs' | string;

/**
 * User information interface
 */
export interface TeamCityUser {
  username: string;
  id: number;
  href: string;
}

/**
 * Build type information interface
 */
export interface TeamCityBuildType {
  id?: string;
  name: string;
  description?: string;
  projectName: string;
  projectId?: string;
  href?: string;
  webUrl?: string;
}

/**
 * Agent information interface
 */
export interface TeamCityAgent {
  id: number;
  name: string;
  typeId?: number;
  href?: string;
  webUrl?: string;
}

/**
 * Running information interface (for BUILD_STARTED events)
 */
export interface TeamCityRunningInfo {
  percentageComplete: number;
  elapsedSeconds: number;
  estimatedTotalSeconds: number;
  currentStageText?: string;
  outdated?: boolean;
  probablyHanging?: boolean;
}

/**
 * Canceled information interface (for BUILD_INTERRUPTED events)
 */
export interface TeamCityCanceledInfo {
  timestamp: string;
  text: string;
  user: TeamCityUser;
}

/**
 * Trigger information interface
 */
export interface TeamCityTrigger {
  type: TeamCityTriggerType;
  date: string;
  user?: TeamCityUser;
}

/**
 * Change information interface
 */
export interface TeamCityChange {
  id: number;
  version: string;
  username: string;
  date: string;
  href: string;
  webUrl: string;
}

/**
 * Last changes information interface
 */
export interface TeamCityLastChanges {
  count: number;
  change: TeamCityChange[];
}

/**
 * Changes collection interface
 */
export interface TeamCityChanges {
  count?: number;
  href: string;
}

/**
 * VCS root instance interface
 */
export interface TeamCityVcsRootInstance {
  id: string;
  'vcs-root-id': string;
  name: string;
  href: string;
}

/**
 * Revision information interface
 */
export interface TeamCityRevision {
  version: string;
  'vcs-root-instance': TeamCityVcsRootInstance;
}

/**
 * Revisions collection interface
 */
export interface TeamCityRevisions {
  count: number;
  revision?: TeamCityRevision[];
}

/**
 * Property interface
 */
export interface TeamCityProperty {
  name: string;
  value: string;
  inherited: boolean;
}

/**
 * Properties collection interface
 */
export interface TeamCityProperties {
  count: number;
  property: TeamCityProperty[];
}

/**
 * Artifacts collection interface
 */
export interface TeamCityArtifacts {
  count?: number;
  href: string;
}

/**
 * Related issues interface
 */
export interface TeamCityRelatedIssues {
  href: string;
}

/**
 * Statistics interface
 */
export interface TeamCityStatistics {
  href: string;
}

/**
 * Main TeamCity webhook payload interface
 */
export interface TeamCityWebhookPayload {
  id: number;
  buildTypeId: string;
  number: string;
  status: TeamCityBuildStatus;
  state: TeamCityBuildState;
  href?: string;
  webUrl: string;
  statusText: string;
  buildType: TeamCityBuildType;
  
  // Optional fields that may be present depending on event type
  percentageComplete?: number;
  queuedDate?: string;
  startDate?: string;
  finishDate?: string;
  finishOnAgentDate?: string;
  
  // Running info (mainly for BUILD_STARTED)
  'running-info'?: TeamCityRunningInfo;
  
  // Canceled info (for BUILD_INTERRUPTED)
  canceledInfo?: TeamCityCanceledInfo;
  
  // Trigger information
  triggered?: TeamCityTrigger;
  
  // Changes information
  lastChanges?: TeamCityLastChanges;
  changes?: TeamCityChanges;
  revisions?: TeamCityRevisions;
  
  // Agent information
  agent?: TeamCityAgent;
  
  // Additional collections
  artifacts?: TeamCityArtifacts;
  relatedIssues?: TeamCityRelatedIssues;
  properties?: TeamCityProperties;
  statistics?: TeamCityStatistics;
  vcsLabels?: any[];
  customization?: Record<string, any>;
}

/**
 * Main TeamCity webhook event interface
 */
export interface TeamCityWebhookEvent {
  eventType: TeamCityEventType;
  payload: TeamCityWebhookPayload;
}

/**
 * Type guard to check if an object is a TeamCity webhook event
 * This is a lenient check that identifies potential TeamCity events
 * even if they're malformed or incomplete
 */
export function isTeamCityWebhookEvent(obj: any): obj is TeamCityWebhookEvent {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.eventType === 'string' &&
    (obj.eventType === 'BUILD_STARTED' || 
     obj.eventType === 'BUILD_FINISHED' || 
     obj.eventType === 'BUILD_INTERRUPTED' ||
     obj.eventType.startsWith('BUILD_'))
  );
}

/**
 * Strict type guard to check if an object is a valid TeamCity webhook event
 * This performs full validation of all required fields
 */
export function isValidTeamCityWebhookEvent(obj: any): obj is TeamCityWebhookEvent {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.eventType === 'string' &&
    obj.payload &&
    typeof obj.payload === 'object' &&
    typeof obj.payload.id === 'number' &&
    typeof obj.payload.buildTypeId === 'string' &&
    typeof obj.payload.number === 'string' &&
    typeof obj.payload.status === 'string' &&
    typeof obj.payload.state === 'string' &&
    typeof obj.payload.webUrl === 'string' &&
    obj.payload.buildType &&
    typeof obj.payload.buildType.name === 'string' &&
    typeof obj.payload.buildType.projectName === 'string'
  );
}

/**
 * Type guard to check if an event is a BUILD_STARTED event
 */
export function isBuildStartedEvent(event: TeamCityWebhookEvent): boolean {
  return event.eventType === 'BUILD_STARTED';
}

/**
 * Type guard to check if an event is a BUILD_FINISHED event
 */
export function isBuildFinishedEvent(event: TeamCityWebhookEvent): boolean {
  return event.eventType === 'BUILD_FINISHED';
}

/**
 * Type guard to check if an event is a BUILD_INTERRUPTED event
 */
export function isBuildInterruptedEvent(event: TeamCityWebhookEvent): boolean {
  return event.eventType === 'BUILD_INTERRUPTED';
}

/**
 * Type guard to check if payload has running info
 */
export function hasRunningInfo(payload: TeamCityWebhookPayload): payload is TeamCityWebhookPayload & { 'running-info': TeamCityRunningInfo } {
  return payload['running-info'] !== undefined;
}

/**
 * Type guard to check if payload has canceled info
 */
export function hasCanceledInfo(payload: TeamCityWebhookPayload): payload is TeamCityWebhookPayload & { canceledInfo: TeamCityCanceledInfo } {
  return payload.canceledInfo !== undefined;
}

/**
 * Type guard to check if payload has last changes
 */
export function hasLastChanges(payload: TeamCityWebhookPayload): payload is TeamCityWebhookPayload & { lastChanges: TeamCityLastChanges } {
  return payload.lastChanges !== undefined && payload.lastChanges.count > 0;
}

/**
 * Type guard to check if payload has agent info
 */
export function hasAgent(payload: TeamCityWebhookPayload): payload is TeamCityWebhookPayload & { agent: TeamCityAgent } {
  return payload.agent !== undefined;
}