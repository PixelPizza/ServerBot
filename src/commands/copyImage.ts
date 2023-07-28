import { Command } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandType } from "discord-api-types/v10";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { EmbedBuilder } from "#lib";
import { AttachmentBuilder, Message } from "discord.js";

@ApplyOptions<Command.Options>({
	name: "copyImage",
	description: "Copy an image"
})
export class CopyImageCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerContextMenuCommand(
			(builder) =>
				builder
					.setType(ApplicationCommandType.Message)
					.setName("Copy Image"),
			{
				idHints: ["1134543298887950356"]
			}
		);

		registry.registerContextMenuCommand(
			(builder) =>
				builder
					.setType(ApplicationCommandType.User)
					.setName("Copy Avatar"),
			{
				idHints: ["1134543300347559987"]
			}
		);
	}

	public override async contextMenuRun(
		interaction: Command.ContextMenuCommandInteraction
	): Promise<any> {
		await interaction.deferReply({ ephemeral: true });

		if (interaction.isMessageContextMenuCommand()) {
			const { targetMessage: message } = interaction;

			if (!(message instanceof Message)) return;

			const url = message.attachments.find(
				(attachment) =>
					attachment.contentType !== null &&
					/image\/(png|jpe?g)/.test(attachment.contentType)
			)?.url;

			if (!url) {
				return interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.error("No image found")
							.setDescription("No valid image has been found.")
					]
				});
			}

			return this.copyImage(interaction, url);
		}

		if (interaction.isUserContextMenuCommand()) {
			const { targetUser: user } = interaction;
			return this.copyImage(
				interaction,
				user.displayAvatarURL({ extension: "png", size: 512 })
			);
		}
	}

	private async copyImage(
		interaction:
			| Subcommand.ContextMenuCommandInteraction
			| Subcommand.ChatInputCommandInteraction,
		url: string
	) {
		try {
			const image = await this.container.images.create({
				url,
				owner: interaction.user.id
			});

			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.success("Image copied")
						.setDescription("The selected image has been copied.")
						.addFields({ name: "ID", value: image.id })
						.setImage("attachment://copy.png")
				],
				files: [
					new AttachmentBuilder(
						Buffer.from(image.data.toString(), "base64")
					).setName("copy.png")
				]
			});
		} catch (error) {
			this.container.logger.error(error);
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.error("Copy Failed")
						.setDescription("Unable to copy selected image.")
				]
			});
		}
	}
}
