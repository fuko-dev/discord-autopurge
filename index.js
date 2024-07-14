const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const targetChannelId = process.env.TARGET_CHANNEL_ID;
const keepMessageIds = process.env.KEEP_MESSAGE_IDS.split(',');
const roleIdToRemove = process.env.ROLE_ID_TO_REMOVE;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    try {
        const guild = client.guilds.cache.first();
        if (!guild) {
            console.error('Bot is not in any guilds.');
            process.exit(1);
        }

        // Remove the specified role from all members
        const members = await guild.members.fetch();
        const membersWithRole = members.filter(member => member.roles.cache.has(roleIdToRemove));
        console.log(`Found ${membersWithRole.size} members with the role.`);
        
        for (const member of membersWithRole.values()) {
            await member.roles.remove(roleIdToRemove);
            console.log(`Removed role from member: ${member.user.tag}`);
        }
        console.log(`Removed role from ${membersWithRole.size} members.`);

        // Purge messages
        const channel = await client.channels.fetch(targetChannelId);
        if (channel.isTextBased()) {
            const botMember = await channel.guild.members.fetch(client.user.id);
            const botPermissions = channel.permissionsFor(botMember);

            if (!botPermissions.has(PermissionsBitField.Flags.ManageMessages) || !botPermissions.has(PermissionsBitField.Flags.ReadMessageHistory)) {
                console.error('The bot does not have the necessary permissions to manage messages in this channel.');
                process.exit(1);
            }

            let messagesToDelete;
            do {
                const messages = await channel.messages.fetch({ limit: 100 });
                messagesToDelete = messages.filter(msg => !keepMessageIds.includes(msg.id));
                for (const msg of messagesToDelete.values()) {
                    await msg.delete();
                }
                console.log(`Deleted ${messagesToDelete.size} messages.`);
            } while (messagesToDelete.size > 0);
            console.log('Purge complete.');
        } else {
            console.error('The specified channel is not a text channel.');
        }
    } catch (error) {
        console.error('Error while processing:', error);
    } finally {
        client.destroy();
        process.exit(0);
    }
});

client.on('error', error => {
    console.error('The bot encountered an error:', error);
});

client.on('shardError', error => {
    console.error('A websocket connection encountered an error:', error);
});

client.login(token);
