import { Client, Message } from "discord.js";
import {
	joinVoiceChannel,
	createAudioResource,
	createAudioPlayer,
} from "@discordjs/voice";
import { settingRead, tcConnectedVcIs } from "../setting";
import { EachUsersVoice } from "../EachUsersVoice";

// The function to be called when the command is received.
// ara.joinが入力されたときに呼ばれる関数

export async function ara_join(message: Message, client: Client<boolean>) {
	if (message.content != "ara.join") return;
	// User should be in a voice channel.
	// ユーザーはボイスチャンネルにいる必要があります。
	if (!message.member.voice.channel) {
		message.channel.send("ボイスチャンネルに接続してください");
	} else {
		// Create connection to the voice channel.
		// ボイスチャンネルへの接続を作成します。
		const connection = joinVoiceChannel({
			channelId: message.member.voice.channel.id,
			guildId: message.guild.id,
			adapterCreator: message.guild.voiceAdapterCreator,
			selfMute: false,
		});
		// create audio player.
		// 音声プレイヤーを作成します。
		const player = createAudioPlayer();
		const msg = message.channel.send("接続しました!");
		// play audio. but it's not working now.
		// 音声を再生しますが、現在は動作しません。
		const resource = createAudioResource("sound/lancer5.mp3");
		player.play(resource);
		// check if enable big voice troll mute.
		// big voice troll muteが有効になっているかどうかを確認します。
		if (
			settingRead([
				message.member.voice.channel.id,
				"big_voice_troll_mute",
				"enable",
			]) == "true"
		) {
			// prepare member's voice receivers.
			// メンバーのvoice receiverを準備します。
			const voiceReceivers: EachUsersVoice[] = [];
			for (let member of message.member.voice.channel.members) {
				voiceReceivers.push(
					new EachUsersVoice(client, member[1], connection.receiver)
				);
			}
			// report if big voice troll mute is enabled.
			// big voice troll muteが有効になっている場合は報告します。
			(await msg).reply(
				"#" +
					tcConnectedVcIs(message.member.voice.channel).name +
					" の大音量荒らし対策が有効になっています"
			);
		}
	}
}
