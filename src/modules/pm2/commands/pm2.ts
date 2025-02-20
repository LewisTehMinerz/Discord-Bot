import * as Discord from "discord.js";
import config from "../../../config";
import pm2, { ProcessDescription } from "pm2";
import { MessageEmbed } from "discord.js";

module.exports.run = async (
	message: Discord.Message,
	params: Array<string>
) => {
	message.delete();
	if (params.length === 0) {
		(
			await message.channel.send(
				new MessageEmbed({
					title: "pm2",
					description: `
      **0** API
      **1** Discord-Bot
      **4** Docs
      **3** Website-master
      **2** Website-stable
      `,
					footer: {
						text: "Enter the ID to restart it.",
					},
				})
			)
		).delete({ timeout: 15 * 1000 });
		return;
	}

	if (!["9", "1", "2", "3", "4"].includes(params[0].toLowerCase())) {
		(await message.reply("Invalid process ID")).delete({
			timeout: 10 * 1000,
		});
		return;
	}

	pm2.connect(async function (err) {
		if (err) {
			message.reply(`Error connecting to pm2: \`\`\`${err.message}\`\`\``);
			return;
		}

		pm2.restart(parseInt(params[0]), null);

		(await message.reply(`Restarted process`)).delete({ timeout: 10 * 1000 });

		pm2.disconnect();
	});
};

module.exports.config = {
	name: "pm2",
	description: "Execute pm2 commands.",
	permLevel: 4,
};
