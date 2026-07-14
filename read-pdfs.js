const fs = require('fs');
const pdf = require('pdf-parse');

async function read(path) {
  let dataBuffer = fs.readFileSync(path);
  let data = await pdf(dataBuffer);
  console.log('--- ' + path + ' ---');
  console.log(data.text.substring(0, 2000)); // Print first 2000 chars to avoid overwhelming
}

(async () => {
  await read('c:\\Dev\\vibraweb\\Docs Numerologia\\06a25-introducao-as-profissoes-harmoniosas (1).pdf');
  await read('c:\\Dev\\vibraweb\\Docs Numerologia\\6a739-metodo-2-pela-convergencia (1).pdf');
  await read('c:\\Dev\\vibraweb\\Docs Numerologia\\fae21-metodo-1-pela-expressao (1).pdf');
})();
