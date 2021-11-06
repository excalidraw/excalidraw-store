require("esbuild").buildSync({
  entryPoints: ["index.ts"],
  outfile: "build/index.js",
  bundle: true,
  platform: "node",
});
