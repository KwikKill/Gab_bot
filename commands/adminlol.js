//const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'adminlol',
    group: 'lol',
    description: "Commande lol",
    permission: "none",
    serverid: ["513776796211085342"],
    hidden: false,
    help: [
        {
            "name": "- __lol__ :",
            "value": "Test lol."
        },
    ],
    options: [
        {
            name: 'update',
            description: 'update all lol accounts',
            type: 'SUB_COMMAND_GROUP',
            options: [
                {
                    name: 'all',
                    description: 'update all lol accounts',
                    type: 'SUB_COMMAND'
                }
            ]
        }
    ],
    async run(message, client, interaction = undefined) {
        if (interaction !== undefined) {
            await interaction.deferReply();
            if (interaction.options.getSubcommandGroup() === "update") {
                if (interaction.options.getSubcommand() === "all") {
                    await interaction.editReply("Processing.");
                    await update(client, interaction);
                    await interaction.editReply("All lol accounts updated.");
                }
            }
        }
    },
    update
};

async function update(client) {
    const query = "SELECT DISTINCT puuid FROM summoners;";
    const result = await client.pg.query(query);
    for (let i = 0; i < result.rows.length; i++) {
        client.requests["updates"].push({ "puuid": result.rows[i].puuid, "id": result.rows[i].id, "matchs": [], "total": 0, "count": 0 });
    }
    await client.lol();
}