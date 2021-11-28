require("esbuild").buildSync({
  entryPoints: ["index.ts"],
  outfile: "index.js",
  bundle: true,
  platform: "node",
});
