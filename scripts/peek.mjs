import fs from "node:fs";
const dir = "C:\\Users\\anton\\OneDrive\\Documentos\\Unsa\\enfermeria-hub\\apps\\web\\src\\stitch";
const [,, file, pattern, before = 200, after = 1500] = process.argv;
const c = fs.readFileSync(`${dir}/${file}`, "utf8");
const re = new RegExp(pattern, "g");
let m; let n = 0;
while ((m = re.exec(c)) && n < 6) {
  n++;
  console.log(`--- match ${n} @${m.index} ---`);
  console.log(JSON.stringify(c.slice(Math.max(0, m.index - Number(before)), m.index + m[0].length + Number(after))));
}
