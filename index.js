const discord = require("discord.js-selfbot-v13");
const config = require("./config.json");
const colors = require("colors");
let sniper_on = true;


const claimCooldowns = new Map();


const MAX_RETRIES = 3; 
const RETRY_DELAY = 1000; 
const RATE_LIMIT_DELAY = 5000; 

const client = new discord.Client({
    patchVoice: true,
    checkUpdate: false
});


/**
 * Retorna a data e hora do pr ximo reset de cooldown.
 *
 * O cooldown   resetado   1h31, 4h31, 7h31, 10h31, 13h31, 16h31, 19h31, 22h31 e 1h31 do dia seguinte.
 *
 * @returns {Date} Data e hora do pr ximo reset de cooldown.
 */
function getNextResetTime() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const resetTimes = [];

    for (let hour = 1; hour <= 22; hour += 3) {
        resetTimes.push(new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, 31));
    }
    resetTimes.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 1, 31));

    for (const resetTime of resetTimes) {
        if (resetTime > now) {
            return resetTime;
        }
    }
    return resetTimes[resetTimes.length - 1];
}

function isUserInCooldown(userId) {
    const lastClaim = claimCooldowns.get(userId);
    if (!lastClaim) return false;

    const nextReset = getNextResetTime();
    return lastClaim >= nextReset - 3 * 60 * 60 * 1000 && new Date() < nextReset;
}


function registerClaim(userId) {
    claimCooldowns.set(userId, new Date());
}


/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Executa uma a o com retries em caso de falha.
 *
 * Se a a o falhar,   executada novamente ap s um tempo de espera (RETRY_DELAY).
 * Se a a o falhar novamente,   executada novamente at   que o limite de tentativas seja atingido (MAX_RETRIES).
 * Se o limite de tentativas for atingido,   lan ada um erro.
 *
 * Caso a a o seja rate limitada,   aguardado o tempo de espera (RATE_LIMIT_DELAY) antes de tentar novamente.
 *
 * @param {Function} action Fun o a ser executada.
 * @param {String} actionName Nome da a o para logar erros.
 * @param {Number} [maxRetries=MAX_RETRIES] N mero m ximo de tentativas.
 * @returns {Boolean} true se a a o for executada com sucesso, false caso contr rio.
 */
/*******  b8fe9aa0-fd39-4a8e-981e-9e0833c6fe1a  *******/
async function executeWithRetry(action, actionName, maxRetries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await action();
            return true;
        } catch (err) {
            if (err.code === 429) { 
                console.warn(`⚠️ Rate limit atingido em ${actionName}. Aguardando ${RATE_LIMIT_DELAY}ms...`.yellow);
                await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
            } else if (err.code === 10008 || err.code === 10003) { 
                console.error(`❌ Erro em ${actionName}: Mensagem ou canal inválido.`.red);
                return false;
            } else {
                console.error(`❌ Tentativa ${attempt}/${maxRetries} falhou em ${actionName}: ${err.message}`.red);
                if (attempt < maxRetries) {
                    console.log(`⏳ Aguardando ${RETRY_DELAY}ms antes da próxima tentativa...`.gray);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                }
            }
            if (attempt === maxRetries) {
                console.error(`❌ Falha após ${maxRetries} tentativas em ${actionName}.`.red);
                return false;
            }
        }
    }
    return false;
}

client.on("ready", () => {
    console.log(`[+] Logado como ${client.user.username}`.green);
    if (sniper_on) {
        console.log(`[+] Sniper de kakera e waifus ativado`.yellow);
    } else {
        console.log(`[+] Sniper de kakera e waifus desativado`.red);
    }
    console.log(`[+] Servidor: ${client.guilds.cache.get(config.guildId).name}`.blue);
});

