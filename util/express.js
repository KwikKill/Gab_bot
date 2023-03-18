const path = require('path');
const express = require('express');
const fs = require("fs");
const { request } = require('undici');
const cookieParser = require('cookie-parser');
const lol_api = require("./lol_api.js");
const { sseMiddleware } = require('express-sse-middleware');
const fetch = require('node-fetch');

const Roles = [
    "Serpentin",
    "Droide",
    "Double Face",
    "Super Héro",
    "Roméo",
    "Escroc"
];
const Description = {
    "Imposteur": "Doit absolument perdre la game sans se faire remarquer.",
    "Serpentin": "Doit gagner la game en ayant le plus de mort et de dégats de son équipe.",
    "Droide": "Doit gagner la game en suivant les instructions reçues en mp toutes les 5 minutes.",
    "Double Face": "Démarre la game gentil ou méchant, puis change de camp de manière aléatoire. Il doit gagner ou perdre la game en fonction de son allégeance au moment donné.",
    "Super Héro": "Doit absolument gagner la game, grosse pénalité en cas de défaite. Il doit avoir le plus de kills, d'assist et de dégats à la fin de la game. Il n'a pas de malus si il est démasqué.",
    "Roméo": "Roméo se lie à une Juliette choisie aléatoirement (allié ou ennemi), à chaque fois qu'elle meurt, il a une minute pour mettre fin à ses jours. Si Juliette est une adversaire il n'a pas le droit de la tuer, si c'est une allié il ne doit pas prendre de kill si elle participe au fight.",
    "Escroc": "L'escroc doit absolument gagner la game ET être voté en tant qu'imposteur, s'il obtient la majorité des votes les autres rôles ne gagnent pas les points de la victoire."
};
// funny things to do when playing lol
const Droide = [
    "On t'attaque ! Flash sur place !",
    "Dance pendant 15s sur la mid lane (plus loin que la T3)",
    "Il ne serait pas le temps de faire un drake ? Insister sur le fait de faire le drake ou de jouer autour",
    "Build un item qui n'a rien à voir avec le rôle du champion et dit que cela est une bonne idée",
    "Vole un camp à ton jungler. Si tu es jungler, tu doit smite le canon d'un allié",
    "N'utilise pas ton Q spell pendant 30s",
    "N'utilise pas ton W spell pendant 30s",
    "N'utilise pas ton E spell pendant 30s",
    "Tu te fais gank utilise ton R maintenant !",
    "Tu dois aller a l'opposer de la map a pied (Top to Bot ou Bot to TOP)",
    "Vend tes bottes et fais en des différentes",
    "inverse ton clavier et ta souris de main pendant 30s",
    "Tu es un guerrier, ne pas back avant ta prochaine mort",
    "Fait un ALT+F4",
    "Il faut backdoor ! Pose une ward dans la base adverse",
    "Tu ne dois plus utiliser ton clavier pour lancer des compétences pendant 1 minutes",
    "Tu dois donner des fausses informations ( faux SS, faux ping, Et cetera ",
    "AFK à la base pendant 20s ou jusqu'à ce qu'un allié le remarque",
    "Ignore ton midlaner pendant 30s",
    "Soft int le prochain teamfight et dit à ton équipe qu'ils sont pas foutu capable de toucher leurs sorts",
    "Change de type de ward",
    "Achete une potion au prochain back",
    "Vante toi d'avoir solo carry le prochain teamfight",
    "Ne prend pas de cs pendant 20s",
    "KS le prochain kill ou le blue/red",
    "Campe dans un bush ennemi pendant 45s ou jusqu'à ce qu'on ennemi te tue/tu le tue",
    "INT le prochain fight et accuse la connexion ( ping ta connexion )",
    "Raconte une blague pendant le prochain teamfight",
    "Tu dois rp le champion que tu joues pendant 1m",
    "N'achète que des potions au prochain back",
    "Lance une discussion sur le climat",
    "Deveniens le duo de quelqu'un et suit le pendant 1m",
    "Fait un podcast sur un champion présent dans la game au prochain teamfight",
    "Lance un débat sur une question existencielle",
    "Flash out le prochain sort qui se dirige vers toi (ciblé ou non)",
    "Au prochain teamfight, ne focus que ton vis à vis (top: focus top,...) avec interdiction de taper les autres ennemis",
    "Back à ta base à pied",
    "Demande à swap avec le toplaner (le midlaner si tu es top)",
    "Si tu le peut, pose deux wards au même endroit",
    "Demande le red ou le blue mais ne va pas le prendre",
    "Over react lors du prochain kill/mort",
    "Fait le nashor instant",
    "Éternue a cause du pollen",
    "Fait un call aram au mid",
    "Encense celui qui a le plus de mort",
    "Fait l'Hérald mais ne le pose pas !",
    "Demande a celui qui a le moins de KP de grouper",
    "Chante une chanson pendant 10/15s",
    "Crie lors de la prochaine mort"

];

const delay = ms => new Promise(res => setTimeout(res, ms));

// -------------- Express -----------------
module.exports = {
    register
};

