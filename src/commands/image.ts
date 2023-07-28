import { Subcommand } from "@sapphire/plugin-subcommands";
import { ApplyOptions } from "@sapphire/decorators";
import { EmbedBuilder } from "#lib";
import { PaginatedMessage } from "@sapphire/discord.js-utilities";
import { AttachmentBuilder } from "discord.js";

@ApplyOptions<Subcommand.Options>({
	name: "image",
	description: "Image commands",
	subcommands: [
		{
			name: "search",
			type: "method",
			chatInputRun: "chatInputSearch"
		},
		{
			name: "copy",
			type: "group",
			entries: [
				{
					name: "url",
					type: "method",
					chatInputRun: "chatInputCopyUrl"
				},
				{
					name: "attachment",
					type: "method",
					chatInputRun: "chatInputCopyAttachment"
				}
			]
		}
	]
})
export class ImageCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName(this.name)
					.setDescription(this.description)
					.addSubcommand((subcommand) =>
						subcommand
							.setName("search")
							.setDescription("Search for an image")
							.addStringOption((input) =>
								input
									.setName("query")
									.setDescription("The query to search for")
									.setRequired(true)
							)
							.addIntegerOption((input) =>
								input
									.setName("limit")
									.setDescription(
										"The limit of images to return"
									)
									.setRequired(true)
									.setMinValue(1)
									.setMaxValue(25)
							)
					)
					.addSubcommandGroup((subcommandGroup) =>
						subcommandGroup
							.setName("copy")
							.setDescription("Copy an image")
							.addSubcommand((input) =>
								input
									.setName("url")
									.setDescription("Copy an image from a URL")
									.addStringOption((input) =>
										input
											.setName("url")
											.setDescription(
												"The URL of the image"
											)
											.setRequired(true)
									)
							)
							.addSubcommand((input) =>
								input
									.setName("attachment")
									.setDescription(
										"Copy an image from an attachment (not supported yet)"
									)
							)
					),
			{
				idHints: ["1134526112244965467"]
			}
		);
	}

	public async chatInputSearch(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.info("Searching")
					.setDescription("Searching for images...")
			],
			ephemeral: true
		});

		const results = (
			await this.container.search.image(
				interaction.options.getString("query", true),
				{
					safe: true,
					exclude_domains: [
						"instagram.com",
						"facebook.com",
						"wikimedia.org",
						"twitter.com",
						"youtube.com"
					]
				}
			)
		)
			.filter(
				(result: any) =>
					/^https?:\/\//.test(result.origin.website) &&
					!["gstatic.com", "static-rmg.be", "persgroep.net"].some(
						(url) => result.url.includes(url)
					)
			)
			.splice(0, interaction.options.getInteger("limit", true));

		if (!results.length) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.error("No images found")
						.setDescription("No images could be found.")
				]
			});
		}

		const message = new PaginatedMessage().addPages(
			results.map((result: any) => ({
				embeds: [
					new EmbedBuilder()
						.info(result.origin.title)
						.setURL(result.origin.website)
						.setImage(result.url)
						.addFields(
							{
								name: "Width",
								value: result.width,
								inline: true
							},
							{
								name: "Height",
								value: result.height,
								inline: true
							}
						)
				]
			}))
		);

		return message.run(interaction);
	}

	public async chatInputCopyUrl(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		await interaction.deferReply({ ephemeral: true });
		return this.copyImage(
			interaction,
			interaction.options.getString("url", true)
		);
	}

	public async chatInputCopyAttachment(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		await interaction.deferReply({ ephemeral: true });
		return interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.error("Not supported")
					.setDescription(
						"The attachment command is not supported yet."
					)
			]
		});
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
