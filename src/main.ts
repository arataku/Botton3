import { Client, Intents } from "discord.js";
import { settingSet } from "./setting";
import { ara_join } from "./cmd/join";
import { ara_big_voice_troll_mute } from "./cmd/big_voice_troll_mute";

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});
const TOKEN: string = process.env.AraBot3Token;

client.on("ready", () => {
	console.log("Ready");
});

client.on("messageCreate", async (message) => {
	ara_join(message, client);
	ara_big_voice_troll_mute(message, client);
	if (message.content === "ara.help") {
		await message.channel.send(
			[
				"ara.join: ボイスチャンネルに接続します",
				"ara.big_voice_troll_mute: 荒らしの人物が現れた時にサーバーミュートにします",
				"!ping: pong!",
				"ara.help: このメッセージを表示します",
			].join("\n")
		);
	}
});

// observe server mute change, and append the user to the white list.
// server muteが切り替わったユーザーを検知し、そのユーザーをホワイトリストに追加する。
client.on("voiceStateUpdate", async (oldState, newState) => {
	if (
		oldState.mute != newState.mute &&
		oldState.selfMute == newState.selfMute
	) {
		settingSet(
			[newState.guild.id, "manually_mute_set", newState.member.id],
			"true"
		);
	}
});

//login
//ログイン
client.login(TOKEN);
