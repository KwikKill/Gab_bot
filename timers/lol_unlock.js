module.exports = {
    name: 'lol_unlock',
    group: 'lol',
    onsetup: true,
    timer: 180000,
    description: "vérification du bon fonctionnement du bot lol",
    async run(client) {
        if (client.lol.last === []) {
            client.lol.last = client.lol.queue[0];
        } else {
            if (client.lol.last !== undefined && client.lol.last !== null && client.lol.last === client.lol.queue[0]) {
                throw new Error("[RANKUP] stucked on " + client.lol.last + ", auto-restarting");
            } else {
                client.lol.last = client.lol.queue[0];
            }
        }
    }
};