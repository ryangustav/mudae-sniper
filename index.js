const discord = require("discord.js-selfbot-v13");
const config = require("./config.json");
const colors = require("colors");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const client = new discord.Client({ patchVoice: true, checkUpdate: false });

let sniper_on = true;
let only_wishlist = false;
let catch_other_rolls = true;
let lastKakeraValue = 0;
const claimCooldowns = new Map();
let ignoreCooldown = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getNextResetTime() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const resetTimes = [];
    for (let hour = 2; hour <= 22; hour += 3) {
        resetTimes.push(new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, 31));
    }
    resetTimes.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 1, 31));
    for (const resetTime of resetTimes) {
        if (resetTime > now) return resetTime;
    }
    return resetTimes[resetTimes.length - 1];
}

function webhookSend(character, value) {
    const data = { content: `❤ ${client.user} capturou - ${character} que vale ${value} kakeras` };
    axios.post(config.webhookUrl, data, { headers: { 'Content-Type': 'application/json' } })
        .then(() => console.log(`✅ Webhook enviado`.green))
        .catch(() => {});
}

async function executeWithRetry(action, actionName) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await action();
            return true;
        } catch (err) {
            if (err.code === 429) await sleep(5000);
            else if (attempt < 3) await sleep(1000);
            else return false;
        }
    }
}

async function claimButton(message, buttonId, charName, kakeraValue) {
    const delay = randomDelay(1000, 3000);
    console.log(`🕒 Aguardando ${delay}ms antes de clicar`.gray);
    await sleep(delay);

    const success = await executeWithRetry(() => message.clickButton(buttonId), `clickButton (${buttonId})`);
    if (success) {
        console.log(`✅ Claim feito para: ${charName} (${kakeraValue} kakera)`.green);
        webhookSend(charName, kakeraValue);
        registerClaim(client.user.id);
    } else {
        console.log(`❌ Falha ao clicar no botão`.red);
    }
}


async function rollNow() {
    const { guildId, rollChannel, maxRollsPerReset } = config;
    const channel = client.channels.cache.get(rollChannel);
    if (!channel) return;

    const maxRolls = maxRollsPerReset || 1;
    for (let i = 0; i < maxRolls; i++) {
        await channel.send("$wa");
        console.log(`🎲 Roll imediato enviado (${i + 1}/${maxRolls}) no servidor ${guildId}`.cyan);
        await sleep(Math.floor(Math.random() * (3 - 1 + 1)) + 1 * 1000);
    }
}

function getNextResetTime() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const resetTimes = [];
    for (let hour = 0; hour < 24; hour++) {
        resetTimes.push(new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, 31));
    }


    for (let hour = 0; hour < 24; hour += 3) {
        resetTimes.push(new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, 31));
    }

    resetTimes.sort((a, b) => a - b);
    
    if (resetTimes[0] < now) {
        resetTimes[0] = new Date(resetTimes[0].getFullYear(), resetTimes[0].getMonth(), resetTimes[0].getDate() + 1, 1, 31);
    }

    for (const resetTime of resetTimes) {
        if (resetTime > now) return resetTime;
    }

    return resetTimes[resetTimes.length - 1];
}


function isUserInCooldown(userId) {
    if (ignoreCooldown) return false;
    const lastClaim = claimCooldowns.get(userId);
    if (!lastClaim) return false;

    // Verifica se o usuário está em cooldown de claim (3h)
    const nextClaimReset = new Date(lastClaim);
    nextClaimReset.setHours(nextClaimReset.getHours() + 3);  // Adiciona 3 horas ao último claim
    if (new Date() < nextClaimReset) {
        console.log("🚫 Em cooldown de claim, aguardando próximo reset de claim.");
        return true;  // Impede claim se estiver dentro do cooldown de 3h
    }

    return false;
}

function registerClaim(userId) {
    claimCooldowns.set(userId, new Date());  // Marca o horário do claim
    ignoreCooldown = false;
}

