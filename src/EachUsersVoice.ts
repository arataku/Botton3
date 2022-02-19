import {
	Client,
	GuildMember,
	MessageButton,
	MessageActionRow,
} from "discord.js";
import { VoiceReceiver, EndBehaviorType } from "@discordjs/voice";
import prism from "prism-media";
import { settingRead } from "./setting";
import { average } from "./Utls";

export class EachUsersVoice {
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
					settingRead([
						this.member.guild.id,
						"manually_mute_set",
						this.member.id,
					])
				);
				if (
					!(
						this.member.voice.mute ||
						settingRead([
							this.member.guild.id,
							"manually_mute_set",
							this.member.id,
						]) == "true"
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
						settingRead([
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
