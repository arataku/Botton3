"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const setting_1 = require("./setting");
const join_1 = require("./cmd/join");
const big_voice_troll_mute_1 = require("./cmd/big_voice_troll_mute");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.Intents.FLAGS.GUILDS,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES,
    ],
});
const TOKEN = process.env.AraBot3Token;
client.on("ready", () => {
    console.log("Ready");
});
client.on("messageCreate", async (message) => {
    (0, join_1.ara_join)(message, client);
    (0, big_voice_troll_mute_1.ara_big_voice_troll_mute)(message, client);
    if (message.content === "ara.help") {
        await message.channel.send([
            "ara.join: ボイスチャンネルに接続します",
            "ara.big_voice_troll_mute: 荒らしの人物が現れた時にサーバーミュートにします",
            "!ping: pong!",
            "ara.help: このメッセージを表示します",
        ].join("\n"));
    }
});
client.on("voiceStateUpdate", async (oldState, newState) => {
    if (oldState.mute != newState.mute &&
        oldState.selfMute == newState.selfMute) {
        (0, setting_1.settingSet)([newState.guild.id, "manually_mute_set", newState.member.id], "true");
    }
});
client.login(TOKEN);
//# sourceMappingURL=main.js.map