"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ara_join = void 0;
const voice_1 = require("@discordjs/voice");
const setting_1 = require("../setting");
const EachUsersVoice_1 = require("../EachUsersVoice");
async function ara_join(message, client) {
    if (message.content != "ara.join")
        return;
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
        if ((0, setting_1.settingRead)([
            message.member.voice.channel.id,
            "big_voice_troll_mute",
            "enable",
        ]) == "true") {
            const voiceReceivers = [];
            for (let member of message.member.voice.channel.members) {
                voiceReceivers.push(new EachUsersVoice_1.EachUsersVoice(client, member[1], connection.receiver));
            }
            (await msg).reply("#" +
                message.guild.channels.cache.get((0, setting_1.settingRead)([
                    message.member.voice.channel.id,
                    "big_voice_troll_mute",
                    "text_channel_id",
                ])).name +
                " の大音量荒らし対策が有効になっています");
        }
    }
}
exports.ara_join = ara_join;
//# sourceMappingURL=join.js.map