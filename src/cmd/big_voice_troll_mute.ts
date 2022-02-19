import { Client, Message, MessageActionRow, MessageButton } from "discord.js";
import { settingSet } from "../setting";

export async function ara_big_voice_troll_mute(
	message: Message,
	client: Client<boolean>
) {
	if (message.content === "ara.big_voice_troll_mute") {
		if (!message.member.permissions.has("MANAGE_CHANNELS")) {
			message.channel.send(
				"チャンネル管理権限がないユーザーはこのコマンドは使用できません。"
			);
		} else if (!message.member.voice.channel) {
			message.channel.send("ボイスチャンネルに接続してください");
		} else {
			const enable =
				"ara.big_voice_troll_mute" + new Date().getTime().toString();
			const btn = new MessageButton()
				.setCustomId(enable)
				.setStyle("PRIMARY")
				.setLabel("Enable");
			const msg = await message.reply({
				content: [
					"大音量で音声を流す迷惑な荒らしが現れた時に、",
					"大音量で音声を流す迷惑な荒らしが現れた時に、",
					"サーバーミュートにして、DMでボタンを押さないと解除できないようにします。",
					"この設定は、いまあなたが接続してるVCと、このテキストチャンネルのみで適応されます。",
					"荒らしの人物が現れたログは、このチャンネルに表示されます。",
					"設定する場合は、下のボタンを押してください。",
				].join("\n"),
				components: [new MessageActionRow().addComponents(btn)],
			});
			client.on("interactionCreate", async (interaction) => {
				if (interaction.isButton()) {
					if (interaction.customId == enable) {
						const channelId = message.member.voice.channel.id;
						settingSet([channelId, "big_voice_troll_mute", "enable"], "true");
						settingSet(
							[channelId, "big_voice_troll_mute", "text_channel_id"],
							message.channel.id
						);

						msg.reply("設定しました。");
						interaction.update({
							components: [
								new MessageActionRow().addComponents(btn.setDisabled()),
							],
						});
					}
				}
			});
		}
	}
}
