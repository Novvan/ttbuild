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
  TELLTALE_TOOL = 'TT_TOOL',
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

  // Create different responses based on the selected project
  let color: number;
  let title: string;
  let description: string;
  color = 0x27AE60; // Green
  title = '✅ Build Successfully queued';
  description = 'The build was sent for execution.';
  
  const baseUrl = `http://${CONFIG.TEAMCITY_USERNAME}:${CONFIG.TEAMCITY_PASSWORD}@${CONFIG.TEAMCITY_BASE_URL}/httpAuth/action.html?`
  const add2Queue = baseUrl + 'add2Queue=';

  const toolBuild = "Wolf1Remaster_TelltaleTool"
  const exeBuild = "Wolf1Remaster_BuildExecutable"

  switch (selectedStatus) {
    case BuildType.TELLTALE_TOOL:
      try {
        // Send post request
        const response = await fetch( add2Queue + toolBuild, {method: 'POST'});
        console.log(response);
      } catch (error) {
        console.error('Error sending post request:', error);
      }
      break;
    case BuildType.PC_BUILD:
      try {
        // Send post request
        const response = await fetch( add2Queue + exeBuild, {method: 'POST'});
        console.log(response);
      } catch (error) {
        console.error('Error sending post request:', error);
      }  
    break;
    case BuildType.NX_BUILD:
      try {
        // Send post request
        const response = await fetch( add2Queue + exeBuild +"&name=visualStudioPlatform&value=NX64&name=bconfFile&value=nx.bconf&name=toolPlatform&value=NX" , {method: 'POST'});
        console.log(response);
      } catch (error) {
        console.error('Error sending post request:', error);
      }
      break;
    default:
      break;
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .addFields(
      { name: 'Selected Status', value: selectedStatus, inline: true },
      { name: 'Timestamp', value: new Date().toLocaleString(), inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Build Status Command' });

  await interaction.reply({ embeds: [embed] });
}
