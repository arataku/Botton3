import { TextChannel, VoiceBasedChannel, VoiceChannel } from "discord.js";

var fs = require("fs");

export function settingSet(keys: string[], value: string) {
	const json = require("../setting.json");
	let tmp = json;

	for (let i = 0; i < keys.length - 1; i++) {
		if (keys[i] in tmp) {
			tmp = tmp[keys[i]];
		} else {
			tmp[keys[i]] = {};
			tmp = tmp[keys[i]];
		}
	}
	tmp[keys[keys.length - 1]] = value;
	fs.writeFileSync("../setting.json", JSON.stringify(json));
}

export function settingRead(keys: string[]) {
	const json = require("../setting.json");
	let tmp = json;
	for (let i = 0; i < keys.length - 1; i++) {
		if (keys[i] in tmp) {
			tmp = tmp[keys[i]];
		} else {
			tmp[keys[i]] = {};
			tmp = tmp[keys[i]];
		}
	}
	if (keys[keys.length - 1] in tmp) {
		return tmp[keys[keys.length - 1]];
	} else {
		return null;
	}
}

export function tcConnectedVcIs(
	vc: VoiceChannel | VoiceBasedChannel
): TextChannel {
	let tmp = settingRead([vc.id, "big_voice_troll_mute", "text_channel_id"]);
	tmp = vc.client.channels.cache.get(tmp);
	if ((tmp.type = "GUILD_TEXT")) {
		return tmp;
	}
	return null;
}
