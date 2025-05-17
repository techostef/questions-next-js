/**
 * Excel file reader utility
 * This module provides functions to read data from Excel files
 */

import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

/**
 * Read data from an Excel file
 * @param {string} filePath - Path to the Excel file
 * @param {object} options - Options for reading the file
 * @param {string} [options.sheet] - Sheet name to read (defaults to first sheet)
 * @param {boolean} [options.header=true] - Whether the first row contains headers
 * @param {boolean} [options.raw=false] - Whether to return raw data or formatted values
 * @returns {Array<object>} Array of objects containing the Excel data
 */
function readExcelFile(filePath, options = {}) {
  try {
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Verify file is an Excel file
    const ext = path.extname(filePath).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      throw new Error(`Unsupported file format: ${ext}. Expected .xlsx, .xls, or .csv`);
    }

    // Read the workbook
    const workbook = xlsx.readFile(filePath, { raw: options.raw !== false });

    // Determine which sheet to read
    const sheetName = options.sheet || workbook.SheetNames[0];
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(`Sheet "${sheetName}" not found in workbook`);
    }

    // Get the worksheet
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet, {
      header: options.header === false ? 1 : undefined,
      raw: options.raw !== false,
      defval: null // Use null for empty cells
    });

    return jsonData;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

/**
 * Get a list of sheet names from an Excel file
 * @param {string} filePath - Path to the Excel file
 * @returns {Array<string>} Array of sheet names
 */
function getExcelSheets(filePath) {
  try {
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read the workbook (with minimal processing)
    const workbook = xlsx.readFile(filePath, { bookSheets: true });
    
    // Return the sheet names
    return workbook.SheetNames;
  } catch (error) {
    console.error('Error getting Excel sheets:', error);
    throw error;
  }
}

/**
 * Save data to an Excel file
 * @param {string} filePath - Path where the Excel file will be saved
 * @param {Array<object>} data - Array of objects to save
 * @param {object} options - Options for saving the file
 * @param {string} [options.sheet='Sheet1'] - Sheet name
 * @returns {boolean} Success indicator
 */
function writeExcelFile(filePath, data, options = {}) {
  try {
    // Create a new workbook
    const workbook = xlsx.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = xlsx.utils.json_to_sheet(data);
    
    // Add the worksheet to the workbook
    const sheetName = options.sheet || 'Sheet1';
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Write to file
    xlsx.writeFile(workbook, filePath);
    
    return true;
  } catch (error) {
    console.error('Error writing Excel file:', error);
    throw error;
  }
}

export {
  readExcelFile,
  getExcelSheets,
  writeExcelFile
};

// Example usage:
/*
try {
  // Read data from Excel file
  const data = readExcelFile('path/to/file.xlsx', { sheet: 'Sheet1' });
  console.log('Excel data:', data);
  
  // Get list of sheets
  const sheets = getExcelSheets('path/to/file.xlsx');
  console.log('Available sheets:', sheets);
  
  // Write data to Excel file
  const newData = [
    { name: 'John', age: 30 },
    { name: 'Jane', age: 25 }
  ];
  writeExcelFile('path/to/output.xlsx', newData);
} catch (error) {
  console.error('Excel operation failed:', error.message);
}
*/