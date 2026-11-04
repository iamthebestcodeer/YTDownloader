import { describe, expect, test } from "bun:test";

import { ClientRotation } from "./client-rotation";

const BOT_CHECK = new Error("ERROR: [youtube] x: Sign in to confirm you're not a bot");
const clientOf = (args: string[]) => args[1]?.replace("youtube:player_client=", "") ?? "default";

describe("ClientRotation", () => {
	test("moves on to the next client when YouTube refuses one", async () => {
		const tried: string[] = [];
		const result = await new ClientRotation().run(async (args) => {
			tried.push(clientOf(args));
			if (tried.length < 3) throw BOT_CHECK;
			return "ok";
		});
		expect(result).toBe("ok");
		expect(tried).toEqual(["default", "web_safari", "mweb"]);
	});

	test("starts with the client that worked last time", async () => {
		const rotation = new ClientRotation();
		await rotation.run(async (args) => {
			if (clientOf(args) !== "tv_simply") throw BOT_CHECK;
			return "ok";
		});
		const tried: string[] = [];
		await rotation.run(async (args) => {
			tried.push(clientOf(args));
			return "ok";
		});
		expect(tried).toEqual(["tv_simply"]);
	});

	test("does not retry errors that another client cannot fix", async () => {
		let attempts = 0;
		const failing = new ClientRotation().run(async () => {
			attempts++;
			throw new Error("ERROR: [youtube] x: Video unavailable. This video is private");
		});
		await expect(failing).rejects.toThrow("Video unavailable");
		expect(attempts).toBe(1);
	});

	test("keeps an incomplete result while trying for a complete one", async () => {
		const tried: string[] = [];
		const result = await new ClientRotation().run(
			async (args) => {
				const client = clientOf(args);
				tried.push(client);
				if (client === "default") throw BOT_CHECK;
				return { client, formats: client === "mweb" ? 5 : 0 };
			},
			(info) => info.formats > 0,
		);
		expect(result).toEqual({ client: "mweb", formats: 5 });
		expect(tried).toEqual(["default", "web_safari", "mweb"]);
	});

	test("falls back to the first incomplete result when nothing better exists", async () => {
		const result = await new ClientRotation().run(
			async (args) => {
				if (clientOf(args) === "default") throw BOT_CHECK;
				return clientOf(args);
			},
			() => false,
		);
		expect(result).toBe("web_safari");
	});

	test("reports the last refusal when every client is blocked", async () => {
		const failing = new ClientRotation().run(async () => {
			throw BOT_CHECK;
		});
		await expect(failing).rejects.toThrow("not a bot");
	});
});
