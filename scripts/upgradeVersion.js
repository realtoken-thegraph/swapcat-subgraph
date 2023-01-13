const path = require("path");
const fs = require("fs");

const file = path.join(__dirname, "/../src/helpers/version.ts");

fs.readFile(file, null, (err, data) => {
  if (err) throw err;
  const regexp = new RegExp(/\d+/); // find one or more digits
  const content = data.toString();
  const number = +regexp.exec(content)[0] + 1;
  const newValue = `export const VERSION = ${number};`;
  fs.writeFile(file, newValue, err => {
    if (err) throw err;
    console.log("Version upgrade complete");
  });
});
