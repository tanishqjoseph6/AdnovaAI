import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deleteContentItem,
  generationContentFromRow,
  restoreOriginalContentItem,
  toggleSavedContentItem,
  updateContentItem,
} from "@/lib/content-editor/generation-content";
import { contentItemKey } from "@/lib/content-editor/types";

describe("generation content editor", () => {
  it("preserves original content when editing current content", () => {
    const content = generationContentFromRow({
      hooks: ["Original hook"],
      captions: ["Original caption"],
      ctas: ["Buy now"],
      ugc_script: "Original script",
    });

    const edited = updateContentItem(content, "hook", "Edited hook", 0);

    assert.equal(edited.hooks[0], "Edited hook");
    assert.equal(edited.originalHooks[0], "Original hook");
  });

  it("restores an edited item to the original version", () => {
    const content = generationContentFromRow({
      hooks: ["Edited hook"],
      original_hooks: ["Original hook"],
      captions: [],
      ctas: [],
      ugc_script: "",
    });

    const restored = restoreOriginalContentItem(content, "hook", 0);

    assert.equal(restored.hooks[0], "Original hook");
  });

  it("tracks saved items by stable content keys", () => {
    const content = generationContentFromRow({
      hooks: ["Hook"],
      captions: [],
      ctas: [],
      ugc_script: "",
    });

    const saved = toggleSavedContentItem(content, "hook", true, 0);
    assert.deepEqual(saved.savedContentItems, [contentItemKey("hook", 0)]);

    const unsaved = toggleSavedContentItem(saved, "hook", false, 0);
    assert.deepEqual(unsaved.savedContentItems, []);
  });

  it("removes deleted content and clears its saved key", () => {
    const content = generationContentFromRow({
      hooks: ["One", "Two"],
      captions: [],
      ctas: [],
      ugc_script: "",
      saved_content_items: [contentItemKey("hook", 1)],
    });

    const next = deleteContentItem(content, "hook", 1);

    assert.deepEqual(next.hooks, ["One"]);
    assert.deepEqual(next.savedContentItems, []);
  });
});
