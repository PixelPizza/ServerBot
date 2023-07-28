import type { Container } from "@sapphire/pieces";
import { Collection, type Snowflake } from "discord.js";
import { Image } from "./Image";

export class ImageManager {
	public readonly cache: Collection<string, Image> = new Collection();

	public constructor(public readonly container: Container) {}

	public async create(options: { url: string; owner: Snowflake }) {
		const image = await this.fetchImage(options);
		this.cache.set(image.id, image);
		return image;
	}

	public fetch(id?: string, force = false) {
		if (!id)
			return [].map(
				(image) =>
					new Image({
						container: this.container,
						data: image,
						owner: ""
					})
			);
		if (!force && this.cache.has(id)) return this.cache.get(id);
		return new Image({ container: this.container, data: "", owner: "" });
	}

	private fetchImage({
		url,
		owner
	}: {
		url: string;
		owner: Snowflake;
	}): Promise<Image> {
		return new Promise(async (resolve) => {
			const imageData = await fetch(url)
				.then((response) => response.arrayBuffer())
				.then((arrayBuffer) => Buffer.from(arrayBuffer));
			resolve(
				new Image({
					container: this.container,
					data: this.container.serialize(imageData, "binary"),
					owner
				})
			);
		});
	}
}
