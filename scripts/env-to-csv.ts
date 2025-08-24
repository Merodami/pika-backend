#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Read the .env.production file
const envFile = path.join(__dirname, '../.env.production')
const csvFile = path.join(__dirname, '../env-production.csv')

try {
  const content = fs.readFileSync(envFile, 'utf8')
  
  // Parse environment variables
  const lines = content.split('\n')
  const csvRows: string[] = ['Key,Value'] // CSV header
  
  lines.forEach(line => {
    // Skip comments and empty lines
    if (line.trim() && !line.trim().startsWith('#')) {
      // Match KEY="VALUE" or KEY=VALUE pattern
      const match = line.match(/^([A-Z_]+)=(.*)$/)
      if (match) {
        const key = match[1]
        let value = match[2]
        
        // Remove surrounding quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1)
        }
        
        // Escape quotes in value for CSV
        value = value.replace(/"/g, '""')
        
        // Add to CSV with proper quoting
        csvRows.push(`${key},"${value}"`)
      }
    }
  })
  
  // Write to CSV file
  fs.writeFileSync(csvFile, csvRows.join('\n'))
  
  console.log(`✅ CSV file created: ${csvFile}`)
  console.log(`📊 Total environment variables: ${csvRows.length - 1}`)
  
  // Show first few lines as preview
  console.log('\n📋 Preview (first 10 entries):')
  csvRows.slice(0, 11).forEach(row => {
    if (row.length > 120) {
      console.log(row.substring(0, 120) + '...')
    } else {
      console.log(row)
    }
  })
  
  console.log('\n✅ Full CSV saved to: env-production.csv')
  
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error')
  process.exit(1)
}