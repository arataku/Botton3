"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EachUsersVoice = void 0;
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
const prism_media_1 = __importDefault(require("prism-media"));
const setting_1 = require("./setting");
const Utls_1 = require("./Utls");
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
        this.loudness = (0, Utls_1.average)(tmp);
        return this.loudness;
    }
    checkLoudness() {
        if (this.loudness > 10000) {
            this.warnPoint++;
            if (this.warnPoint > 100) {
                this.warnPoint = 0;
                console.log((0, setting_1.settingRead)([
                    this.member.guild.id,
                    "manually_mute_set",
                    this.member.id,
                ]));
                if (!(this.member.voice.mute ||
                    (0, setting_1.settingRead)([
                        this.member.guild.id,
                        "manually_mute_set",
                        this.member.id,
                    ]) == "true")) {
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
                    let tmp = this.member.client.channels.cache.get((0, setting_1.settingRead)([
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
exports.EachUsersVoice = EachUsersVoice;
//# sourceMappingURL=EachUsersVoice.js.map