import {
	Client,
	GuildMember,
	Intents,
	Message,
	MessageButton,
	MessageActionRow,
} from "discord.js";
import {
	joinVoiceChannel,
	createAudioResource,
	createAudioPlayer,
	VoiceReceiver,
	EndBehaviorType,
} from "@discordjs/voice";
import prism from "prism-media";
import { set, read } from "./setting";
import { average } from "./Utls";

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});
const TOKEN: string = process.env.AraBot3Token;

async function sleep(waitTime: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, waitTime));
}

client.on("ready", () => {
	console.log("Ready");
});

client.on("messageCreate", async (message: Message) => {
	if (message.author.bot) return;
	if (message.content.startsWith("!ping")) {
		message.channel.send("Pong!");
	}
	if (message.content === "ara.join") {
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
				read([
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
						message.guild.channels.cache.get(
							read([
								message.member.voice.channel.id,
								"big_voice_troll_mute",
								"text_channel_id",
							])
						).name +
						" の大音量荒らし対策が有効になっています"
				);
			}
		}
	}
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
				content:
					"大音量で音声を流す迷惑な荒らしが現れた時に、" +
					"サーバーミュートにして、DMでボタンを押さないと解除できないようにします。" +
					"\n" +
					"この設定は、いまあなたが接続してるVCと、このテキストチャンネルのみで適応されます。" +
					"\n" +
					"荒らしの人物が現れたログは、このチャンネルに表示されます。" +
					"設定する場合は、下のボタンを押してください。",
				components: [new MessageActionRow().addComponents(btn)],
			});
			client.on("interactionCreate", async (interaction) => {
				if (interaction.isButton()) {
					if (interaction.customId == enable) {
						set(
							[
								message.member.voice.channel.id,
								"big_voice_troll_mute",
								"enable",
							],
							"true"
						);
						set(
							[
								message.member.voice.channel.id,
								"big_voice_troll_mute",
								"text_channel_id",
							],
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

client.on("voiceStateUpdate", async (oldState, newState) => {
	if (
		oldState.mute != newState.mute &&
		oldState.selfMute == newState.selfMute
	) {
		set([newState.guild.id, "manually_mute_set", newState.member.id], "true");
	}
});

class EachUsersVoice {
	private client: Client<boolean>;
	private receiver: VoiceReceiver;
	private loudness: number;
	private member: GuildMember;
	private voiceStackData: number[];
	private warnPoint: number;
	constructor(
		client: Client<boolean>,
		member: GuildMember,
		receiver: VoiceReceiver
	) {
		this.client = client;
		this.member = member;
		this.receiver = receiver;
		this.loudness = 0;
		this.voiceStackData = [];
		this.warnPoint = 0;

		const audioReceiveStream = this.receiver.subscribe(this.member.id, {
			end: {
				behavior: EndBehaviorType.Manual,
			},
		});

		const Decoder = new prism.opus.Decoder({
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
	public getLoudness(): number {
		let tmp = [];
		for (let value of this.voiceStackData) {
			tmp.push(Math.abs(value));
		}
		this.loudness = average(tmp);
		return this.loudness;
	}
	public checkLoudness(): void {
		if (this.loudness > 10000) {
			this.warnPoint++;
			if (this.warnPoint > 100) {
				this.warnPoint = 0;
				console.log(
					read([this.member.guild.id, "manually_mute_set", this.member.id])
				);
				if (
					!(
						this.member.voice.mute ||
						read([this.member.guild.id, "manually_mute_set", this.member.id]) ==
							"true"
					)
				) {
					const unmuteId =
						"unmute" +
						this.member.id.toString() +
						new Date().getTime().toString();
					const btn = new MessageButton()
						.setCustomId(unmuteId)
						.setStyle("PRIMARY")
						.setLabel("サーバーミュート解除");
					this.member.voice.setMute(true);
					const warn_msg = this.member.send({
						content:
							"声が大きいため、スパムの可能性があるとしてサーバーミュートしました。解除するには下のボタンを押してください。",
						components: [new MessageActionRow().addComponents(btn)],
					});

					let tmp = this.member.client.channels.cache.get(
						read([
							this.member.voice.channel.id,
							"big_voice_troll_mute",
							"text_channel_id",
						])
					);
					if (tmp.type == "GUILD_TEXT") {
						tmp.send(
							this.member.toString() +
								"さんが、スパムもしくは過剰に大きい声で話したのでサーバーミュートされました。"
						);
					}
					this.client.on("interactionCreate", async (interaction) => {
						if (interaction.isButton()) {
							if (interaction.customId === unmuteId) {
								console.log("interaction:" + interaction.customId);
								this.member.voice.setMute(false);
								interaction.update({
									components: [
										new MessageActionRow().addComponents(btn.setDisabled()),
									],
								});
								(await warn_msg).reply("サーバーミュートを解除しました。");
							}
						}
					});
				}
			}
		} else if (this.warnPoint > 0) {
			this.warnPoint--;
		}
	}
}

client.login(TOKEN);
