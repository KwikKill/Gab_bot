const fs = require("fs");
const path = require('path');
const { MessageEmbed } = require('discord.js');
//const { oneLine } = require('common-tags');

module.exports = {
    name: 'nextclass',
	description: "Change l'edt pour la semaine précédante.",
	permission: "all",
	serverid: ["513776796211085342", "890915473363980308"],
    async run(interaction, client) {
        interaction.reply({content: "Reset de la semaine en cours...", ephemeral: true});
  }
}