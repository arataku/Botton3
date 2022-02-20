"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddButton = void 0;
const discord_js_1 = require("discord.js");
async function AddButton(message, client, label, clicked, style = "PRIMARY", customId = message.id.toString() + new Date().getTime().toString()) {
    const btn = new discord_js_1.MessageButton()
        .setCustomId(customId)
        .setStyle(style)
        .setLabel(label);
    message.edit({ components: [new discord_js_1.MessageActionRow().addComponents(btn)] });
    client.on("interactionCreate", async (interaction) => {
        if (interaction.isButton() && interaction.customId == customId) {
            clicked(message);
            interaction.update({
                components: [new discord_js_1.MessageActionRow().addComponents(btn.setDisabled())],
            });
        }
    });
}
exports.AddButton = AddButton;
//# sourceMappingURL=MessageUtl.js.map