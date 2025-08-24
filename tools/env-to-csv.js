#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the .env.production file
const envFile = path.join(__dirname, '../.env.production');
const csvFile = path.join(__dirname, '../env-production.csv');

try {
  const content = fs.readFileSync(envFile, 'utf8');
  
  // Parse environment variables
  const lines = content.split('\n');
  const csvRows = ['Key,Value']; // CSV header
  
  lines.forEach(line => {
    // Skip comments and empty lines
    if (line.trim() && !line.trim().startsWith('#')) {
      // Match KEY="VALUE" or KEY=VALUE pattern
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match) {
        const key = match[1];
        let value = match[2];
        
        // Remove surrounding quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        // Escape quotes in value for CSV
        value = value.replace(/"/g, '""');
        
        // Add to CSV with proper quoting
        csvRows.push(`${key},"${value}"`);
      }
    }
  });
  
  // Write to CSV file
  fs.writeFileSync(csvFile, csvRows.join('\n'));
  
  console.log(`✅ CSV file created: ${csvFile}`);
  console.log(`📊 Total environment variables: ${csvRows.length - 1}`);
  
  // Show first few lines as preview
  console.log('\n📋 Preview (first 5 entries):');
  csvRows.slice(0, 6).forEach(row => console.log(row.substring(0, 100) + (row.length > 100 ? '...' : '')));
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}