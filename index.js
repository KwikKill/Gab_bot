const { Client, RichEmbed } = require('discord.js');

const client = new Client();

var prefix = ("*")

client.on('ready', () => {
    console.log('Le bot est démarré !');
		client.user.setActivity("aduler Loomy")
});

client.on('message', message => {
    if (message.author.bot) return undefined;
    if (!message.content.startsWith(prefix)) return undefined;


    if (message.content === prefix + 'ping') {
			message.channel.sendMessage("pong");
			return;

  	}

		if(message.content === prefix + 'help') {

      const help = require('./command/fun/help.js');
      help(message);

			return;

		}

    if(message.content === prefix + 'info') {

      const info = require('./command/fun/info.js');
			info(message);

			return;

		}

		if (message.content.startsWith(prefix + 'kick')) {

      const kick = require('./command/moderation/kick.js');
			kick(message);

			return;
		}

		if (message.content.startsWith(prefix + 'ban')) {

      const ban = require('./command/moderation/ban.js');
			ban(message);

			return;
		}

    var regexpunban = new RegExp('^\\' + prefix + 'unban\\s+([^\\s]*)$');
		if (regexpunban.test(message.content)) {

      var id = message.content.replace(regexpunban, "$1");

      const unban = require('./command/moderation/unban.js');
			unban(message, id);

			return;
		}

		var regexp = new RegExp('^\\' + prefix + 'apex\\s+stats\\s+([^\\s]*)\\s+([^\\s]*)$');
		if(regexp.test(message.content)) {

			var user = message.content.replace(regexp, "$1");
			var platform = message.content.replace(regexp, "$2");

      const stats = require('./command/apex/stats.js');
			stats(message,user,platform);

			//curl https://public-api.tracker.gg/apex/v1/standard/profile/5/GAb_3511 -H "TRN-API-KEY: 29dd5302-c7ea-4c2c-8b5e-b7858844d8b4"

      return;
		}

		var regexp2 = new RegExp('^\\' + prefix + 'apex\\s+legend\\s+([^\\s]*)$');
		if(regexp2.test(message.content)) {
			var legend = message.content.replace(regexp2, "$1");

      const legends = require('./command/apex/legend.js');
      legends(message,legend);


		}
});

/*client.on('guildMemberAdd', member => {
  const channel = member.guild.channels.find(ch => ch.name === 'qui-vous-a-inviter-❔');
  if (!channel) return;
  channel.send(`Bienvenue, plébéien ${member}`);
});

client.on('channelCreate', chanel => {
	var log = chanel.guild.channels.find(channel => channel.name === "log");

	const embed = new RichEmbed()
		.setTitle('log :')
		.setColor(0xffe402)
		.setDescription(
			"salon créé : " +
			chanel.name
		);

	log.send(embed);
});

client.on('channelDelete', chanel => {
	var log = chanel.guild.channels.find(channel => channel.name === "log");
	const embed = new RichEmbed()
		.setTitle('log :')
		.setColor(0xffe402)
		.setDescription(
			"salon supprimé : " +
			chanel.name
		);

	log.send(embed);
});

client.on('emojiCreate', emoji => {
	var log = emoji.guild.channels.find(channel => channel.name === "log");

	const embed = new RichEmbed()
		.setTitle('log :')
		.setColor(0xffe402)
		.setThumbnail(emoji.url)
		.setDescription(
			"émoji créé : " +
			emoji.name
		);

	log.send(embed);
});

client.on('emojiDelete', emoji => {
	var log = emoji.guild.channels.find(channel => channel.name === "log");

	const embed = new RichEmbed()
		.setTitle('log :')
		.setColor(0xffe402)
		.setThumbnail(emoji.url)
		.setDescription(
			"émoji supprimé : " +
			emoji.name
		);

	log.send(embed);
});*/

client.login(process.env.DISCORD_TOKEN);
