import * as Discord from "discord.js";
import { Ticket } from "../classes/Ticket";
import channels from "../../../channels";
import roles from "../../../roles";
import config from "../../../config";
import ch from "../../../channels";
import { client } from "../../..";
import { pmdDB } from "../../../database/client";

const coll = pmdDB.collection("tickets");

let users: Array<string> = [];

module.exports = async (message: Discord.Message) => {
	if (
		message.author.bot ||
		(message.channel.id !== channels.supportChannel &&
			(message.channel as Discord.TextChannel).parent.id !==
				channels.ticketCategory)
	)
		return;

	let t = new Ticket();

	const ticketFound = await t.fetch("channel", message.channel.id);

	if (
		!ticketFound &&
		message.channel.id !== ch.supportChannel &&
		[ch.chatCategory, ch.offtopicCategory].includes(
			(message.channel as Discord.TextChannel).parentID
		)
	) {
		if (
			!message.content.startsWith(config.prefix) &&
			(message.content.includes("help me") ||
				message.content.includes("anyone here?") ||
				message.content.includes("premid isnt working") ||
				message.content.includes("premid isn't working")) &&
			client.elevation(message.author.id) === 0
		) {
			if (!users.includes(message.author.id)) {
				message.channel
					.send(
						`Need help? Feel free to create a ticket on <#${channels.supportChannel}>!`
					)
					.then(msg => msg.delete({ timeout: 15000 }));
				users.push(message.author.id);
				setTimeout(() => {
					const uI = users.indexOf(message.author.id);
					if (uI > -1) users.splice(uI, 1);
				}, 60 * 1000);
			} else return;
		}
	}

	if (
		!ticketFound &&
		message.channel.id === channels.supportChannel &&
		!message.author.bot
	) {
		if (message.cleanContent.length > 25) {
			t.create(message);
		} else {
			message.delete();
			(await message.reply("Please write at least 25 characters.")).delete({
				timeout: 10 * 1000
			});
		}

		return;
	}

	if (ticketFound)
		coll.findOneAndUpdate(
			{ ticketId: t.id },
			{
				$push: {
					messages: {
						userId: message.author.id,
						content: message.cleanContent,
						sent: message.createdTimestamp
					}
				}
			}
		);

	if (ticketFound && t.user.id === message.author.id)
		coll.findOneAndUpdate(
			{ ticketId: t.id },
			{ $set: { lastUserMessage: Date.now() } }
		);

	if (
		ticketFound &&
		message.content.startsWith("<<") &&
		(message.member.roles.cache.has(roles.ticketManager) ||
			message.member.permissions.has("ADMINISTRATOR"))
	) {
		t.removeSupporter(message.member);
		message.delete();
		return;
	}

	if (
		ticketFound &&
		message.content.startsWith(">>") &&
		(message.member.roles.cache.has(roles.ticketManager) ||
			message.member.permissions.has("ADMINISTRATOR"))
	) {
		const args = message.content
			.split(" ")
			.slice(1, message.content.split(" ").length);
		if (args.length === 0) return;
		const userToAdd = message.guild.members.cache.find(
			m =>
				(m.id === args.join(" ") || m.displayName === args.join(" ")) &&
				(message.member.roles.cache.has(roles.ticketManager) ||
					message.member.permissions.has("ADMINISTRATOR"))
		);
		t.addSupporter(userToAdd);
		message.delete();
		return;
	}

	if (
		ticketFound &&
		!message.content.startsWith("<<") &&
		(message.member.roles.cache.has(roles.ticketManager) ||
			message.member.permissions.has("ADMINISTRATOR"))
	) {
		t.addSupporter(message.member);
		return;
	}
};