client.on("messageCreate", async (message) => {
    if (!sniper_on) return;
    if (message.author.id !== "432610292342587392") return;
    if (message.guild.id !== config.guildId) return;
    if (!message.mentions.has(client.user)) return;
    if (message.channel.id === "1102719983324237935") { //Altere para o ID do canal desejado(Canal invalido como um canal que n permite $wa $wg etc)
        console.log("⚠️ Canal inválido. Ignorando.".gray);
        return;
    }
    if (!message.components || message.components.length === 0) return;


    const userId = client.user.id;
    if (isUserInCooldown(userId)) {
        console.log(`⏳ Usuário em cooldown até ${getNextResetTime().toLocaleTimeString()}. Ignorando.`.gray);
        return;
    }

    for (const row of message.components) {
        for (const component of row.components) {
            if (component.type === 'BUTTON' && component.style !== 'LINK') {
                const success = await executeWithRetry(
                    () => message.clickButton(component.customId),
                    `clickButton (${component.customId})`
                );
                if (success) {
                    console.log(`✅ Instaclaim realizado na mensagem que mencionou o usuário.`.green);
                    registerClaim(userId);
                } else {
                    console.log(`❌ Falha ao realizar instaclaim após retries.`.red);
                }
                return;
            }
        }
    }

    console.log("❌ Nenhum botão de claim encontrado na mensagem que mencionou o usuário.".gray);
});

client.on("messageCreate", async (message) => {
    if (message.content === "!sniper") {
        try {
            await message.delete();
        } catch (err) {
            console.error(`❌ Erro ao deletar mensagem !sniper: ${err.message}`.red);
        }
        if (message.author.id !== client.user.id) return;
        if (sniper_on) {
            sniper_on = false;
            console.log(`[+] Sniper de kakera e waifus desativado`.red);
        } else {
            sniper_on = true;
            console.log(`[+] Sniper de kakera e waifus ativado`.green);
        }
        return;
    }

    if (!sniper_on) return;
    if (message.guild.id !== config.guildId) return;
    if (message.author.id !== "432610292342587392") return;
    if (!message.embeds?.length) return;

    const embed = message.embeds[0];
    const content = embed.description || "";
    const kakeraMatch = content.match(/\*\*(\d+)\*\*<:kakera:\d+>/);
    const kakeraValue = kakeraMatch ? parseInt(kakeraMatch[1], 10) : null;
    const isAlreadyClaimed = embed.footer?.text?.toLowerCase().includes("pertence a") ?? false;

    if (message.channel.id === "1102719983324237935") {
        console.log("⚠️ Canal inválido. Ignorando.".gray);
        return;
    }

    const charName = embed.author.name || "??";
    const anime = content.split("\n")[0]?.trim() || "??";
    console.log(`📥 Detectado: ${charName} (${anime})`.yellow);
    console.log(`💠 Valor kakera: ${kakeraValue ?? "?"}`);

    if (kakeraValue !== null && kakeraValue < config.minimunKakeraValue) {
        console.log(`⚠️ Valor abaixo do mínimo (${config.minimunKakeraValue}). Ignorando.`.gray);
        return;
    }

    if (isAlreadyClaimed) {
        console.log("⛔ Já foi claimada. Ignorando.".gray);
        return;
    }

    const userId = client.user.id;
    if (isUserInCooldown(userId)) {
        console.log(`⏳ Usuário em cooldown até ${getNextResetTime().toLocaleTimeString()}. Ignorando.`.gray);
        return;
    }

    const components = message.components;
    const hasValidButton = (
        Array.isArray(components) &&
        components.length > 0 &&
        components[0].components?.length > 0 &&
        components[0].components[0].customId
    );

    if (!hasValidButton) {
        console.log("❌ Botão de claim indisponível ou desativado.".gray);
        const success = await executeWithRetry(
            () => message.react("<:lunna_soda:1340699831617982524>"),
            "react"
        );
        if (success) {
            console.log("🥤 Reação adicionada com sucesso.".cyan);
            registerClaim(userId);
        } else {
            console.log("❌ Falha ao adicionar reação após retries.".red);
        }
        return;
    }

    const success = await executeWithRetry(
        () => message.clickButton(components[0].components[0].customId),
        `clickButton (${components[0].components[0].customId})`
    );
    if (success) {
        console.log(`✅ Claim feito para: ${charName} (${kakeraValue} kakera)`.green);
        registerClaim(userId);
    } else {
        console.log(`❌ Falha ao realizar claim após retries para: ${charName}`.red);
    }
});

process.on("uncaughtException", (err) => {
    console.error(`❌ Erro não capturado: ${err.message}`.red);
    console.error(err.stack);
});

process.on("unhandledRejection", (err) => {
    console.error(`❌ Promessa rejeitada não tratada: ${err.message || err}`.red);
});

client.login(config.token).catch((err) => {
    console.error(`❌ Erro ao logar: ${err.message}`.red);
});