import { Client, GuildMember, TextChannel } from "discord.js";
import { VoiceReceiver, EndBehaviorType } from "@discordjs/voice";
import prism from "prism-media";
import { settingRead, tcConnectedVcIs } from "./setting";
import { average } from "./Utls";
import { AddButton } from "./MessageUtl";

// manage the voice receiver of members.
// メンバーのvoice receiverを管理する。
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

		//prepare opus stream.
		//opus streamを準備する。
		const audioReceiveStream = this.receiver.subscribe(this.member.id, {
			end: {
				behavior: EndBehaviorType.Manual,
			},
		});

		//convert opus stream to PCM stream.
		//opus streamをPCM streamに変換する。
		// prepare the decoder.
		// デコーダーを準備する。
		const Decoder = new prism.opus.Decoder({
			rate: 48000,
			channels: 2,
			frameSize: 960,
		});
		// send PCM stream to the decoder.
		// PCM streamをデコーダーに送信する。
		audioReceiveStream.on("data", (chunk) => {
			Decoder.write(chunk);
		});
		// check loudness.
		// 音量をチェックする。
		Decoder.on("data", async (chunk) => {
			let tmp = [];
			// convert PCM stream to float array.
			// PCM streamをfloat arrayに変換する。
			for (let i = 0; i < (chunk.length - 1) / 2; i += 2) {
				tmp.push(chunk.readInt16LE(i * 2));
			}
			this.voiceStackData.push(...tmp);
			// remove data from stack if the stack is over 10000.
			// stackが10000を超えたらデータを削除する。
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
			// convert to absolute value.
			// 絶対値に変換する。
			tmp.push(Math.abs(value));
		}
		// calculate average.
		// 平均を計算する。
		this.loudness = average(tmp);
		return this.loudness;
	}
	public async checkLoudness(): Promise<void> {
		// if the loudness is over the 10000 and it prolong, mute the member.
		// 音量が10000を超えていて、持続している場合、メンバーをミュートする。
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
					// when the member was muted, send a message to the channel.
					// メンバーがミュートされた場合、チャンネルにメッセージを送信する。
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
