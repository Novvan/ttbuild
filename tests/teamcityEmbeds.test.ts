// tests/teamcityEmbeds.test.ts
import { describe, it, expect } from 'vitest';
import { buildStartedEmbed, buildFinishedEmbed, buildInterruptedEmbed, createTeamCityEmbed } from '../src/teamcityEmbeds.js';
import { TeamCityWebhookEvent } from '../src/types/teamcity.js';

// BUILD_STARTED fixture data
const buildStartedFixture: TeamCityWebhookEvent = {
  "eventType": "BUILD_STARTED",
  "payload": {
    "id": 901,
    "buildTypeId": "Wolf1Remaster_TelltaleTool",
    "number": "2031",
    "status": "SUCCESS",
    "state": "running",
    "href": "/app/rest/builds/id:901",
    "webUrl": "http://localhost:8111/buildConfiguration/Wolf1Remaster_TelltaleTool/901",
    "statusText": "Running",
    "buildType": {
      "id": "Wolf1Remaster_TelltaleTool",
      "name": "TelltaleTool",
      "description": "Telltale tool build process",
      "projectName": "Wolf1Remaster",
      "projectId": "Wolf1Remaster",
      "href": "/app/rest/buildTypes/id:Wolf1Remaster_TelltaleTool",
      "webUrl": "http://localhost:8111/buildConfiguration/Wolf1Remaster_TelltaleTool?mode=builds"
    },
    "running-info": {
      "percentageComplete": 0,
      "elapsedSeconds": 0,
      "estimatedTotalSeconds": 586,
      "currentStageText": "",
      "outdated": false,
      "probablyHanging": false
    },
    "queuedDate": "20250812T000012-0300",
    "startDate": "20250812T000012-0300",
    "triggered": {
      "type": "schedule",
      "date": "20250812T000012-0300"
    },
    "changes": {
      "href": "/app/rest/changes?locator=build:(id:901)"
    },
    "revisions": {
      "count": 0
    },
    "agent": {
      "id": 11,
      "name": "DESKTOP-M7LV5BI",
      "typeId": 11,
      "href": "/app/rest/agents/id:11",
      "webUrl": "http://localhost:8111/agentDetails.html?id=11&agentTypeId=11&realAgentName=DESKTOP-M7LV5BI"
    },
    "artifacts": {
      "href": "/app/rest/builds/id:901/artifacts/children/"
    },
    "relatedIssues": {
      "href": "/app/rest/builds/id:901/relatedIssues"
    },
    "properties": {
      "property": [
        {
          "name": "assetBuildsLocation",
          "value": "C:\\AssetBuilds\\Fables\\PC",
          "inherited": true
        }
      ],
      "count": 11
    },
    "statistics": {
      "href": "/app/rest/builds/id:901/statistics"
    },
    "vcsLabels": [],
    "customization": {}
  }
};

