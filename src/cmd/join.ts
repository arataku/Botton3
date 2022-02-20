import { Client, Message } from "discord.js";
import {
	joinVoiceChannel,
	createAudioResource,
	createAudioPlayer,
} from "@discordjs/voice";
import { settingRead, tcConnectedVcIs } from "../setting";
import { EachUsersVoice } from "../EachUsersVoice";

export async function ara_join(message: Message, client: Client<boolean>) {
	if (message.content != "ara.join") return;
	if (!message.member.voice.channel) {
		message.channel.send("ボイスチャンネルに接続してください");
	} else {
		const connection = joinVoiceChannel({
			channelId: message.member.voice.channel.id,
			guildId: message.guild.id,
			adapterCreator: message.guild.voiceAdapterCreator,
			selfMute: false,
		});
		const player = createAudioPlayer();
		const msg = message.channel.send("接続しました!");
		const resource = createAudioResource("sound/lancer5.mp3");
		player.play(resource);
		if (
			settingRead([
				message.member.voice.channel.id,
				"big_voice_troll_mute",
				"enable",
			]) == "true"
		) {
			const voiceReceivers: EachUsersVoice[] = [];
			for (let member of message.member.voice.channel.members) {
				voiceReceivers.push(
					new EachUsersVoice(client, member[1], connection.receiver)
				);
			}
			(await msg).reply(
				"#" +
					tcConnectedVcIs(message.member.voice.channel).name +
					" の大音量荒らし対策が有効になっています"
			);
		}
	}
}
