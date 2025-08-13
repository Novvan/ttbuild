import 'dotenv/config';
import {
  Client,
  Events,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  ChatInputCommandInteraction,
  EmbedBuilder
} from 'discord.js';
import { CONFIG } from './config.js';

// Define an enum with 3 choices
enum BuildType {
  TELLTALE_TOOL = 'TELLTALE_TOOL',
  PC_BUILD = 'PC_BUILD',
  NX_BUILD = 'NX_BUILD'
}

// Create the slash command
const commands = [
  new SlashCommandBuilder()
    .setName('newbuild')
    .setDescription('Select a build project from available options')
    .addStringOption(option =>
      option
        .setName('project')
        .setDescription('Choose a build project')
        .setRequired(true)
        .addChoices(
          { name: 'Telltale Tool 🔨', value: BuildType.TELLTALE_TOOL },
          { name: 'PC Build 💻', value: BuildType.PC_BUILD },
          { name: 'NX Build 🕹️', value: BuildType.NX_BUILD }
        )
    )
];

export async function startBot() {
  const token = CONFIG.DISCORD_TOKEN!;
  const clientId = CONFIG.DISCORD_CLIENT_ID!;
  const guildId = CONFIG.DISCORD_GUILD_ID ?? null;

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  // Register slash commands
  const rest = new REST().setToken(token);

  try {
    console.log('Started refreshing application (/) commands.');

    if (guildId) {
      // Register commands for specific guild (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log('Successfully reloaded guild application (/) commands.');
    } else {
      // Register commands globally (takes up to 1 hour to propagate)
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log('Successfully reloaded global application (/) commands.');
    }
  } catch (error) {
    console.error('Error registering commands:', error);
  }

  client.on(Events.ClientReady, c => {
    console.log(`Bot ready as ${c.user.tag}`);
  });

  // Handle slash command interactions
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'newbuild') {
      await handleNewBuildCommand(interaction);
    }
  });

  await client.login(token);

  return client;
}

/**
 * Handle the newbuild slash command
 */
async function handleNewBuildCommand(interaction: ChatInputCommandInteraction) {
  const selectedStatus = interaction.options.getString('project') as BuildType;

  // Acknowledge the interaction immediately to prevent timeout
  await interaction.deferReply();

  // Variables to track build request result
  let buildSuccess = false;
  let errorMessage = '';

  // Debug: Log the base URL construction
  console.log('TEAMCITY_BASE_URL:', CONFIG.TEAMCITY_BASE_URL);

  // Handle URL construction properly - check if protocol is already included
  const baseUrl = CONFIG.TEAMCITY_BASE_URL.startsWith('http')
    ? `${CONFIG.TEAMCITY_BASE_URL}/action.html?`
    : `http://${CONFIG.TEAMCITY_BASE_URL}/action.html?`;
  const add2Queue = baseUrl + 'add2Queue=';

  console.log('Constructed URL base:', baseUrl);
  console.log('add2Queue URL:', add2Queue);

  const toolBuild = "Wolf1Remaster_TelltaleTool"
  const exeBuild = "Wolf1Remaster_BuildExecutable"

  switch (selectedStatus) {
    case BuildType.TELLTALE_TOOL:
      try {
        // Send post request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${add2Queue}${toolBuild}`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + CONFIG.TEAMCITY_TOKEN,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (response.ok) {
          buildSuccess = true;
        } else {
          errorMessage = `TeamCity responded with status ${response.status}: ${responseText}`;
        }
      } catch (error) {
        console.error('Error sending post request:', error);
        errorMessage = `Failed to connect to TeamCity: ${error instanceof Error ? error.message : String(error)}`;
      }
      break;
    case BuildType.PC_BUILD:
      try {
        // Send post request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${add2Queue}${exeBuild}`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + CONFIG.TEAMCITY_TOKEN,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (response.ok) {
          buildSuccess = true;
        } else {
          errorMessage = `TeamCity responded with status ${response.status}: ${responseText}`;
        }
      } catch (error) {
        console.error('Error sending post request:', error);
        errorMessage = `Failed to connect to TeamCity: ${error instanceof Error ? error.message : String(error)}`;
      }
      break;
    case BuildType.NX_BUILD:
      try {
        // Send post request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${add2Queue}${exeBuild}&name=visualStudioPlatform&value=NX64&name=bconfFile&value=nx.bconf&name=toolPlatform&value=NX`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + CONFIG.TEAMCITY_TOKEN,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (response.ok) {
          buildSuccess = true;
        } else {
          errorMessage = `TeamCity responded with status ${response.status}: ${responseText}`;
        }
      } catch (error) {
        console.error('Error sending post request:', error);
        errorMessage = `Failed to connect to TeamCity: ${error instanceof Error ? error.message : String(error)}`;
      }
      break;
    default:
      break;
  }

  // Create embed based on build result
  let embed: EmbedBuilder;

  if (buildSuccess) {
    embed = new EmbedBuilder()
      .setTitle('✅ Build Successfully Queued')
      .setDescription('The build has been successfully added to the TeamCity queue.')
      .setColor(0x27AE60) // Green
      .addFields(
        { name: 'Project', value: selectedStatus, inline: true },
        { name: 'Status', value: 'Queued', inline: true },
        { name: 'Timestamp', value: new Date().toLocaleString(), inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Build Status Command' });
  } else {
    embed = new EmbedBuilder()
      .setTitle('❌ Build Queue Failed')
      .setDescription('Failed to queue the build in TeamCity.')
      .setColor(0xE74C3C) // Red
      .addFields(
        { name: 'Project', value: selectedStatus, inline: true },
        { name: 'Status', value: 'Failed', inline: true },
        { name: 'Error', value: errorMessage || 'Unknown error occurred', inline: false },
        { name: 'Timestamp', value: new Date().toLocaleString(), inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Build Status Command' });
  }

  await interaction.editReply({ embeds: [embed] });
}
