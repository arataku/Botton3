import { Client, GuildMember, TextChannel } from "discord.js";
import { VoiceReceiver, EndBehaviorType } from "@discordjs/voice";
import prism from "prism-media";
import { settingRead, tcConnectedVcIs } from "./setting";
import { average } from "./Utls";
import { AddButton } from "./MessageUtl";

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
	public getLoudness(): number {
		let tmp = [];
		for (let value of this.voiceStackData) {
			tmp.push(Math.abs(value));
		}
		this.loudness = average(tmp);
		return this.loudness;
	}
	public async checkLoudness(): Promise<void> {
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
					this.member.voice.setMute(true);
					const warn_msg = await this.member.send(
						[
							"声が大きいため、スパムの可能性があるとしてサーバーミュートしました。",
							"解除するには下のボタンを押してください。",
						].join("\n")
					);
					AddButton(warn_msg, this.client, "解除", (message) => {
						this.member.voice.setMute(false);
						message.reply("サーバーミュートを解除しました。");
					});
					const tmp = tcConnectedVcIs(this.member.voice.channel);
					if (tmp != null) {
						tmp.send(
							this.member.toString() +
								"さんが、過剰に大きい声で話したのでサーバーミュートしました。"
						);
					}
				}
			}
		} else if (this.warnPoint > 0) {
			this.warnPoint--;
		}
	}
}