describe('buildStartedEmbed', () => {
  it('should create a BUILD_STARTED embed with correct title and color', () => {
    const embed = buildStartedEmbed(buildStartedFixture);
    const embedData = embed.toJSON();

    expect(embedData.title).toBe('🚀 Build Started: TelltaleTool');
    expect(embedData.color).toBe(0x3498DB); // Blue color
    expect(embedData.footer?.text).toBe('TeamCity Build Notification');
  });

  it('should include project name, build type, and build number prominently', () => {
    const embed = buildStartedEmbed(buildStartedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for project field
    const projectField = fields.find(f => f.name === 'Project');
    expect(projectField).toBeDefined();
    expect(projectField?.value).toBe('Wolf1Remaster');
    expect(projectField?.inline).toBe(true);

    // Check for build type field
    const buildTypeField = fields.find(f => f.name === 'Build Type');
    expect(buildTypeField).toBeDefined();
    expect(buildTypeField?.value).toBe('TelltaleTool');
    expect(buildTypeField?.inline).toBe(true);

    // Check for build number field
    const buildNumberField = fields.find(f => f.name === 'Build Number');
    expect(buildNumberField).toBeDefined();
    expect(buildNumberField?.value).toBe('#2031');
    expect(buildNumberField?.inline).toBe(true);
  });

  it('should include build status and agent information', () => {
    const embed = buildStartedEmbed(buildStartedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for status field
    const statusField = fields.find(f => f.name === 'Status');
    expect(statusField).toBeDefined();
    expect(statusField?.value).toBe('Running');
    expect(statusField?.inline).toBe(true);

    // Check for agent field
    const agentField = fields.find(f => f.name === 'Agent');
    expect(agentField).toBeDefined();
    expect(agentField?.value).toBe('DESKTOP-M7LV5BI');
    expect(agentField?.inline).toBe(true);
  });

  it('should show progress percentage and estimated completion time from running-info', () => {
    const embed = buildStartedEmbed(buildStartedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for progress field
    const progressField = fields.find(f => f.name === 'Progress');
    expect(progressField).toBeDefined();
    expect(progressField?.value).toBe('0%');
    expect(progressField?.inline).toBe(true);

    // Check for estimated time remaining field
    const estimatedField = fields.find(f => f.name === 'Est. Time Remaining');
    expect(estimatedField).toBeDefined();
    expect(estimatedField?.value).toBe('9m 46s'); // 586 seconds = 9m 46s
    expect(estimatedField?.inline).toBe(true);
  });

  it('should include clickable link to TeamCity build URL', () => {
    const embed = buildStartedEmbed(buildStartedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for TeamCity link field
    const linkField = fields.find(f => f.name === 'TeamCity Link');
    expect(linkField).toBeDefined();
    expect(linkField?.value).toBe('[View Build](http://localhost:8111/buildConfiguration/Wolf1Remaster_TelltaleTool/901)');
    expect(linkField?.inline).toBe(false);
  });

  it('should include start time when available', () => {
    const embed = buildStartedEmbed(buildStartedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for started at field
    const startedField = fields.find(f => f.name === 'Started At');
    expect(startedField).toBeDefined();
    expect(startedField?.value).toContain('Aug 12, 2025'); // Should contain the formatted date
    expect(startedField?.inline).toBe(true);
  });

  it('should handle missing running-info gracefully', () => {
    const eventWithoutRunningInfo: TeamCityWebhookEvent = {
      ...buildStartedFixture,
      payload: {
        ...buildStartedFixture.payload,
        'running-info': undefined
      }
    };

    const embed = buildStartedEmbed(eventWithoutRunningInfo);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Progress and estimated time fields should not be present
    const progressField = fields.find(f => f.name === 'Progress');
    const estimatedField = fields.find(f => f.name === 'Est. Time Remaining');
    
    expect(progressField).toBeUndefined();
    expect(estimatedField).toBeUndefined();
  });

  it('should handle missing agent information gracefully', () => {
    const eventWithoutAgent: TeamCityWebhookEvent = {
      ...buildStartedFixture,
      payload: {
        ...buildStartedFixture.payload,
        agent: undefined
      }
    };

    const embed = buildStartedEmbed(eventWithoutAgent);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Agent field should not be present
    const agentField = fields.find(f => f.name === 'Agent');
    expect(agentField).toBeUndefined();
  });

  it('should include current stage text when available and not empty', () => {
    const eventWithStageText: TeamCityWebhookEvent = {
      ...buildStartedFixture,
      payload: {
        ...buildStartedFixture.payload,
        'running-info': {
          ...buildStartedFixture.payload['running-info']!,
          currentStageText: "Compiling sources"
        }
      }
    };

    const embed = buildStartedEmbed(eventWithStageText);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for current stage field
    const stageField = fields.find(f => f.name === 'Current Stage');
    expect(stageField).toBeDefined();
    expect(stageField?.value).toBe('Compiling sources');
    expect(stageField?.inline).toBe(false);
  });

  it('should not include current stage text when empty', () => {
    // The fixture already has empty currentStageText
    const embed = buildStartedEmbed(buildStartedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Current stage field should not be present when empty
    const stageField = fields.find(f => f.name === 'Current Stage');
    expect(stageField).toBeUndefined();
  });

  it('should have a timestamp', () => {
    const embed = buildStartedEmbed(buildStartedFixture);
    const embedData = embed.toJSON();

    expect(embedData.timestamp).toBeDefined();
  });
});

// BUILD_FINISHED fixture data
const buildFinishedFixture: TeamCityWebhookEvent = {
  "eventType": "BUILD_FINISHED",
  "payload": {
    "id": 901,
    "buildTypeId": "Wolf1Remaster_TelltaleTool",
    "number": "2031",
    "status": "SUCCESS",
    "state": "finished",
    "href": "/app/rest/builds/id:901",
    "webUrl": "http://localhost:8111/buildConfiguration/Wolf1Remaster_TelltaleTool/901",
    "statusText": "Success",
    "buildType": {
      "id": "Wolf1Remaster_TelltaleTool",
      "name": "TelltaleTool",
      "description": "Telltale tool build process",
      "projectName": "Wolf1Remaster",
      "projectId": "Wolf1Remaster",
      "href": "/app/rest/buildTypes/id:Wolf1Remaster_TelltaleTool",
      "webUrl": "http://localhost:8111/buildConfiguration/Wolf1Remaster_TelltaleTool?mode=builds"
    },
    "queuedDate": "20250812T000012-0300",
    "startDate": "20250812T000012-0300",
    "finishDate": "20250812T003411-0300",
    "triggered": {
      "type": "schedule",
      "date": "20250812T000012-0300"
    },
    "lastChanges": {
      "count": 1,
      "change": [
        {
          "id": 41,
          "version": "65",
          "username": "telltale.team",
          "date": "20250623T174931-0300",
          "href": "/app/rest/changes/id:41",
          "webUrl": "http://localhost:8111/change/41?personal=false"
        }
      ]
    },
    "changes": {
      "count": 0,
      "href": "/app/rest/changes?locator=build:(id:901)"
    },
    "revisions": {
      "count": 0
    },
    "agent": {
      "id": 11,
      "name": "DESKTOP-M7LV5BI",
      "typeId": 11,
      "href": "/app/rest/agents/id:11",
      "webUrl": "http://localhost:8111/agentDetails.html?id=11&agentTypeId=11&realAgentName=DESKTOP-M7LV5BI"
    },
    "artifacts": {
      "count": 0,
      "href": "/app/rest/builds/id:901/artifacts/children/"
    },
    "relatedIssues": {
      "href": "/app/rest/builds/id:901/relatedIssues"
    },
    "properties": {
      "property": [
        {
          "name": "assetBuildsLocation",
          "value": "C:\\AssetBuilds\\Fables\\PC",
          "inherited": true
        }
      ],
      "count": 11
    },
    "statistics": {
      "href": "/app/rest/builds/id:901/statistics"
    },
    "vcsLabels": [],
    "finishOnAgentDate": "20250812T003411-0300",
    "customization": {}
  }
};

describe('buildFinishedEmbed', () => {
  it('should create a BUILD_FINISHED embed with correct title and color for successful build', () => {
    const embed = buildFinishedEmbed(buildFinishedFixture);
    const embedData = embed.toJSON();

    expect(embedData.title).toBe('✅ Build Finished: TelltaleTool');
    expect(embedData.color).toBe(0x27AE60); // Green color for success
    expect(embedData.footer?.text).toBe('TeamCity Build Notification');
  });

  it('should create a BUILD_FINISHED embed with correct title and color for failed build', () => {
    const failedBuildFixture: TeamCityWebhookEvent = {
      ...buildFinishedFixture,
      payload: {
        ...buildFinishedFixture.payload,
        status: "FAILURE",
        statusText: "Failed"
      }
    };

    const embed = buildFinishedEmbed(failedBuildFixture);
    const embedData = embed.toJSON();

    expect(embedData.title).toBe('❌ Build Finished: TelltaleTool');
    expect(embedData.color).toBe(0xE74C3C); // Red color for failure
  });

  it('should include project name, build type, and build number prominently', () => {
    const embed = buildFinishedEmbed(buildFinishedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for project field
    const projectField = fields.find(f => f.name === 'Project');
    expect(projectField).toBeDefined();
    expect(projectField?.value).toBe('Wolf1Remaster');
    expect(projectField?.inline).toBe(true);

    // Check for build type field
    const buildTypeField = fields.find(f => f.name === 'Build Type');
    expect(buildTypeField).toBeDefined();
    expect(buildTypeField?.value).toBe('TelltaleTool');
    expect(buildTypeField?.inline).toBe(true);

    // Check for build number field
    const buildNumberField = fields.find(f => f.name === 'Build Number');
    expect(buildNumberField).toBeDefined();
    expect(buildNumberField?.value).toBe('#2031');
    expect(buildNumberField?.inline).toBe(true);
  });

  it('should display final build status and agent information', () => {
    const embed = buildFinishedEmbed(buildFinishedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for final status field
    const statusField = fields.find(f => f.name === 'Final Status');
    expect(statusField).toBeDefined();
    expect(statusField?.value).toBe('Success');
    expect(statusField?.inline).toBe(true);

    // Check for agent field
    const agentField = fields.find(f => f.name === 'Agent');
    expect(agentField).toBeDefined();
    expect(agentField?.value).toBe('DESKTOP-M7LV5BI');
    expect(agentField?.inline).toBe(true);
  });

  it('should calculate and display build duration from start to finish dates', () => {
    const embed = buildFinishedEmbed(buildFinishedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for build duration field
    const durationField = fields.find(f => f.name === 'Build Duration');
    expect(durationField).toBeDefined();
    expect(durationField?.value).toBe('33m 59s'); // Duration from 00:00:12 to 00:34:11
    expect(durationField?.inline).toBe(true);
  });

  it('should include finish time when available', () => {
    const embed = buildFinishedEmbed(buildFinishedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for finished at field
    const finishedField = fields.find(f => f.name === 'Finished At');
    expect(finishedField).toBeDefined();
    expect(finishedField?.value).toContain('Aug 12, 2025'); // Should contain the formatted date
    expect(finishedField?.inline).toBe(true);
  });

  it('should include last changes information when available', () => {
    const embed = buildFinishedEmbed(buildFinishedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for last change field
    const changeField = fields.find(f => f.name === 'Last Change');
    expect(changeField).toBeDefined();
    expect(changeField?.value).toContain('telltale.team');
    expect(changeField?.value).toContain('Jun 23, 2025'); // Should contain the formatted date
    expect(changeField?.inline).toBe(false);
  });

  it('should handle multiple changes correctly', () => {
    const multipleChangesFixture: TeamCityWebhookEvent = {
      ...buildFinishedFixture,
      payload: {
        ...buildFinishedFixture.payload,
        lastChanges: {
          count: 3,
          change: [
            {
              id: 43,
              version: "67",
              username: "developer.one",
              date: "20250812T120000-0300",
              href: "/app/rest/changes/id:43",
              webUrl: "http://localhost:8111/change/43?personal=false"
            },
            {
              id: 42,
              version: "66",
              username: "developer.two",
              date: "20250812T110000-0300",
              href: "/app/rest/changes/id:42",
              webUrl: "http://localhost:8111/change/42?personal=false"
            },
            {
              id: 41,
              version: "65",
              username: "telltale.team",
              date: "20250623T174931-0300",
              href: "/app/rest/changes/id:41",
              webUrl: "http://localhost:8111/change/41?personal=false"
            }
          ]
        }
      }
    };

    const embed = buildFinishedEmbed(multipleChangesFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for changes field
    const changesField = fields.find(f => f.name === 'Changes');
    expect(changesField).toBeDefined();
    expect(changesField?.value).toBe('3 changes, latest by developer.one');
    expect(changesField?.inline).toBe(false);
  });

  it('should include clickable link to TeamCity build URL', () => {
    const embed = buildFinishedEmbed(buildFinishedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for TeamCity link field
    const linkField = fields.find(f => f.name === 'TeamCity Link');
    expect(linkField).toBeDefined();
    expect(linkField?.value).toBe('[View Build](http://localhost:8111/buildConfiguration/Wolf1Remaster_TelltaleTool/901)');
    expect(linkField?.inline).toBe(false);
  });

  it('should handle missing agent information gracefully', () => {
    const eventWithoutAgent: TeamCityWebhookEvent = {
      ...buildFinishedFixture,
      payload: {
        ...buildFinishedFixture.payload,
        agent: undefined
      }
    };

    const embed = buildFinishedEmbed(eventWithoutAgent);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Agent field should not be present
    const agentField = fields.find(f => f.name === 'Agent');
    expect(agentField).toBeUndefined();
  });

  it('should handle missing duration information gracefully', () => {
    const eventWithoutDates: TeamCityWebhookEvent = {
      ...buildFinishedFixture,
      payload: {
        ...buildFinishedFixture.payload,
        startDate: undefined,
        finishDate: undefined
      }
    };

    const embed = buildFinishedEmbed(eventWithoutDates);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Duration field should not be present
    const durationField = fields.find(f => f.name === 'Build Duration');
    expect(durationField).toBeUndefined();
  });

  it('should handle missing last changes information gracefully', () => {
    const eventWithoutChanges: TeamCityWebhookEvent = {
      ...buildFinishedFixture,
      payload: {
        ...buildFinishedFixture.payload,
        lastChanges: undefined
      }
    };

    const embed = buildFinishedEmbed(eventWithoutChanges);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Change fields should not be present
    const changeField = fields.find(f => f.name === 'Last Change');
    const changesField = fields.find(f => f.name === 'Changes');
    expect(changeField).toBeUndefined();
    expect(changesField).toBeUndefined();
  });

  it('should handle empty changes list gracefully', () => {
    const eventWithEmptyChanges: TeamCityWebhookEvent = {
      ...buildFinishedFixture,
      payload: {
        ...buildFinishedFixture.payload,
        lastChanges: {
          count: 0,
          change: []
        }
      }
    };

    const embed = buildFinishedEmbed(eventWithEmptyChanges);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Change fields should not be present
    const changeField = fields.find(f => f.name === 'Last Change');
    const changesField = fields.find(f => f.name === 'Changes');
    expect(changeField).toBeUndefined();
    expect(changesField).toBeUndefined();
  });

  it('should have a timestamp', () => {
    const embed = buildFinishedEmbed(buildFinishedFixture);
    const embedData = embed.toJSON();

    expect(embedData.timestamp).toBeDefined();
  });
});
// BUILD_INTERRUPTED fixture data
const buildInterruptedFixture: TeamCityWebhookEvent = {
  "eventType": "BUILD_INTERRUPTED",
  "payload": {
    "id": 327,
    "buildTypeId": "Wolf1Remaster_TelltaleTool",
    "number": "2009",
    "status": "UNKNOWN",
    "state": "running",
    "percentageComplete": 100,
    "href": "/app/rest/builds/id:327",
    "webUrl": "http://localhost:8111/buildConfiguration/Wolf1Remaster_TelltaleTool/327",
    "statusText": "Canceled",
    "buildType": {
      "id": "Wolf1Remaster_TelltaleTool",
      "name": "TelltaleTool",
      "description": "Telltale tool build process",
      "projectName": "Wolf1Remaster",
      "projectId": "Wolf1Remaster",
      "href": "/app/rest/buildTypes/id:Wolf1Remaster_TelltaleTool",
      "webUrl": "http://localhost:8111/buildConfiguration/Wolf1Remaster_TelltaleTool?mode=builds"
    },
    "running-info": {
      "percentageComplete": 100,
      "elapsedSeconds": 4766092,
      "estimatedTotalSeconds": 901,
      "currentStageText": "Build was interrupted. Artifacts will not be published for this build",
      "outdated": true,
      "probablyHanging": true
    },
    "canceledInfo": {
      "timestamp": "20250812T200028-0300",
      "text": "wronk sink\r\n",
      "user": {
        "username": "admin",
        "id": 1,
        "href": "/app/rest/users/id:1"
      }
    },
    "queuedDate": "20250618T160536-0300",
    "startDate": "20250618T160537-0300",
    "triggered": {
      "type": "user",
      "date": "20250618T160536-0300",
      "user": {
        "username": "admin",
        "id": 1,
        "href": "/app/rest/users/id:1"
      }
    },
    "lastChanges": {
      "count": 1,
      "change": [
        {
          "id": 11,
          "version": "29",
          "username": "telltale.team",
          "date": "20250618T135629-0300",
          "href": "/app/rest/changes/id:11",
          "webUrl": "http://localhost:8111/change/11?personal=false"
        }
      ]
    },
    "changes": {
      "href": "/app/rest/changes?locator=build:(id:327)"
    },
    "revisions": {
      "count": 1,
      "revision": [
        {
          "version": "29",
          "vcs-root-instance": {
            "id": "5",
            "vcs-root-id": "Wolf1Remaster_MainDepot",
            "name": "MainDepot",
            "href": "/app/rest/vcs-root-instances/id:5"
          }
        }
      ]
    },
    "agent": {
      "id": 1,
      "name": "Dead agent",
      "typeId": 1,
      "href": "/app/rest/agents/id:1",
      "webUrl": "http://localhost:8111/agentDetails.html?id=1&agentTypeId=1"
    },
    "artifacts": {
      "count": 0,
      "href": "/app/rest/builds/id:327/artifacts/children/"
    },
    "relatedIssues": {
      "href": "/app/rest/builds/id:327/relatedIssues"
    },
    "properties": {
      "count": 7,
      "property": [
        {
          "name": "assetBuildsLocation",
          "value": "C:\\AssetBuilds\\Fables\\PC",
          "inherited": true
        }
      ]
    },
    "statistics": {
      "href": "/app/rest/builds/id:327/statistics"
    },
    "vcsLabels": [],
    "customization": {}
  }
};

describe('buildInterruptedEmbed', () => {
  it('should create a BUILD_INTERRUPTED embed with correct title and color', () => {
    const embed = buildInterruptedEmbed(buildInterruptedFixture);
    const embedData = embed.toJSON();

    expect(embedData.title).toBe('⚠️ Build Interrupted: TelltaleTool');
    expect(embedData.color).toBe(0xF39C12); // Orange color
    expect(embedData.footer?.text).toBe('TeamCity Build Notification');
  });

  it('should include project name, build type, and build number prominently', () => {
    const embed = buildInterruptedEmbed(buildInterruptedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for project field
    const projectField = fields.find(f => f.name === 'Project');
    expect(projectField).toBeDefined();
    expect(projectField?.value).toBe('Wolf1Remaster');
    expect(projectField?.inline).toBe(true);

    // Check for build type field
    const buildTypeField = fields.find(f => f.name === 'Build Type');
    expect(buildTypeField).toBeDefined();
    expect(buildTypeField?.value).toBe('TelltaleTool');
    expect(buildTypeField?.inline).toBe(true);

    // Check for build number field
    const buildNumberField = fields.find(f => f.name === 'Build Number');
    expect(buildNumberField).toBeDefined();
    expect(buildNumberField?.value).toBe('#2009');
    expect(buildNumberField?.inline).toBe(true);
  });

  it('should display build status and agent information', () => {
    const embed = buildInterruptedEmbed(buildInterruptedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for status field
    const statusField = fields.find(f => f.name === 'Status');
    expect(statusField).toBeDefined();
    expect(statusField?.value).toBe('Canceled');
    expect(statusField?.inline).toBe(true);

    // Check for agent field
    const agentField = fields.find(f => f.name === 'Agent');
    expect(agentField).toBeDefined();
    expect(agentField?.value).toBe('Dead agent');
    expect(agentField?.inline).toBe(true);
  });

  it('should include cancellation reason and user who canceled', () => {
    const embed = buildInterruptedEmbed(buildInterruptedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for cancellation reason field
    const reasonField = fields.find(f => f.name === 'Cancellation Reason');
    expect(reasonField).toBeDefined();
    expect(reasonField?.value).toBe('wronk sink');
    expect(reasonField?.inline).toBe(false);

    // Check for canceled by field
    const canceledByField = fields.find(f => f.name === 'Canceled By');
    expect(canceledByField).toBeDefined();
    expect(canceledByField?.value).toBe('admin');
    expect(canceledByField?.inline).toBe(true);
  });

  /**
  it('should include cancellation timestamp', () => {
    const embed = buildInterruptedEmbed(buildInterruptedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for canceled at field
    const canceledAtField = fields.find(f => f.name === 'Canceled At');
    expect(canceledAtField).toBeDefined();
    expect(canceledAtField?.value).toContain('Aug 12, 2025'); // Should contain the formatted date
    expect(canceledAtField?.inline).toBe(true);
  });
  */

  it('should show elapsed time before interruption from running-info', () => {
    const embed = buildInterruptedEmbed(buildInterruptedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for elapsed time field
    const elapsedField = fields.find(f => f.name === 'Elapsed Time');
    expect(elapsedField).toBeDefined();
    // 4766092 seconds is a very large number, should be formatted properly
    expect(elapsedField?.value).toContain('h'); // Should contain hours
    expect(elapsedField?.inline).toBe(true);
  });

  it('should include current stage text from running-info when available', () => {
    const embed = buildInterruptedEmbed(buildInterruptedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for current stage field
    const stageField = fields.find(f => f.name === 'Current Stage');
    expect(stageField).toBeDefined();
    expect(stageField?.value).toBe('Build was interrupted. Artifacts will not be published for this build');
    expect(stageField?.inline).toBe(false);
  });

  it('should include start time when available', () => {
    const embed = buildInterruptedEmbed(buildInterruptedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for started at field
    const startedField = fields.find(f => f.name === 'Started At');
    expect(startedField).toBeDefined();
    expect(startedField?.value).toContain('Jun 18, 2025'); // Should contain the formatted date
    expect(startedField?.inline).toBe(true);
  });

  it('should include clickable link to TeamCity build URL', () => {
    const embed = buildInterruptedEmbed(buildInterruptedFixture);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Check for TeamCity link field
    const linkField = fields.find(f => f.name === 'TeamCity Link');
    expect(linkField).toBeDefined();
    expect(linkField?.value).toBe('[View Build](http://localhost:8111/buildConfiguration/Wolf1Remaster_TelltaleTool/327)');
    expect(linkField?.inline).toBe(false);
  });

  it('should handle missing agent information gracefully', () => {
    const eventWithoutAgent: TeamCityWebhookEvent = {
      ...buildInterruptedFixture,
      payload: {
        ...buildInterruptedFixture.payload,
        agent: undefined
      }
    };

    const embed = buildInterruptedEmbed(eventWithoutAgent);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Agent field should not be present
    const agentField = fields.find(f => f.name === 'Agent');
    expect(agentField).toBeUndefined();
  });

  it('should handle missing canceled info gracefully', () => {
    const eventWithoutCanceledInfo: TeamCityWebhookEvent = {
      ...buildInterruptedFixture,
      payload: {
        ...buildInterruptedFixture.payload,
        canceledInfo: undefined
      }
    };

    const embed = buildInterruptedEmbed(eventWithoutCanceledInfo);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Canceled info fields should not be present
    const reasonField = fields.find(f => f.name === 'Cancellation Reason');
    const canceledByField = fields.find(f => f.name === 'Canceled By');
    const canceledAtField = fields.find(f => f.name === 'Canceled At');
    
    expect(reasonField).toBeUndefined();
    expect(canceledByField).toBeUndefined();
    expect(canceledAtField).toBeUndefined();
  });
  /**
  it('should handle missing running-info gracefully', () => {
    const eventWithoutRunningInfo: TeamCityWebhookEvent = {
      ...buildInterruptedFixture,
      payload: {
        ...buildInterruptedFixture.payload,
        'running-info': undefined
      }
    };

    const embed = buildInterruptedEmbed(eventWithoutRunningInfo);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Current stage field should not be present
    const stageField = fields.find(f => f.name === 'Current Stage');
    expect(stageField).toBeUndefined();
    
    // Elapsed time should still be calculated from start to cancellation if canceledInfo is present
    const elapsedField = fields.find(f => f.name === 'Elapsed Time');
    expect(elapsedField).toBeDefined(); // Should still be present from duration calculation
  });
  */

  it('should handle empty cancellation reason gracefully', () => {
    const eventWithEmptyReason: TeamCityWebhookEvent = {
      ...buildInterruptedFixture,
      payload: {
        ...buildInterruptedFixture.payload,
        canceledInfo: {
          ...buildInterruptedFixture.payload.canceledInfo!,
          text: ""
        }
      }
    };

    const embed = buildInterruptedEmbed(eventWithEmptyReason);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Cancellation reason field should not be present when empty
    const reasonField = fields.find(f => f.name === 'Cancellation Reason');
    expect(reasonField).toBeUndefined();
    
    // But other canceled info should still be present
    const canceledByField = fields.find(f => f.name === 'Canceled By');
    expect(canceledByField).toBeDefined();
  });

  it('should handle empty current stage text gracefully', () => {
    const eventWithEmptyStage: TeamCityWebhookEvent = {
      ...buildInterruptedFixture,
      payload: {
        ...buildInterruptedFixture.payload,
        'running-info': {
          ...buildInterruptedFixture.payload['running-info']!,
          currentStageText: ""
        }
      }
    };

    const embed = buildInterruptedEmbed(eventWithEmptyStage);
    const embedData = embed.toJSON();

    const fields = embedData.fields || [];
    
    // Current stage field should not be present when empty
    const stageField = fields.find(f => f.name === 'Current Stage');
    expect(stageField).toBeUndefined();
  });

  it('should have a timestamp', () => {
    const embed = buildInterruptedEmbed(buildInterruptedFixture);
    const embedData = embed.toJSON();

    expect(embedData.timestamp).toBeDefined();
  });
});
describe('createTeamCityEmbed factory', () => {
  it('should route BUILD_STARTED events to buildStartedEmbed', () => {
    const embed = createTeamCityEmbed(buildStartedFixture);
    
    expect(embed).not.toBeNull();
    const embedData = embed!.toJSON();
    expect(embedData.title).toBe('🚀 Build Started: TelltaleTool');
    expect(embedData.color).toBe(0x3498DB); // Blue color
  });

  it('should route BUILD_FINISHED events to buildFinishedEmbed', () => {
    const embed = createTeamCityEmbed(buildFinishedFixture);
    
    expect(embed).not.toBeNull();
    const embedData = embed!.toJSON();
    expect(embedData.title).toBe('✅ Build Finished: TelltaleTool');
    expect(embedData.color).toBe(0x27AE60); // Green color
  });

  it('should route BUILD_INTERRUPTED events to buildInterruptedEmbed', () => {
    const embed = createTeamCityEmbed(buildInterruptedFixture);
    
    expect(embed).not.toBeNull();
    const embedData = embed!.toJSON();
    expect(embedData.title).toBe('⚠️ Build Interrupted: TelltaleTool');
    expect(embedData.color).toBe(0xF39C12); // Orange color
  });

  it('should return null for unknown event types', () => {
    const unknownEventFixture: TeamCityWebhookEvent = {
      ...buildStartedFixture,
      eventType: 'UNKNOWN_EVENT_TYPE'
    };

    const embed = createTeamCityEmbed(unknownEventFixture);
    expect(embed).toBeNull();
  });

  it('should handle malformed events gracefully and return null', () => {
    const malformedEvent = {
      eventType: 'BUILD_STARTED',
      payload: null // This will cause an error
    } as any;

    const embed = createTeamCityEmbed(malformedEvent);
    expect(embed).toBeNull();
  });

  it('should handle events with missing buildType gracefully', () => {
    const eventWithoutBuildType: TeamCityWebhookEvent = {
      ...buildStartedFixture,
      payload: {
        ...buildStartedFixture.payload,
        buildType: null as any
      }
    };

    const embed = createTeamCityEmbed(eventWithoutBuildType);
    expect(embed).toBeNull();
  });
});