"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EachUsersVoice = void 0;
const voice_1 = require("@discordjs/voice");
const prism_media_1 = __importDefault(require("prism-media"));
const setting_1 = require("./setting");
const Utls_1 = require("./Utls");
const MessageUtl_1 = require("./MessageUtl");
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
        Decoder.on("data", async (chunk) => {
            let tmp = [];
            for (let i = 0; i < (chunk.length - 1) / 2; i += 2) {
                tmp.push(chunk.readInt16LE(i * 2));
            }
            this.voiceStackData.push(...tmp);
            while (this.voiceStackData.length > 10000) {
                this.voiceStackData.shift();
            }
            this.getLoudness();
            await this.checkLoudness();
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
    async checkLoudness() {
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
                    this.member.voice.setMute(true);
                    const warn_msg = await this.member.send([
                        "声が大きいため、スパムの可能性があるとしてサーバーミュートしました。",
                        "解除するには下のボタンを押してください。",
                    ].join("\n"));
                    (0, MessageUtl_1.AddButton)(warn_msg, this.client, "解除", (message) => {
                        this.member.voice.setMute(false);
                        message.reply("サーバーミュートを解除しました。");
                    });
                    const tmp = (0, setting_1.tcConnectedVcIs)(this.member.voice.channel);
                    if (tmp != null) {
                        tmp.send(this.member.toString() +
                            "さんが、過剰に大きい声で話したのでサーバーミュートしました。");
                    }
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