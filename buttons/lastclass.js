const fs = require("fs");
const path = require('path');
const { MessageEmbed } = require('discord.js');
//const { oneLine } = require('common-tags');

module.exports = {
    name: 'lastclass',
	description: "Change la classe pour la suivante.",
	permission: "all",
	serverid: ["513776796211085342", "890915473363980308"],
    async run(interaction, client) {
        interaction.reply({content: "Reset de la semaine en cours...", ephemeral: true});
  }
}