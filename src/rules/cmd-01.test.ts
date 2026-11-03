/**
 * src/rules/cmd-01.test.ts — destructive wipe hard-block.
 * rm -rf on / ~ $HOME /root .git and recursive chmod 777 fail;
 * scoped deletes, safe perms, and docs pass.
 * Run: bun test src/rules/cmd-01.test.ts
 */
import { describe, it, expect } from "bun:test";
import { check } from "./cmd-01";

describe("CMD-01", () => {
  it("fails root/home/.git wipes in live shell", () => {
    for (const cmd of [
      "rm -rf /",
      "rm -rf /*",
      "sudo rm -rf /",
      "rm -fr ~",
      "rm -rf $HOME/",
      "rm --recursive --force /root",
      "rm -rf .git",
      "rm -rf ../",
    ]) {
      expect(check({ content: cmd, toolName: "bash" }).verdict, cmd).toBe("fail");
    }
  });

  it("fails recursive chmod 777, any target", () => {
    expect(check({ content: "chmod -R 777 app/", toolName: "bash" }).verdict).toBe("fail");
    expect(check({ content: "chmod 777 -R app/", toolName: "bash" }).verdict).toBe("fail");
    expect(check({ content: "sudo chmod --recursive 777 .", toolName: "bash" }).verdict).toBe("fail");
  });

  it("passes scoped deletes and safe perms", () => {
    for (const cmd of ["rm -rf dist/", "rm -rf /tmp/build", "rm -rf ~/.cache/app", "rm -rf $HOME/scratch", "rm README.md", "rm -r node_modules"]) {
      expect(check({ content: cmd, toolName: "bash" }).verdict, cmd).toBe("pass");
    }
    expect(check({ content: "chmod -R 755 app/", toolName: "bash" }).verdict).toBe("pass");
    expect(check({ content: "chmod 777 one-file.sh", toolName: "bash" }).verdict).toBe("pass");
  });

  it("fires in scripts, passes in docs and non-shell tools", () => {
    expect(check({ content: "rm -rf /\n", filePath: "clean.sh" }).verdict).toBe("fail");
    expect(check({ content: "never run rm -rf / on shared boxes", filePath: "guide.md" }).verdict).toBe("pass");
    expect(check({ content: "rm -rf /", toolName: "write" }).verdict).toBe("pass");
  });

  it("is unknown on empty content", () => {
    expect(check({}).verdict).toBe("unknown");
  });
});
