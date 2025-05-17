/* eslint-disable @typescript-eslint/no-require-imports */
const { readExcelFile, writeExcelFile } = require('./readExcel');
// const fs = require('fs');

try {
  // Read data from Excel file
  const data = readExcelFile('english.xlsx', { sheet: 'Vocabulary' });

  const newData = data.map((item) => {
    let mean = item.Mean;
    let word = item.Word;
    if (mean === null) {
      mean = item.Word.split('(')[1].split(')')[0];
      word = item.Word.split('(')[0].trim();
    }
    return {
      word: word,
      mean: mean,
      description: item.Description,
      antonym: item.Antonym,
      synonyms: item.Synonyms,
      v1: item.V1,
      v2: item.V2,
      v3: item.V3,
      exampleSentence1: item['Example Sentence 1'],
      exampleSentence2: item['Example Sentence 2'],
      exampleSentence3: item['Example Sentence 3'],
    };
  });
  
  // write to json
  // fs.writeFileSync('output.json', JSON.stringify(newData));

  // write to excel
  writeExcelFile('output.xlsx', newData);
} catch (error) {
  console.error('Excel operation failed:', error.message);
}