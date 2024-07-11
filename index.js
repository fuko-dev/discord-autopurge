const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { token, targetChannelId, keepMessageId } = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    try {
        const channel = await client.channels.fetch(targetChannelId);
        if (channel.isTextBased()) {
            const botMember = await channel.guild.members.fetch(client.user.id);
            const botPermissions = channel.permissionsFor(botMember);

            if (!botPermissions.has(PermissionsBitField.Flags.ManageMessages) || !botPermissions.has(PermissionsBitField.Flags.ReadMessageHistory)) {
                console.error('The bot does not have the necessary permissions to manage messages in this channel.');
                return;
            }

            const messages = await channel.messages.fetch({ limit: 100 });
            const messagesToDelete = messages.filter(msg => msg.id !== keepMessageId);
            for (const msg of messagesToDelete.values()) {
                await msg.delete();
            }
            console.log('Purge complete.');
        } else {
            console.error('The specified channel is not a text channel.');
        }
    } catch (error) {
        console.error('Error while purging messages:', error);
    } finally {
        // Exit the process after the purge is complete
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
