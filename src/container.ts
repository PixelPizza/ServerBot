import { EnvManager } from "#lib";
import { container } from "@sapphire/framework";
import { config } from "dotenv-cra";
import {
	brotliCompressSync,
	brotliDecompressSync,
	type InputType
} from "node:zlib";
// @ts-ignore - No types
import google from "googlethis";
import { ImageManager } from "./lib/Image/ImageManager";
config();

declare module "@sapphire/pieces" {
	interface Container {
		env: EnvManager;
		search: typeof google;
		serialize(data: InputType, encoding?: BufferEncoding): string;
		deserialize(
			data: InputType,
			options: {
				fromEncoding?: BufferEncoding;
				toEncoding: BufferEncoding;
			}
		): string;
		images: ImageManager;
	}
}

container.env = new EnvManager();
container.search = google;

container.serialize = (data: InputType, encoding?: BufferEncoding) =>
	brotliCompressSync(data).toString(encoding);
container.deserialize = (
	data: InputType,
	{
		fromEncoding,
		toEncoding
	}: { fromEncoding?: BufferEncoding; toEncoding?: BufferEncoding } = {}
) =>
	brotliDecompressSync(
		typeof data === "string" ? Buffer.from(data, fromEncoding) : data
	).toString(toEncoding);

container.images = new ImageManager(container);