async function rollWaifus() {
    while (true) {
        const nextReset = getNextResetTime();
        const now = new Date();

        // Verifica se o usuário está em cooldown de claim
        if (isUserInCooldown(client.user.id)) {
            console.log("⏳ Em cooldown de claim, aguardando próximo reset.".cyan);
            const claimCooldownTime = claimCooldowns.get(client.user.id) + (3 * 60 * 60 * 1000) - now;
            await sleep(claimCooldownTime);  // Aguardar o tempo restante do cooldown de claim
            continue;
        }

        const delay = randomDelay(1 * 60 * 1000, 30 * 60 * 1000); // Delay entre os rolls
        const waitTime = nextReset - now + delay; // Calcula o tempo até o próximo reset
        const delayMinutes = (delay / 60000).toFixed(2);

        console.log(`⏳ Aguardando até ${nextReset.toLocaleTimeString()} + ${delayMinutes} minutos`.cyan);
        await sleep(waitTime);

        const { rollChannel, maxRollsPerReset } = config;
        const channel = client.channels.cache.get(rollChannel);
        if (!channel) continue;

        const maxRolls = maxRollsPerReset || 1;
        let rolled = 0;
        let waifuClaimed = false;

        while (rolled < maxRolls) {
            const message = await channel.send("$wa");
            console.log(`🎲 Roll enviado (${rolled + 1}/${maxRolls})`.magenta);
            rolled++;

            await sleep(randomDelay(1000, 3000));

            const fetched = await channel.messages.fetch({ after: message.id, limit: 5 }).catch(() => null);
            if (fetched) {
                const claimed = fetched.find(msg =>
                    msg.author.id === "432610292342587392" &&
                    msg.mentions.users.has(client.user.id) &&
                    /claimed/i.test(msg.content)
                );
                if (claimed) {
                    console.log("💘 Waifu reclamada com sucesso!".green);
                    waifuClaimed = true;
                    registerClaim(client.user.id);
                    break;
                }
            }
        }

        if (!waifuClaimed) {
            console.log("😔 Nenhuma waifu reclamada. Tentando no próximo reset.".yellow);
        } else {
            console.log("✅ Aguardando próximo reset para novos rolls.".cyan);
        }
    }
}


client.on("ready", () => {
    console.log(`[+] Logado como ${client.user.username}`.green);
    console.log(`[+] Servidor: ${client.guilds.cache.get(config.guildId).name}`.green);
    console.log(`[+] Canal rolls : ${client.channels.cache.get(config.rollChannel).name}`.green);
    rollWaifus();
});

client.on("messageCreate", async (message) => {
    if (!sniper_on) return;
    const serverConfig = config[message.guild?.id];
    if (!serverConfig) return;
    if (message.author.id !== "432610292342587392") return;
    if (message.channel.id !== serverConfig.rollChannel) return;
    if (message.channel.id === serverConfig.blockChannel) return
    if (!message.embeds?.length) return;

    const embed = message.embeds[0];
    const content = embed.description || "";
    const kakeraMatch = content.match(/\*\*(\d+)\*\*<:kakera:\d+>/);
    const kakeraValue = kakeraMatch ? parseInt(kakeraMatch[1]) : null;
    const isAlreadyClaimed = embed.footer?.text?.toLowerCase().includes("pertence a") ?? false;
    const button = components[0].components[0];
    const charName = embed.author?.name || "???";
    console.log(`📥 Detectado: ${charName} (${anime})`.yellow);
    console.log(`💠 Valor kakera: ${kakeraValue ?? "?"}`);

    if (kakeraValue !== null && kakeraValue < serverConfig.minimum_kakera_value) return console.log(`⚠️ Valor abaixo do mínimo (${kakeraValue} < ${config.minimunKakeraValue}). Ignorando.`.gray);;
    if (isAlreadyClaimed) return;

    const components = message.components;
    if (!components?.length || !components[0].components?.length) return;


    if (!message.mentions.has(client.user) && !catch_other_rolls) return;
    if (isUserInCooldown(client.user.id)) return;

    await claimButton(message, button.customId, charName, kakeraValue);
});

client.on("messageCreate", async (message) => {
    if (message.author.id !== client.user.id) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.split(/\s+/);
    const command = args.shift();

    if (command === '!configserver') {
        const [guildId, rollChannel, minimunKakeraValue, blockChannel, maxRollsPerReset] = args;
        config[guildId] = {
            rollChannel,
            minimum_kakera_value: parseInt(minimunKakeraValue),
            blockChannel,
            maxRollsPerReset: parseInt(maxRollsPerReset) || 10
        };
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2), 'utf8');
        message.reply('Configuração salva!');
    }

    if (command === "!togglecooldown") {
        ignoreCooldown = !ignoreCooldown;
        console.log(`[+] Ignorando cooldown de claim: ${ignoreCooldown}`.yellow);
        message.reply(`Ignorando cooldown de claim: ${ignoreCooldown ? "ativado" : "desativado"}`);
    }

    if (command === "!rollnow") {
        await rollNow();
        message.reply("Roll imediato enviado!");
    }

    if (message.content === "!catch_other_rolls") {
        catch_other_rolls = !catch_other_rolls;
        console.log(`[+] Catch em outros rolls ${catch_other_rolls ? "ativado" : "desativado"}`.yellow);
        return message.delete().catch(() => {});
    }

    if (message.content === "!sniper") {
        sniper_on = !sniper_on;
        console.log(`[+] Sniper ${sniper_on ? "ativado" : "desativado"}`.yellow);
        return message.delete().catch(() => {});
    }

    if (message.content === "!onlywishlist") {
        only_wishlist = !only_wishlist;
        console.log(`[+] Only wishlist ${only_wishlist ? "ativado" : "desativado"}`.yellow);
        return message.delete().catch(() => {});
    }
});

client.login(config.token);
