import { test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.ACCESS_TOKEN_SECRET = "test-secret";

const { isLoggedIn } = await import("../middlewares/isLoggedIn.js");

const run = (req) =>
    new Promise((resolve) => {
        isLoggedIn({ cookies: {}, header: () => undefined, ...req }, {}, resolve);
    });

test("isLoggedIn rejects requests without a token with 401", async () => {
    const err = await run({});
    assert.equal(err.statusCode, 401);
});

test("isLoggedIn rejects a token signed with the wrong secret", async () => {
    const forged = jwt.sign({ id: "507f1f77bcf86cd799439011" }, "not-the-secret");
    const err = await run({ cookies: { accesstoken: forged } });
    assert.equal(err.statusCode, 401);
});
