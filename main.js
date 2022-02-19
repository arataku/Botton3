"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
const prism_media_1 = __importDefault(require("prism-media"));
const setting_1 = require("./setting");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.Intents.FLAGS.GUILDS,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES,
    ],
});
const TOKEN = process.env.AraBot3Token;
async function sleep(waitTime) {
    return new Promise((resolve) => setTimeout(resolve, waitTime));
}
function average(array) {
    let sum = 0;
    for (let value of array) {
        sum += value;
    }
    return sum / array.length;
}
client.on("ready", () => {
    console.log("Ready");
});
client.on("messageCreate", async (message) => {
    if (message.author.bot)
        return;
    if (message.content.startsWith("!ping")) {
        message.channel.send("Pong!");
    }
    if (message.content === "ara.join") {
        if (!message.member.voice.channel) {
            message.channel.send("ボイスチャンネルに接続してください");
        }
        else {
            const connection = (0, voice_1.joinVoiceChannel)({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
                selfMute: false,
            });
            const player = (0, voice_1.createAudioPlayer)();
            const msg = message.channel.send("接続しました!");
            const resource = (0, voice_1.createAudioResource)("sound/lancer5.mp3");
            player.play(resource);
            if ((0, setting_1.read)([
                message.member.voice.channel.id,
                "big_voice_troll_mute",
                "enable",
            ]) == "true") {
                const voiceReceivers = [];
                for (let member of message.member.voice.channel.members) {
                    voiceReceivers.push(new EachUsersVoice(client, member[1], connection.receiver));
                }
                (await msg).reply("#" +
                    message.guild.channels.cache.get((0, setting_1.read)([
                        message.member.voice.channel.id,
                        "big_voice_troll_mute",
                        "text_channel_id",
                    ])).name +
                    " の大音量荒らし対策が有効になっています");
            }
        }
    }
    if (message.content === "ara.big_voice_troll_mute") {
        if (!message.member.permissions.has("MANAGE_CHANNELS")) {
            message.channel.send("チャンネル管理権限がないユーザーはこのコマンドは使用できません。");
        }
        else if (!message.member.voice.channel) {
            message.channel.send("ボイスチャンネルに接続してください");
        }
        else {
            const enable = "ara.big_voice_troll_mute" + new Date().getTime().toString();
            const btn = new discord_js_1.MessageButton()
                .setCustomId(enable)
                .setStyle("PRIMARY")
                .setLabel("Enable");
            const msg = await message.reply({
                content: "大音量で音声を流す迷惑な荒らしが現れた時に、" +
                    "サーバーミュートにして、DMでボタンを押さないと解除できないようにします。" +
                    "\n" +
                    "この設定は、いまあなたが接続してるVCと、このテキストチャンネルのみで適応されます。" +
                    "\n" +
                    "荒らしの人物が現れたログは、このチャンネルに表示されます。" +
                    "設定する場合は、下のボタンを押してください。",
                components: [new discord_js_1.MessageActionRow().addComponents(btn)],
            });
            client.on("interactionCreate", async (interaction) => {
                if (interaction.isButton()) {
                    if (interaction.customId == enable) {
                        (0, setting_1.set)([
                            message.member.voice.channel.id,
                            "big_voice_troll_mute",
                            "enable",
                        ], "true");
                        (0, setting_1.set)([
                            message.member.voice.channel.id,
                            "big_voice_troll_mute",
                            "text_channel_id",
                        ], message.channel.id);
                        msg.reply("設定しました。");
                        interaction.update({
                            components: [
                                new discord_js_1.MessageActionRow().addComponents(btn.setDisabled()),
                            ],
                        });
                    }
                }
            });
        }
    }
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
        (0, setting_1.set)([newState.guild.id, "manually_mute_set", newState.member.id], "true");
    }
});
class EachUsersVoice {
    constructor(client, member, receiver) {
        this.client = client;
        this.member = member;
        this.receiver = receiver;
        this.loudness = 0;
        this.voiceStackData = [];
        this.warnPoint = 0;
        const audioReceiveStream = this.receiver.subscribe(this.member.id, {
            end: {
                behavior: voice_1.EndBehaviorType.Manual,
            },
        });
        const Decoder = new prism_media_1.default.opus.Decoder({
            rate: 48000,
            channels: 2,
            frameSize: 960,
        });
        audioReceiveStream.on("data", (chunk) => {
            Decoder.write(chunk);
        });
        Decoder.on("data", (chunk) => {
            let tmp = [];
            for (let i = 0; i < (chunk.length - 1) / 2; i += 2) {
                tmp.push(chunk.readInt16LE(i * 2));
            }
            this.voiceStackData.push(...tmp);
            while (this.voiceStackData.length > 10000) {
                this.voiceStackData.shift();
            }
            this.getLoudness();
            this.checkLoudness();
        });
    }
    getLoudness() {
        let tmp = [];
        for (let value of this.voiceStackData) {
            tmp.push(Math.abs(value));
        }
        this.loudness = average(tmp);
        return this.loudness;
    }
    checkLoudness() {
        if (this.loudness > 10000) {
            this.warnPoint++;
            if (this.warnPoint > 100) {
                this.warnPoint = 0;
                console.log((0, setting_1.read)([this.member.guild.id, "manually_mute_set", this.member.id]));
                if (!(this.member.voice.mute ||
                    (0, setting_1.read)([this.member.guild.id, "manually_mute_set", this.member.id]) ==
                        "true")) {
                    const unmuteId = "unmute" +
                        this.member.id.toString() +
                        new Date().getTime().toString();
                    const btn = new discord_js_1.MessageButton()
                        .setCustomId(unmuteId)
                        .setStyle("PRIMARY")
                        .setLabel("サーバーミュート解除");
                    this.member.voice.setMute(true);
                    const warn_msg = this.member.send({
                        content: "声が大きいため、スパムの可能性があるとしてサーバーミュートしました。解除するには下のボタンを押してください。",
                        components: [new discord_js_1.MessageActionRow().addComponents(btn)],
                    });
                    let tmp = this.member.client.channels.cache.get((0, setting_1.read)([
                        this.member.voice.channel.id,
                        "big_voice_troll_mute",
                        "text_channel_id",
                    ]));
                    if (tmp.type == "GUILD_TEXT") {
                        tmp.send(this.member.toString() +
                            "さんが、スパムもしくは過剰に大きい声で話したのでサーバーミュートされました。");
                    }
                    this.client.on("interactionCreate", async (interaction) => {
                        if (interaction.isButton()) {
                            if (interaction.customId === unmuteId) {
                                console.log("interaction:" + interaction.customId);
                                this.member.voice.setMute(false);
                                interaction.update({
                                    components: [
                                        new discord_js_1.MessageActionRow().addComponents(btn.setDisabled()),
                                    ],
                                });
                                (await warn_msg).reply("サーバーミュートを解除しました。");
                            }
                        }
                    });
                }
            }
        }
        else if (this.warnPoint > 0) {
            this.warnPoint--;
        }
    }
}
client.login(TOKEN);
//# sourceMappingURL=main.js.map