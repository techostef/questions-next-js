/* eslint-disable @typescript-eslint/no-require-imports */
const { writeExcelFile } = require('./readExcel');

// Get data from json
const data = require('./bankenglish.json');

try {
  const newData = data.map((item) => {
    let mean = item.mean;
    let word = item.word;
    if (mean === null) {
      mean = item.word.split('(')[1].split(')')[0];
      word = item.word.split('(')[0].trim();
    }
    return {
      word: word,
      mean: mean,
      description: item.description,
      antonym: item.antonym,
      synonyms: item.synonyms,
      v1: item.v1,
      v2: item.v2,
      v3: item.v3,
      exampleSentence1: item.exampleSentence1,
      exampleSentence2: item.exampleSentence2,
      exampleSentence3: item.exampleSentence3,
    };
  });
  
  // write to excel
  writeExcelFile('output.xlsx', newData);
} catch (error) {
  console.error('Excel operation failed:', error.message);
}