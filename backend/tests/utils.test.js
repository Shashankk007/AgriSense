import { test } from "node:test";
import assert from "node:assert/strict";

import apiError from "../utils/apiError.js";
import wrapAsync from "../utils/wrapAsync.js";
import { pick } from "../utils/ownership.js";

test("apiError carries the status code and message", () => {
    const err = new apiError(404, "Farm not found");
    assert.equal(err.statusCode, 404);
    assert.equal(err.message, "Farm not found");
    assert.ok(err instanceof Error);
});

test("wrapAsync forwards rejected promises to next()", async () => {
    const boom = new Error("boom");
    let received;
    await wrapAsync(async () => {
        throw boom;
    })({}, {}, (err) => {
        received = err;
    });
    assert.equal(received, boom);
});

test("wrapAsync does not call next() when the handler succeeds", async () => {
    let called = false;
    await wrapAsync(async () => "ok")({}, {}, () => {
        called = true;
    });
    assert.equal(called, false);
});

test("pick keeps only whitelisted, defined keys (blocks ownership overwrite)", () => {
    const body = { name: "Field", userId: "attacker", quantity: undefined, unit: "kg" };
    assert.deepEqual(pick(body, ["name", "quantity", "unit"]), { name: "Field", unit: "kg" });
});
