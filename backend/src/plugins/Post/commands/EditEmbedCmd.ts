import { APIEmbed } from "discord.js";
import { commandTypeHelpers as ct } from "../../../commandTypes";
import { sendErrorMessage, sendSuccessMessage } from "../../../pluginUtils";
import { trimLines } from "../../../utils";
import { parseColor } from "../../../utils/parseColor";
import { rgbToInt } from "../../../utils/rgbToInt";
import { postCmd } from "../types";
import { formatContent } from "../util/formatContent";

const COLOR_MATCH_REGEX = /^#?([0-9a-f]{6})$/;

export const EditEmbedCmd = postCmd({
  trigger: "edit_embed",
  permission: "can_post",

  signature: {
    message: ct.messageTarget(),
    maincontent: ct.string({ catchAll: true }),

    title: ct.string({ option: true }),
    content: ct.string({ option: true }),
    color: ct.string({ option: true }),
  },

  async run({ message: msg, args, pluginData }) {
    const content = args.content || args.maincontent;

    let color: number | null = null;
    if (args.color) {
      const colorRgb = parseColor(args.color);
      if (colorRgb) {
        color = rgbToInt(colorRgb);
      } else {
        sendErrorMessage(pluginData, msg.channel, "Invalid color specified");
        return;
      }
    }

    const targetMessage = await args.message.channel.messages.fetch(args.message.messageId);
    if (!targetMessage) {
      sendErrorMessage(pluginData, msg.channel, "Unknown message");
      return;
    }

    const embed = (targetMessage.embeds![0] ?? { fields: [] }) as APIEmbed;
    if (args.title) embed.title = args.title;
    if (content) embed.description = formatContent(content);
    if (color) embed.color = color;

    args.message.channel.messages.edit(targetMessage.id, {
      embeds: [embed],
    });
    await sendSuccessMessage(pluginData, msg.channel, "Embed edited");

    if (args.content) {
      const prefix = pluginData.fullConfig.prefix || "!";
      msg.channel.send(
        trimLines(`
        <@!${msg.author.id}> You can now specify an embed's content directly at the end of the command:
        \`${prefix}edit_embed -title "Some title" content goes here\`
        The \`-content\` option will soon be removed in favor of this.
      `),
      );
    }
  },
});
