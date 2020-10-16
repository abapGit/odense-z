import * as abaplint from "@abaplint/core";
import * as fs from "fs";
import * as path from "path";
import * as fsExtra from "fs-extra";
import * as glob from "glob";

// todo: most of this code will be added to @abaplint/cli, currently just testing
// todo: load the right config

const reg = new abaplint.Registry();
fsExtra.removeSync("abapGit_cl");
fs.mkdirSync("abapGit_cl");

function load() {
  console.log("Loading Source");
  const base = "abapGit_zcl/src/";
  const files: string[] = glob.sync(base + "**/*.*", {nosort: true, nodir: true});
  for (const f of files) {
    if (f.endsWith(".devc.xml") || f.includes(".testclasses.") || f.includes(".tran.") || f.includes(".fugr.") || f.includes(".prog.")) {
      continue;
    }
    const raw = fs.readFileSync(f, "utf8");
    const file = new abaplint.MemoryFile(f.substr(base.length), raw);
    reg.addFile(file);
  }
  console.log("\t" + reg.getObjectCount() + " objects loaded");
}

function loadDeps() {
  console.log("Loading Deps");
  const base = "deps/src/";
  const files: string[] = glob.sync(base + "**/*.*", {nosort: true, nodir: true});
  const list: abaplint.MemoryFile[] = [];
  for (const f of files) {
    const raw = fs.readFileSync(f, "utf8");
    list.push(new abaplint.MemoryFile(f.substr(base.length), raw));
  }
  reg.addDependencies(list);
  console.log("\t" + list.length + " files loaded");
}

function parse() {
  console.log("Parsing Start");
  reg.parse();
  console.log("Parsing Done");

  console.log("Finding Issues");
  const issues = reg.findIssues();
  for (const i of issues) {
    if (i.getKey() === "unknown_types" || i.getKey() === "check_syntax") {
      console.log(i.getFilename() + ", " + i.getMessage() + ", " + i.getKey());
    }
  }
  console.log("\t" + issues.length + " issues found");
}

function rename() {
  const renamer = new abaplint.Rename(reg);

  for (const o of reg.getObjects()) {
    if (reg.isDependency(o) === true) {
      continue;
    }
    if (o.getType() === "CLAS" || o.getType() === "INTF") {
      const oldName = o.getName();
      console.log("Renaming " + oldName);
      const newName = oldName.substr(1);
      renamer.rename(o.getType(), oldName, newName);
    }
  }

  /*
  renamer.rename("INTF", "zif_abapgit_auth", "if_abapgit_auth");
  renamer.rename("INTF", "zif_abapgit_tadir", "if_abapgit_tadir");
  renamer.rename("INTF", "zif_abapgit_version", "if_abapgit_version");
  renamer.rename("INTF", "zif_abapgit_html_viewer", "if_abapgit_html_viewer");
  renamer.rename("INTF", "zif_abapgit_gui_functions", "if_abapgit_gui_functions");
  renamer.rename("INTF", "zif_abapgit_branch_overview", "if_abapgit_branch_overview");
  renamer.rename("INTF", "zif_abapgit_sap_package", "if_abapgit_sap_package");
  renamer.rename("INTF", "zif_abapgit_stage_logic", "if_abapgit_stage_logic");
  renamer.rename("INTF", "zif_abapgit_git_operations", "if_abapgit_git_operations");
  renamer.rename("INTF", "zif_abapgit_html", "if_abapgit_html");
  renamer.rename("INTF", "zif_abapgit_environment", "if_abapgit_environment");
  renamer.rename("INTF", "zif_abapgit_repo_srv", "if_abapgit_repo_srv");
  renamer.rename("INTF", "zif_abapgit_code_inspector", "if_abapgit_code_inspector");
  renamer.rename("INTF", "zif_abapgit_cts_api", "if_abapgit_cts_api");
  renamer.rename("INTF", "zif_abapgit_definitions", "if_abapgit_definitions");
  */

  /*
  renamer.rename("CLAS", "zcl_abapgit_repo", "cl_abapgit_repo");
  renamer.rename("CLAS", "zcl_abapgit_auth", "cl_abapgit_auth");
  renamer.rename("CLAS", "zcl_abapgit_branch_overview", "cl_abapgit_branch_overview");
  renamer.rename("CLAS", "zcl_abapgit_dependencies", "cl_abapgit_dependencies");
  renamer.rename("CLAS", "zcl_abapgit_transport", "cl_abapgit_transport");
  renamer.rename("CLAS", "zcl_abapgit_performance_test", "cl_abapgit_performance_test");
  renamer.rename("CLAS", "zcl_abapgit_news", "cl_abapgit_news");
  renamer.rename("CLAS", "zcl_abapgit_zip", "cl_abapgit_zip");
  renamer.rename("CLAS", "zcl_abapgit_environment", "cl_abapgit_environment");
  renamer.rename("CLAS", "zcl_abapgit_folder_logic", "cl_abapgit_folder_logic");
  renamer.rename("CLAS", "zcl_abapgit_code_inspector", "cl_abapgit_code_inspector");
  renamer.rename("CLAS", "zcl_abapgit_repo_srv", "cl_abapgit_repo_srv");
  renamer.rename("CLAS", "zcl_abapgit_serialize", "cl_abapgit_serialize");
  */
}

function save() {
  console.log("Saving Files");
  const base = "abapGit_cl/";
  for (const o of reg.getObjects()) {
    if (reg.isDependency(o) === true) {
      continue;
    }
    for (const f of o.getFiles()) {
      const n = base + f.getFilename();
      fsExtra.ensureDirSync(path.dirname(n));
      fs.writeFileSync(n, f.getRaw());
    }
  }
}

load();
loadDeps();
parse();
rename();
save();
