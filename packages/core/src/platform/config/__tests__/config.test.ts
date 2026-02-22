/**
 * Tests for ConfigProvider module
 */

import {
  InMemoryConfigProvider,
  NodeConfigProvider,
  ConfigurationError,
} from "../index.js";

async function runTests() {
  console.log("========================================================");
  console.log(" ConfigProvider Module Tests");
  console.log("========================================================\n");

  // ─── Test InMemoryConfigProvider ─────────────────────────────────────────────
  console.log("1. InMemoryConfigProvider:");

  const inMemoryConfig = new InMemoryConfigProvider({
    TEST_KEY: "test-value",
    KLAY_DB_PATH: "/custom/path",
  });

  // get()
  console.log(`   get("TEST_KEY"): ${inMemoryConfig.get("TEST_KEY")}`);
  console.assert(inMemoryConfig.get("TEST_KEY") === "test-value", "get should return value");
  console.assert(inMemoryConfig.get("MISSING") === undefined, "get should return undefined for missing");
  console.log("   ✅ get() works correctly");

  // getOrDefault()
  console.assert(
    inMemoryConfig.getOrDefault("MISSING", "default") === "default",
    "getOrDefault should return default"
  );
  console.log("   ✅ getOrDefault() works correctly");

  // has()
  console.assert(inMemoryConfig.has("TEST_KEY") === true, "has should return true");
  console.assert(inMemoryConfig.has("MISSING") === false, "has should return false");
  console.log("   ✅ has() works correctly");

  // require() - success
  console.assert(inMemoryConfig.require("TEST_KEY") === "test-value", "require should return value");
  console.log("   ✅ require() returns value when key exists");

  // require() - throws
  try {
    inMemoryConfig.require("MISSING_KEY");
    console.error("   ❌ require() should have thrown");
  } catch (e) {
    if (e instanceof ConfigurationError) {
      console.log(`   ✅ require() throws ConfigurationError: "${e.message}"`);
    } else {
      console.error("   ❌ require() threw wrong error type");
    }
  }

  // set(), delete(), clear()
  inMemoryConfig.set("DYNAMIC_KEY", "dynamic-value");
  console.assert(inMemoryConfig.get("DYNAMIC_KEY") === "dynamic-value", "set should add value");
  inMemoryConfig.delete("DYNAMIC_KEY");
  console.assert(inMemoryConfig.get("DYNAMIC_KEY") === undefined, "delete should remove value");
  inMemoryConfig.clear();
  console.assert(inMemoryConfig.has("TEST_KEY") === false, "clear should remove all");
  console.log("   ✅ set(), delete(), clear() work correctly");

  console.log();

  // ─── Test NodeConfigProvider ─────────────────────────────────────────────────
  console.log("2. NodeConfigProvider:");

  const mockEnv = {
    NODE_ENV: "test",
    CUSTOM_VAR: "custom-value",
    EMPTY_VAR: "",
  };

  const nodeConfig = new NodeConfigProvider(mockEnv);

  // get()
  console.assert(nodeConfig.get("NODE_ENV") === "test", "get should return value");
  console.assert(nodeConfig.get("CUSTOM_VAR") === "custom-value", "get should return custom value");
  console.assert(nodeConfig.get("EMPTY_VAR") === undefined, "get should treat empty as undefined");
  console.log("   ✅ get() works correctly (empty strings treated as undefined)");

  // has()
  console.assert(nodeConfig.has("NODE_ENV") === true, "has should return true");
  console.assert(nodeConfig.has("EMPTY_VAR") === false, "has should return false for empty");
  console.log("   ✅ has() works correctly");

  console.log();

  // ─── Test ConfigurationError ─────────────────────────────────────────────────
  console.log("3. ConfigurationError:");

  const error = new ConfigurationError("MISSING_KEY");
  console.assert(error.name === "ConfigurationError", "name should be ConfigurationError");
  console.assert(error.key === "MISSING_KEY", "key should be stored");
  console.assert(error.message.includes("MISSING_KEY"), "message should include key");
  console.log(`   ✅ ConfigurationError created: "${error.message}"`);

  console.log();
  console.log("========================================================");
  console.log(" ALL TESTS PASSED!");
  console.log("========================================================");
}

runTests().catch(console.error);