function register(client) {
    const app = express();

    app.use(cookieParser());
    app.use(require('body-parser').urlencoded());
    app.use(sseMiddleware);

    app.use((err, req, res, next) => {
        if (err && err.code === 'ECONNABORTED') {
            res.status(400).end(); // Don't process this error any further to avoid its logging
        } else {
            next(err);
        }
    });

    app.get('/', function (req, res) {
        return res.render('../Site/index');
    });

    app.set('view engine', 'ejs');

    const indexFiles = fs.readdirSync('Site/');
    for (const file of indexFiles) {
        if (!fs.lstatSync(`Site/${file}`).isDirectory()) {
            app.get(`/${file.replace(".ejs", "")}`, function (req, res) {
                return res.render(`../Site/${file}`);
            });
        }
    }

    const cssFiles = fs.readdirSync('Site/css/');
    for (const file of cssFiles) {
        app.get(`/css/${file}`, function (req, res) {
            return res.sendFile(path.join(__dirname, `../Site/css/${file}`));
        });
    }

    const imagesFiles = fs.readdirSync('Site/images/');
    for (const file of imagesFiles) {
        app.get(`/images/${file}`, function (req, res) {
            return res.sendFile(path.join(__dirname, `../Site/images/${file}`));
        });
    }

    const jsFiles = fs.readdirSync('Site/js/');
    for (const file of jsFiles) {
        app.get(`/js/${file}`, function (req, res) {
            return res.sendFile(path.join(__dirname, `../Site/js/${file}`));
        });
    }

    const projetsFiles = fs.readdirSync('Site/projects/');
    for (const file of projetsFiles) {
        app.get(`/projects/${file.replace(".ejs", "")}`, function (req, res) {
            return res.render(`../Site/projects/${file}`);
        });
    }

    const postsFiles = fs.readdirSync('Site/posts/');
    for (const file of postsFiles) {
        app.get(`/posts/${file.replace(".ejs", "")}`, function (req, res) {
            return res.render(`../Site/posts/${file}`);
        });
    }

    app.get("/lol/", function (req, res) {
        return res.render("../Site/lol/index");
    });

    app.get("/lol/register", function (req, res) {
        return res.sendStatus(404);
        if (!req.cookies['token']) {
            return res.redirect("/lol/profile");
        }
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                console.log("[GET] /lol/register", data.username);
                client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [data.id], (err, result) => {
                    if (err) {
                        return res.redirect("/404");
                    }
                    if (result.rows.length === 0) {
                        return res.render("../Site/lol/register", { username: data.username, discordid: data.id });
                    }
                    return res.redirect("/lol/profile");
                });
            });
        });
    });

    app.post("/lol/register", function (req, res) {
        console.log("[POST] /lol/register", req.body);
        if (req.body.username && req.body.discordid) {
            client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [req.body.discordid], (err, result) => {
                if (err) {
                    console.error(err);
                    res.statusCode(500);
                    return res.render("../Site/lol/message", { text: "Internal server error" });
                }
                if (result.rows.length >= 3) {
                    return res.render("../Site/lol/message", { text: "You already have 3 accounts registered" });
                }
                let al = false;
                result.rows.forEach(element => {
                    if (element.username === req.body.username) {
                        al = true;
                    }
                });
                if (al) {
                    return res.render("../Site/lol/message", { text: "This account is already registered" });
                }
                client.commands.get("lol").add_summoner_manual(client, req.body.username, req.body.discordid);
                delay(1800).then(() => {
                    return res.redirect("/lol/queue");
                });
            });
        }
    });

    app.get("/lol/profile", function (req, res) {
        if (!req.cookies['token']) {
            return res.redirect("/login");
        }
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                console.log("[GET] /lol/profile", data.username);
                client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [data.id], (err, result) => {
                    if (err) {
                        return res.redirect("/404");
                    }
                    if (result.rows.length > 0) {
                        client.pg.query('SELECT * FROM matchs, summoners WHERE player = summoners.puuid AND discordid = $1', [data.id], (err2, result2) => {
                            return res.render('../Site/lol/profile', { summoners: result.rows, username: data.username, discriminator: data.discriminator, avatar: data.avatar, games: result2.rows, discordid: data.id });
                        });
                    } else {
                        return res.redirect("/lol/register");
                    }
                });
            });
        });
    });

    app.get("/lol/remove", function (req, res) {
        if (!req.query.pseudo) {
            return res.sendStatus(403);
        }
        if (!req.cookies['token']) {
            return res.sendStatus(403);
        }
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                console.log("[GET] /lol/remove", data.username);
                client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [data.id], (err, result) => {
                    if (err) {
                        return res.sendStatus(403);
                    }
                    if (result.rows.length > 0) {
                        client.pg.query("DELETE FROM matchs " +
                            "WHERE player IN (" +
                            "SELECT puuid " +
                            "FROM summoners " +
                            "WHERE username=$1 " +
                            "AND discordid=$2 " +
                            ");",
                            [req.query.pseudo, data.id],
                            (err2, result2) => {
                                if (err2) {
                                    console.error(err2);
                                    return res.sendStatus(403);
                                }
                                client.pg.query("DELETE FROM summoners " +
                                    "WHERE discordid=$1 " +
                                    "AND username=$2" +
                                    ";",
                                    [data.id, req.query.pseudo],
                                    (err3) => {
                                        if (err3) {
                                            console.error(err3);
                                            return res.sendStatus(403);
                                        }
                                        return res.render("../Site/lol/message", { text: "The account " + req.query.pseudo + " has been removed. You can go back to the profile page with the navbar." });

                                    }
                                );

                            }
                        );
                    } else {
                        return res.sendStatus(403);
                    }
                });
            });
        });

    });

    app.get("/lol/among", function (req, res) {
        if (!req.cookies['token']) {
            return res.redirect("/login");
        }
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                console.log("[GET] /lol/among", data.username);
                client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [data.id], (err, result) => {
                    if (err) {
                        return res.redirect("/404");
                    }
                    if (result.rows.length > 0) {
                        return res.render('../Site/lol/among', { discordclient: client, summoners: result.rows, username: data.username, discriminator: data.discriminator, avatar: data.avatar, discordid: data.id });
                    }
                    return res.redirect("/lol/register");
                });
            });
        });
    });

    app.get("/lol/among/join", function (req, res) {
        if (!req.query.game || client.amonglegends.get(req.query.game) === undefined || client.amonglegends.get(req.query.game).started) {
            return res.redirect("/404");
        }
        if (!req.cookies['token']) {
            return res.redirect("/login");
        }
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                console.log("[GET] /lol/among/join", data.username, req.query.game);
                client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [data.id], (err, result) => {
                    if (err) {
                        return res.redirect("/404");
                    }
                    if (result.rows.length > 0) {
                        if (client.amonglegends.get(req.query.game).players[data.id] === undefined) {
                            if (Object.keys(client.amonglegends.get(req.query.game).players).length < 5 && client.amonglegends.get(req.query.game).players[Object.keys(client.amonglegends.get(req.query.game).players)[0]].role === "") {
                                client.amonglegends.get(req.query.game).players[data.id] = {
                                    username: data.username,
                                    role: "",
                                    vote: undefined,
                                    score: 0,
                                    admin: false
                                };
                                return res.render('../Site/lol/among-game', { discordclient: client, summoners: result.rows, username: data.username, discriminator: data.discriminator, avatar: data.avatar, discordid: data.id, game: req.query.game });
                            }
                            return res.redirect("/lol/among");
                        }
                        return res.render('../Site/lol/among-game', { discordclient: client, summoners: result.rows, username: data.username, discriminator: data.discriminator, avatar: data.avatar, discordid: data.id, game: req.query.game });
                    }
                    return res.redirect("/lol/register");
                });
            });
        });
    });

    app.post('/lol/among/create', function (req, res) {
        if (!req.cookies['token']) {
            return res.redirect("/login");
        }
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                console.log("[POST] /lol/among/create", data.username, req.body);
                client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [data.id], (err, result) => {
                    if (err) {
                        return res.redirect("/404");
                    }
                    if (result.rows.length > 0) {
                        if (client.amonglegends.get(data.id) === undefined) {
                            let df;
                            if (Math.random() > 0.5) {
                                df = "victoire";
                            } else {
                                df = "defaite";
                            }
                            client.amonglegends.set(data.id, {
                                name: data.username + "'s Game",
                                started: false,
                                id: data.id,
                                finish: false,
                                public: false,
                                players: {
                                    [data.id]: {
                                        username: data.username,
                                        role: "",
                                        vote: undefined,
                                        score: 0,
                                        admin: true
                                    }
                                },
                                interval1: undefined,
                                interval2: undefined,
                                stats: {
                                    status: undefined,
                                    kills: undefined,
                                    assists: undefined,
                                    damages: undefined,
                                    deaths: undefined,
                                },
                                doubleface: df
                            });
                        }
                        return res.redirect("/lol/among/join?game=" + data.id);
                    }
                    return res.redirect("/lol/register");
                });
            });
        });
    });

    app.get('/lol/among/data', function (req, res) {
        if (!req.query.game || client.amonglegends.get(req.query.game) === undefined) {
            return res.send("404");
        }
        if (!req.cookies['token']) {
            return res.redirect("/login");
        }
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                //console.log("[GET] /lol/among/players", data.username, req.query.game);
                client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [data.id], (err, result) => {
                    if (err) {
                        return res.redirect("/404");
                    }
                    if (result.rows.length > 0) {
                        const sse = res.sse();

                        const intervalId = setInterval(() => {
                            if (client.amonglegends.get(req.query.game) !== undefined) {
                                if (client.amonglegends.get(req.query.game).players[data.id] !== undefined) {
                                    let returneddata = "";
                                    for (const x in client.amonglegends.get(req.query.game).players) {
                                        returneddata += "<tr>" +
                                            "<td>" +
                                            client.amonglegends.get(req.query.game).players[x].username +
                                            "</td>" +
                                            "<td>" +
                                            client.amonglegends.get(req.query.game).players[x].admin +
                                            "</td >";
                                        if (client.amonglegends.get(req.query.game).players[data.id].admin && client.amonglegends.get(req.query.game).started === false) {
                                            returneddata += "<td>" +
                                                "<a onclick=\"httpGetAsync('/lol/among/kick?game=" + req.query.game + "&player=" + x + "', () => {})\">❌</a>"
                                                + "</td>";
                                        } else {
                                            returneddata += "<td></td>";
                                        }
                                        returneddata += "</tr>";
                                    }
                                    sse.send({
                                        data: {
                                            roles: client.amonglegends.get(req.query.game).players[data.id].role === "" ? "false" : "true",
                                            started: client.amonglegends.get(req.query.game).started === false ? "false" : "true",
                                            players: returneddata,
                                            status: "200"
                                        },
                                    });
                                } else {
                                    sse.send({
                                        data: {
                                            status: "404"
                                        }
                                    });
                                    clearInterval(intervalId);
                                    return res.end();
                                }
                            } else {
                                sse.send({
                                    data: {
                                        status: "404"
                                    }
                                });
                                clearInterval(intervalId);
                                return res.end();
                            }
                        }, 3000);

                        req.on('close', () => {
                            clearInterval(intervalId);
                            res.end();
                        });
                    } else {
                        return res.send("404");
                    }
                });
            });
        });
    });

    app.get('/lol/among/kick', function (req, res) {
        if (!req.query.game && !req.query.player) {
            return res.sendStatus(403);
        }
        if (!req.cookies['token']) {
            return res.redirect("/login");
        }
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                console.log("[GET] /lol/among/kick", data.username, req.query);
                client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [data.id], (err, result) => {
                    if (err) {
                        return res.sendStatus(404);
                    }
                    if (result.rows.length > 0) {
                        if (client.amonglegends.get(req.query.game) !== undefined) {
                            if (client.amonglegends.get(req.query.game).players[data.id].admin === true) {
                                if (client.amonglegends.get(req.query.game).players[req.query.player] !== undefined && client.amonglegends.get(req.query.game).players[req.query.player].admin === false) {
                                    delete client.amonglegends.get(req.query.game).players[req.query.player];
                                }
                            }
                            return res.sendStatus(200);
                        }
                        return res.sendStatus(404);
                    }
                    return res.sendStatus(404);
                });
            });
        });
    });

    app.get('/lol/among/delete', function (req, res) {
        if (!req.query.game) {
            return res.redirect("/404");
        }
        if (!req.cookies['token']) {
            return res.redirect("/login");
        }
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                console.log("[GET] /lol/among/delete", data.username, req.query);
                client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [data.id], (err, result) => {
                    if (err) {
                        return res.redirect("/404");
                    }
                    if (result.rows.length > 0) {
                        if (client.amonglegends.get(req.query.game) !== undefined) {
                            if (client.amonglegends.get(req.query.game).players[data.id].admin === true) {
                                client.amonglegends.delete(req.query.game);
                                return res.redirect("/lol/among");
                            }
                            return res.redirect("/lol/among/join?game=" + data.id);
                        }
                        return res.redirect("/lol/among");
                    }
                    return res.redirect("/lol/register");
                });
            });
        });
    });

    app.get('/lol/among/roles', function (req, res) {
        if (!req.query.game) {
            return res.sendStatus(404);
        }
        if (!req.cookies['token']) {
            return res.redirect("/login");
        }
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                console.log("[GET] /lol/among/roles", data.username, req.query);
                client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [data.id], (err, result) => {
                    if (err) {
                        return res.sendStatus(404);
                    }
                    if (result.rows.length > 0) {
                        if (client.amonglegends.get(req.query.game) !== undefined) {
                            if (client.amonglegends.get(req.query.game).players[data.id].admin === true && client.amonglegends.get(req.query.game).started === false && client.amonglegends.get(req.query.game).finish === false) {
                                clearInterval(client.amonglegends.get(req.query.game).interval1);
                                clearInterval(client.amonglegends.get(req.query.game).interval2);

                                const roles = [];
                                roles.push("Imposteur");

                                shuffle(Roles);
                                for (let i = 0; i < Object.keys(client.amonglegends.get(req.query.game).players).length - 1; i++) {
                                    roles.push(Roles[i]);
                                }
                                shuffle(roles);

                                const pos = ["Top", "Jungle", "Mid", "ADC", "Support"];
                                const romeo = pos[Math.round(Math.random() * 4)];
                                let allie;
                                if (Math.random() > 0.5) {
                                    allie = "Allié";
                                } else {
                                    allie = "Ennemi";
                                }

                                let i = 0;
                                //console.log(client.amonglegends.get(req.query.game))
                                for (const player in client.amonglegends.get(req.query.game).players) {
                                    // assigne role
                                    const role = roles[i];
                                    client.amonglegends.get(req.query.game).players[player].role = role;
                                    // send a dm with the role and the description :
                                    client.users.fetch(player).then(user => {
                                        user.send("Vous êtes " + role + " : " + Description[role]);
                                        if (role === "Roméo") {
                                            user.send("Votre juliette est " + romeo + " " + allie + ".");
                                        } else if (role === "Double Face") {
                                            // start a cooldown, change double face side every 5 minutes and send a message to the player informing him
                                            const interval1 = setInterval(function (pl) {
                                                if (client.amonglegends.get(req.query.game).started === true) {
                                                    client.users.fetch(pl).then(user => {
                                                        if (client.amonglegends.get(req.query.game).doubleface === "victoire") {
                                                            client.amonglegends.get(req.query.game).doubleface = "defaite";
                                                            user.send("Vous devez maintenant perdre la partie.");
                                                        } else {
                                                            client.amonglegends.get(req.query.game).doubleface = "victoire";
                                                            user.send("Vous devez maintenant perdre la partie.");
                                                        }
                                                    });
                                                }
                                            }, 300000, player);
                                            client.amonglegends.get(req.query.game).interval1 = interval1;
                                            if (client.amonglegends.get(req.query.game).doubleface === "victoire") {
                                                user.send("Vous devez gagner la partie.");
                                            } else {
                                                user.send("Vous devez perdre la partie.");
                                            }
                                        } else if (role === "Droide") {
                                            const interval2 = setInterval(function (pl) {
                                                const rand = Math.round(Math.random() * 6);
                                                if (rand === 2) {
                                                    if (client.amonglegends.get(req.query.game).started === true) {
                                                        client.users.fetch(pl).then(user => {
                                                            const random = Math.round(Math.random() * (Droide.length - 1));
                                                            user.send(Droide[random]);
                                                        });
                                                    }
                                                }
                                            }, 60000, player);
                                            client.amonglegends.get(req.query.game).interval2 = interval2;
                                        }
                                    });
                                    i++;
                                }
                                return res.sendStatus(200);
                            }
                            return res.sendStatus(403);
                        }
                        return res.sendStatus(404);
                    }
                    return res.redirect("/lol/register");
                });
            });
        });
    });

    app.get('/lol/among/end', function (req, res) {
        if (!req.query.game) {
            return res.sendStatus(404);
        }
        if (!req.cookies['token']) {
            return res.redirect("/login");
        }
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                console.log("[GET] /lol/among/roles", data.username, req.query);
                client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [data.id], (err, result) => {
                    if (err) {
                        return res.sendStatus(404);
                    }
                    if (result.rows.length > 0) {
                        if (client.amonglegends.get(req.query.game) !== undefined) {
                            if (client.amonglegends.get(req.query.game).players[data.id].admin === true &&
                                client.amonglegends.get(req.query.game).started === true &&
                                client.amonglegends.get(req.query.game).finish === false &&
                                req.query.status &&
                                req.query.kills &&
                                req.query.assists &&
                                req.query.deaths) {
                                client.amonglegends.get(req.query.game).finish = true;
                                client.amonglegends.get(req.query.game).status = req.query.status;
                                client.amonglegends.get(req.query.game).kills = req.query.kills;
                                client.amonglegends.get(req.query.game).assists = req.query.assists;
                                client.amonglegends.get(req.query.game).deaths = req.query.deaths;
                                return res.sendStatus(200);
                            }
                            return res.sendStatus(403);
                        }
                        return res.sendStatus(404);
                    }
                    return res.redirect("/lol/register");
                });
            });
        });
    });

    app.get('/lol/among/start', function (req, res) {
        if (!req.query.game) {
            return res.sendStatus(403);
        }
        if (!req.cookies['token']) {
            return res.redirect("/login");
        }
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                console.log("[GET] /lol/among/start", data.username, req.query);
                client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [data.id], (err, result) => {
                    if (err) {
                        return res.sendStatus(404);
                    }
                    if (result.rows.length > 0) {
                        if (client.amonglegends.get(req.query.game).players[data.id].admin === true) {
                            client.amonglegends.get(req.query.game).started = true;
                            client.amonglegends.get(req.query.game).finish = false;
                        }
                        return res.sendStatus(200);
                    }
                    return res.sendStatus(404);
                });
            });
        });
    });

    /*app.get("/lol/summoner", function (req, res) {
        if (req.query.discordid) {
            client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [req.query.discordid], (err, result) => {
                if (err) { throw err; }
                if (result.rows.length > 0) {
                    return res.send(result.rows);
                }
                return res.sendStatus(400);
            });
        }
    });*/

    /*app.get("/lol/summoners", function (req, res) {
        client.pg.query(`SELECT * FROM summoners`, (err, result) => {
            if (err) { throw err; }
            if (result.rows.length > 0) {
                return res.send(result.rows);
            }
            return res.sendStatus(400);
        });
    });*/

    app.get("/lol/who", function (req, res) {
        lol_api.getCurrentPatch("EUW1", client).then(version => {
            lol_api.getChampsId("EUW1", client).then(champs => {
                return res.render("../Site/lol/who", { champs: champs, version: version['v'] });
            });
        });
    });

    app.get("/lol/matchs", function (req, res) {
        if (!req.cookies['token']) {
            return res.sendStatus(403);
        }
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                console.log("[GET] /lol/matchs", data.username, req.query);
                client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [data.id], (err, result) => {
                    if (err) {
                        return res.sendStatus(403);
                    }
                    if (result.rows.length > 0) {
                        let query = 'SELECT matchs.puuid, matchs.champion, matchs.result, matchs.gamemode, matchs.kill, matchs.deaths, matchs.assists, matchs.cs, matchs.total_kills FROM matchs, summoners WHERE matchs.player = summoners.puuid AND discordid = $1';
                        const values = [data.id];
                        if (req.query.last) {
                            query += ' AND matchs.puuid < $2';
                            values.push(req.query.last);
                        } else if (req.query.champion) {
                            query += ' AND matchs.champion = $2';
                            values.push(req.query.champion);
                        }
                        query += ' ORDER BY timestamp DESC LIMIT 10;';
                        client.pg.query(query, values, (err2, result2) => {
                            if (err2) {
                                throw err2;
                            }
                            lol_api.getCurrentPatch("EUW1", client).then(version => {
                                lol_api.getChampsId("EUW1", client).then(dict => {
                                    return res.render('../Site/lol/matchs', {
                                        username: data.username,
                                        discriminator: data.discriminator,
                                        avatar: data.avatar,
                                        games: result2.rows,
                                        version: version,
                                        dict: dict
                                    });
                                });
                            });
                        });
                    } else {
                        return res.sendStatus(403);
                    }
                });
            });
        });

    });

    app.get("/admin", function (req, res) {
        if (!req.cookies['token']) {
            return res.redirect("https://discord.com/api/oauth2/authorize?client_id=559371363035381777&redirect_uri=http%3A%2F%2Falbert.blaisot.org%3A8080%2Flogin&response_type=code&scope=identify");
        }
        console.log(req.cookies['token']);
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                if (data.id === client.owners[0]) {
                    //const data = fs.readFileSync('/var/log/syslog', 'utf8');
                    return res.render(`../Site/admin/admin`, { discordclient: client, log: data });
                }
                return res.redirect("/404");
            });
        });
    });

    app.get("/lol/queue", function (req, res) {
        if (!req.cookies['token']) {
            return res.render('../Site/lol/queue', { jsclient: client, data: undefined });
        }
        console.log("/lol/queue", req.cookies['token']);
        request('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + req.cookies['token']
            }
        }).then(tokenResponseData => {
            tokenResponseData.body.json().then(data => {
                console.log("[GET] /lol/queue", data.username);
                return res.render('../Site/lol/queue', { jsclient: client, data: data });
            });
        });
    });

    app.get("/lol/teams", async function (req, res) {
        if (req.query.team) {
            const result = await client.pg.query('SELECT discordid FROM team WHERE LOWER(team_name) = LOWER($1)', [req.query.team]);
            if (result.rows.length > 0) {
                const data = {
                    "players": [],
                    "matchs": {},
                    "stats": {}
                };
                for (let i = 0; i < result.rows.length; i++) {
                    data.players.push(result.rows[i].discordid);
                }
                let number = data.players.length;
                if (number > 5) {
                    number = 5;
                }
                // list matchs of the team
                let query = 'SELECT matchs.puuid, result, gamemode, total_kills, length, timestamp FROM matchs INNER JOIN summoners ON matchs.player = summoners.puuid INNER JOIN team ON summoners.discordid = team.discordid WHERE LOWER(team.team_name) = LOWER($1)';
                const values = [req.query.team, number];
                let i = 3;
                if (req.query.last) {
                    query += ' AND matchs.puuid > $' + i;
                    values.push(req.query.last);
                    i++;
                }
                if (req.query.gamemode) {
                    query += ' AND matchs.gamemode = $' + i;
                    values.push(req.query.gamemode);
                    i++;
                }
                if (req.query.remake === "false") {
                    query += " AND (matchs.result = 'Win' OR matchs.result = 'Lose')";
                }
                query += "  GROUP BY matchs.puuid, result, gamemode, total_kills, length, timestamp HAVING count(*) = $2 ORDER BY timestamp ASC;";
                const result2 = await client.pg.query(query, values);
                let nbmatchs = 0;
                let winrate = 0;
                for (const match of result2.rows) {
                    nbmatchs += 1;
                    if (match.result === "Win") {
                        winrate += 1;
                    }
                    data.matchs[match.puuid] = {
                        "result": match.result,
                        "gamemode": match.gamemode,
                        "total_kills": match.total_kills,
                        "length": parseInt(match.length),
                        "timestamp": match.timestamp,
                        "players": {}
                    };
                    for (let j = 0; j < data.players.length; j++) {
                        const result3 = await client.pg.query('SELECT champion, matchup, lane, kill, deaths, assists, cs, gold, wards, pinks, vision_score, total_damage, tanked_damage, neutral_objectives, first_gold, first_damages, first_tanked FROM matchs, summoners WHERE matchs.player = summoners.puuid AND summoners.discordid = $1 AND matchs.puuid = $2', [data.players[j], match.puuid]);
                        if (result3.rows.length === 0) {
                            //console.log(result2.rows[i].puuid);
                        } else {
                            data.matchs[match.puuid]["players"][data.players[j]] = {
                                "champion": result3.rows[0].champion,
                                "matchup": result3.rows[0].matchup,
                                "lane": result3.rows[0].lane,
                                "kill": result3.rows[0].kill,
                                "death": result3.rows[0].deaths,
                                "assist": result3.rows[0].assists,
                                "cs": result3.rows[0].cs,
                                "gold": result3.rows[0].gold,
                                "wards": result3.rows[0].wards,
                                "pinks": result3.rows[0].pinks,
                                "vision_score": result3.rows[0].vision_score,
                                "total_damage": result3.rows[0].total_damage,
                                "tanked_damage": result3.rows[0].tanked_damage,
                                "neutral_objectives": result3.rows[0].neutral_objectives,
                                "first_gold": result3.rows[0].first_gold,
                                "first_damages": result3.rows[0].first_damages,
                                "first_tanked": result3.rows[0].first_tanked

                            };
                            // stats of the player in the match
                            if (!data.stats[data.players[j]]) {
                                data.stats[data.players[j]] = {
                                    "winrate": 0,
                                    "nbmatchs": 0,
                                    "champion": {},
                                    "matchup": {},
                                    "lane": {},
                                    "kill": 0,
                                    "death": 0,
                                    "assist": 0,
                                    "cs": 0,
                                    "gold": 0,
                                    "wards": 0,
                                    "pinks": 0,
                                    "vision_score": 0,
                                    "total_damage": 0,
                                    "tanked_damage": 0,
                                    "neutral_objectives": 0,
                                    "first_gold": 0,
                                    "first_damages": 0,
                                    "first_tanked": 0
                                };
                            }
                            data.stats[data.players[j]].nbmatchs += 1;
                            if (data.matchs[match.puuid].result === "Win") {
                                data.stats[data.players[j]].winrate += 1;
                            }
                            if (!data.stats[data.players[j]].champion[result3.rows[0].champion]) {
                                data.stats[data.players[j]].champion[result3.rows[0].champion] = 0;
                            }
                            data.stats[data.players[j]].champion[result3.rows[0].champion] += 1;
                            if (!data.stats[data.players[j]].matchup[result3.rows[0].matchup]) {
                                data.stats[data.players[j]].matchup[result3.rows[0].matchup] = 0;
                            }
                            data.stats[data.players[j]].matchup[result3.rows[0].matchup] += 1;
                            if (!data.stats[data.players[j]].lane[result3.rows[0].lane]) {
                                data.stats[data.players[j]].lane[result3.rows[0].lane] = 0;
                            }
                            data.stats[data.players[j]].lane[result3.rows[0].lane] += 1;
                            data.stats[data.players[j]].kill += result3.rows[0].kill;
                            data.stats[data.players[j]].death += result3.rows[0].deaths;
                            data.stats[data.players[j]].assist += result3.rows[0].assists;
                            data.stats[data.players[j]].cs += result3.rows[0].cs;
                            data.stats[data.players[j]].gold += result3.rows[0].gold;
                            data.stats[data.players[j]].wards += result3.rows[0].wards;
                            data.stats[data.players[j]].pinks += result3.rows[0].pinks;
                            data.stats[data.players[j]].vision_score += result3.rows[0].vision_score;
                            data.stats[data.players[j]].total_damage += result3.rows[0].total_damage;
                            data.stats[data.players[j]].tanked_damage += result3.rows[0].tanked_damage;
                            data.stats[data.players[j]].neutral_objectives += result3.rows[0].neutral_objectives;
                            data.stats[data.players[j]].first_gold += result3.rows[0].first_gold;
                            data.stats[data.players[j]].first_damages += result3.rows[0].first_damages;
                            data.stats[data.players[j]].first_tanked += result3.rows[0].first_tanked;

                        }
                    }
                }
                data.stats.winrate = winrate / nbmatchs;
                for (let j = 0; j < data.players.length; j++) {
                    if (data.stats[data.players[j]]) {
                        data.stats[data.players[j]].winrate = data.stats[data.players[j]].winrate / data.stats[data.players[j]].nbmatchs;
                    }
                }
                data.stats.nbmatchs = nbmatchs;
                // wait 2s
                return res.send(data);
                /*client.pg.query('SELECT CAST(SUM(CASE WHEN result = \'Win\' THEN 1 ELSE 0 END) AS FLOAT)/ Count(*) as winrate, count(*) FROM matchs, summoners WHERE matchs.player = summoners.puuid AND matchs.puuid IN (SELECT matchs.puuid FROM matchs, summoners, team WHERE matchs.player = summoners.puuid AND summoners.discordid = team.discordid AND team.team_name = $1 GROUP BY matchs.puuid HAVING count(*) = $2) AND discordid = $3;', [req.query.team, data.players.length, data.players[0]], (err3, result3) => {
                    if (err3) {
                        throw err3;
                    }
                    for (let j = 0; j < data.players.length; j++) {
                        let nmgames = 0;
                        let kill = 0;
                        let death = 0;
                        let assist = 0;
                        let cs = 0;
                        let gold = 0;
                        let wards = 0;
                        let pinks = 0;
                        let vision_score = 0;
                        let total_damage = 0;
                        let tanked_damage = 0;
                        let neutral_objectives = 0;
                        let first_gold = 0;
                        let first_damages = 0;
                        let first_tanked = 0;
                        for (const i in data.matchs) {
                            if (data.matchs[i][data.players[j]]) {
                                kill += data.matchs[i][data.players[j]].kill;
                                death += data.matchs[i][data.players[j]].death;
                                assist += data.matchs[i][data.players[j]].assist;
                                cs += data.matchs[i][data.players[j]].cs / (data.matchs[i].length / 60);
                                gold += data.matchs[i][data.players[j]].gold / (data.matchs[i].length / 60);
                                wards += data.matchs[i][data.players[j]].wards;
                                pinks += data.matchs[i][data.players[j]].pinks;
                                vision_score += data.matchs[i][data.players[j]].vision_score / (data.matchs[i].length / 60);
                                total_damage += data.matchs[i][data.players[j]].total_damage / (data.matchs[i].length / 60);
                                tanked_damage += data.matchs[i][data.players[j]].tanked_damage / (data.matchs[i].length / 60);
                                neutral_objectives += data.matchs[i][data.players[j]].neutral_objectives;
                                first_gold += data.matchs[i][data.players[j]].first_gold;
                                first_damages += data.matchs[i][data.players[j]].first_damages;
                                first_tanked += data.matchs[i][data.players[j]].first_tanked;
                                nmgames++;
                            }
                        }
                        if (nmgames !== 0) {
                            data.stats[data.players[j]] = {
                                "kill": kill / nmgames,
                                "death": death / nmgames,
                                "assist": assist / nmgames,
                                "cs": cs / nmgames,
                                "gold": gold / nmgames,
                                "wards": wards / nmgames,
                                "pinks": pinks / nmgames,
                                "vision_score": vision_score / nmgames,
                                "total_damage": total_damage / nmgames,
                                "tanked_damage": tanked_damage / nmgames,
                                "neutral_objectives": neutral_objectives / nmgames,
                                "first_gold": first_gold / nmgames,
                                "first_damages": first_damages / nmgames,
                                "first_tanked": first_tanked / nmgames,
                                "nbmatchs": nmgames
                            };
                        }
                    }
                    return res.send(data);
                });*/
            }
            return res.sendStatus(404);

        }
        client.pg.query('SELECT DISTINCT team_name FROM team', (err, result) => {
            if (err) {
                throw err;
            }
            const data = [];
            for (let i = 0; i < result.rows.length; i++) {
                data.push(result.rows[i].team_name);
            }
            return res.send(data);
        });

    });

    app.get("/lol/add", function (req, res) {
        if (req.query.pass !== process.env.TAUNT_PASS) {
            res.sendStatus(404);
        }
        if (req.query.username && req.query.discordid && req.query.region) {
            client.pg.query('SELECT * FROM summoners WHERE discordid = $1', [req.query.discordid], (err, result) => {
                if (err) {
                    console.error(err);
                    res.sendStatus(500);
                }
                let al = false;
                result.rows.forEach(element => {
                    if (element.username === req.query.username) {
                        al = true;
                    }
                });
                if (al) {
                    return res.status(400);
                }
                client.commands.get("lol").add_summoner_manual(client, req.query.username, req.query.discordid, req.query.region);
                res.sendStatus(200);
            });
        }
    });

    app.get("/login", function (req, res) {
        const code = req.query.code;
        if (code) {
            try {
                request('https://discord.com/api/oauth2/token', {
                    method: 'POST',
                    body: new URLSearchParams({
                        client_id: process.env.DISCORD_CLIENT_ID,
                        client_secret: process.env.DISCORD_CLIENT_SECRET,
                        code,
                        grant_type: 'authorization_code',
                        redirect_uri: `http://albert.blaisot.org:8080/login`,
                        scope: 'identify',
                    }).toString(),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }).then(tokenResponseData => {
                    tokenResponseData.body.json().then(oauthData => {
                        res.cookie("token", oauthData.access_token, { maxAge: oauthData.expires_in * 1000, httpOnly: true });
                        return res.redirect("/lol/profile");
                    });
                });
            } catch (error) {
                console.error(error);
                return res.redirect("/404");
            }
        } else {
            if (!req.cookies['token']) {
                return res.redirect("https://discord.com/api/oauth2/authorize?client_id=559371363035381777&redirect_uri=http%3A%2F%2Falbert.blaisot.org%3A8080%2Flogin&response_type=code&scope=identify");
            }
            console.log(req.cookies['token']);
            return res.redirect("/lol/profile");
        }
    });

    app.get('*', function (req, res) {
        return res.render('../Site/404.ejs');
    });

    app.post('/contact', function (req, res) {
        if (req.body.mail && req.body.text) {
            if (req.body.topic === "Topic :") {
                client.channels.cache.get("1043317491113414728").send(`**${req.body.name}** (${req.body.mail}) ${req.body.tel} : \`\`\`\n${req.body.text}\n\`\`\``);
            } else {
                client.channels.cache.get("1043317491113414728").send(`**${req.body.name}** (${req.body.mail}) ${req.body.tel} ${req.body.topic} : \`\`\`\n${req.body.text}\n\`\`\``);
            }
        }
        return res.redirect("/");
    });

    app.listen(8080, () => {
        console.log("Express server started");
    });
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}