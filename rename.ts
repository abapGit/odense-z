import * as abaplint from "@abaplint/core";
import * as fs from "fs";
import * as path from "path";
import * as fsExtra from "fs-extra";
import * as glob from "glob";

const reg = new abaplint.Registry();
fsExtra.removeSync("abapGit_cl");
fs.mkdirSync("abapGit_cl");

function load() {
  console.log("Loading Files");
  const base = "abapGit_zcl/src/";
  const files: string[] = glob.sync(base + "**/*.*", {nosort: true, nodir: true});
  for (const f of files) {
    if (f.endsWith(".devc.xml") || f.endsWith(".testclasses.abap") || f.includes(".fugr.")) {
      continue;
    }
    const raw = fs.readFileSync(f, "utf8");
    const file = new abaplint.MemoryFile(f.substr(base.length), raw);
    reg.addFile(file);
  }
  console.log(reg.getObjectCount() + " objects loaded");
}

function parse() {
  console.log("Parsing Start");
  reg.parse();
  console.log("Parsing Done");
}

function rename() {
  const renamer = new abaplint.Rename(reg);
//  renamer.rename("CLAS", "zcl_abapgit_repo", "cl_abapgit_repo");
  renamer.rename("CLAS", "zcl_abapgit_auth", "cl_abapgit_auth");
}

function save() {
  console.log("Saving Files");
  const base = "abapGit_cl/";
  for (const f of reg.getFiles()) {
    const n = base + f.getFilename();
    fsExtra.ensureDirSync(path.dirname(n));
    fs.writeFileSync(n, f.getRaw());
  }
}

load();
parse();
rename();
save();
