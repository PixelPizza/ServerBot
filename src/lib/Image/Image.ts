import type { Container } from "@sapphire/pieces";
import type { Snowflake } from "discord-api-types/v10";

interface ImageDataOptions {
	container: Container;
	data: string;
}

class ImageData {
	public readonly container: Container;
	public data: string;

	public constructor(public readonly options: ImageDataOptions) {
		this.container = options.container;
		this.data = options.data;
		this.data = this.deserialize();
	}

	public toString() {
		return this.data;
	}

	public serialize() {
		return this.container.serialize(this.data, "binary");
	}

	public deserialize() {
		return this.container.deserialize(this.data, {
			fromEncoding: "binary",
			toEncoding: "base64"
		});
	}
}

export interface ImageOptions {
	container: Container;
	data: string;
	owner: Snowflake;
	previous?: string[];
	next?: string[];
}

export class Image {
	public readonly container: Container;
	public readonly id: string;
	public readonly owner: Snowflake;
	private readonly previous: ImageData[];
	private next: ImageData[];
	#data: ImageData;

	public get data(): ImageData {
		return this.#data;
	}

	public set data(data: string | ImageData) {
		this.previous.push(this.#data);
		this.next = [];
		this.#data = new ImageData({
			container: this.container,
			data: data.toString()
		});
	}

	public constructor(public readonly options: ImageOptions) {
		this.container = options.container;
		this.id = Date.now().toString();
		this.owner = options.owner;
		this.#data = new ImageData({
			container: this.container,
			data: options.data
		});
		this.previous = (options.previous ?? []).map(
			(data) => new ImageData({ container: this.container, data })
		);
		this.next = (options.next ?? []).map(
			(data) => new ImageData({ container: this.container, data })
		);
	}

	public undo() {
		const last = this.previous.pop();
		if (!last) return this.#data;
		this.next.push(this.#data);
		this.#data = last;
		return this.next[this.next.length - 1];
	}

	public redo() {
		const next = this.next.pop();
		if (!next) return this.#data;
		this.data = next.toString();
		return this.previous[this.previous.length - 1];
	}

	public toJSON() {
		return {
			id: this.id,
			data: this.#data.serialize(),
			previous: this.previous.map((data) => data.serialize()),
			next: this.next.map((data) => data.serialize())
		};
	}
}
