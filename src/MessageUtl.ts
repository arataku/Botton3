import {
	Client,
	Message,
	MessageButton,
	MessageActionRow,
	MessageButtonStyleResolvable,
} from "discord.js";

export async function AddButton(
	message: Message,
	client: Client<boolean>,
	label: string,
	clicked: (message: Message) => void,
	style: MessageButtonStyleResolvable = "PRIMARY",
	customId: string = message.id.toString() + new Date().getTime().toString()
) {
	const btn = new MessageButton()
		.setCustomId(customId)
		.setStyle(style)
		.setLabel(label);
	message.edit({ components: [new MessageActionRow().addComponents(btn)] });
	client.on("interactionCreate", async (interaction) => {
		if (interaction.isButton() && interaction.customId == customId) {
			clicked(message);
			interaction.update({
				components: [new MessageActionRow().addComponents(btn.setDisabled())],
			});
		}
	});
}
