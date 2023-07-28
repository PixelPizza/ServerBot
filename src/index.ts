import { Client } from "#lib";
import "./container";
import { container } from "@sapphire/framework";
import path from "node:path";
import { existsSync, mkdirSync } from "fs";
import "@sapphire/plugin-logger/register";
import "@sapphire/plugin-subcommands/register";

if (!existsSync("img")) mkdirSync("img");

async function main() {
	const client = new Client();

	container.stores
		.get("listeners")
		.registerPath(path.join(__dirname, "events"));

	await client.login();
}

void main();
