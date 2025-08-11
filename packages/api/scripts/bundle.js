#!/usr/bin/env node

import * as esbuild from 'esbuild'
import { readdir, stat, readFile, writeFile } from 'fs/promises'
import { join, relative } from 'path'

/**
 * Bundle @pika/api with @pika/types included
 * This creates a self-contained package that doesn't require @pika/types as a dependency
 */

async function fixTypeImports(dir) {
  const files = await readdir(dir, { recursive: true })
  
  for (const file of files) {
    if (file.endsWith('.d.ts')) {
      const filePath = join(dir, file)
      let content = await readFile(filePath, 'utf-8')
      
      // Replace @pika/types with @merodami/pika-types in declaration files
      if (content.includes('@pika/types')) {
        content = content.replace(/@pika\/types/g, '@merodami/pika-types')
        await writeFile(filePath, content)
      }
    }
  }
}

async function getAllFiles(dir, fileList = []) {
  const files = await readdir(dir)
  
  for (const file of files) {
    const filePath = join(dir, file)
    const fileStat = await stat(filePath)
    
    if (fileStat.isDirectory()) {
      await getAllFiles(filePath, fileList)
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) {
      fileList.push(filePath)
    }
  }
  
  return fileList
}

async function bundle() {
  const srcDir = join(process.cwd(), 'src')
  const outDir = join(process.cwd(), 'dist')
  
  // Get all TypeScript files
  const entryPoints = await getAllFiles(srcDir)
  
  // Filter out script files
  const filteredEntryPoints = entryPoints.filter(
    file => !file.includes('/scripts/')
  )
  
  console.log(`📦 Bundling ${filteredEntryPoints.length} files...`)
  
  try {
    // Build with esbuild
    const result = await esbuild.build({
      entryPoints: filteredEntryPoints,
      outdir: outDir,
      platform: 'node',
      format: 'esm',
      target: 'node20',
      bundle: true, // Bundle to inline @pika/types
      external: [
        // Explicitly list external packages (everything except @pika/types)
        'zod',
        '@asteasolutions/zod-to-openapi', 
        'lodash-es',
        '@pika/environment',
        // Node built-ins
        'fs',
        'path',
        'crypto',
        'util',
        'child_process',
        'events',
        'stream',
        'buffer',
        'url',
        'querystring',
        'http',
        'https',
        'os',
        'assert',
        'tty',
        'net',
        'dns',
        'readline',
        'vm',
        'cluster',
        'worker_threads',
        'perf_hooks',
        'async_hooks',
        'inspector',
        'trace_events',
      ],
      // @pika/types is NOT in the external list, so it will be bundled
      splitting: false,
      sourcemap: false,
      treeShaking: true,
      keepNames: true,
      outExtension: { '.js': '.js' },
      // Maintain directory structure
      outbase: srcDir,
      metafile: true,
      write: true,
    })
    
    // Log bundled modules
    if (result.metafile) {
      const bundledModules = Object.keys(result.metafile.inputs).filter(
        key => key.includes('node_modules/@pika/types')
      )
      if (bundledModules.length > 0) {
        console.log(`📦 Bundled @pika/types modules: ${bundledModules.length}`)
      }
    }
    
    console.log('✅ Bundle created successfully!')
    
    // Now generate TypeScript declarations
    console.log('📝 Generating TypeScript declarations...')
    
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execPromise = promisify(exec)
    
    // First compile TypeScript to get .d.ts files
    await execPromise('yarn tsc -p tsconfig.build.json --emitDeclarationOnly')
    
    // Then use tsc-alias to fix path aliases in .d.ts files
    await execPromise('yarn tsc-alias -p tsconfig.build.json')
    
    console.log('✅ TypeScript declarations generated!')
    
    // Fix imports in .d.ts files - replace @pika/types with @merodami/pika-types
    console.log('🔧 Fixing type imports in declaration files...')
    await fixTypeImports(outDir)
    console.log('✅ Type imports fixed!')
    
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

// Run the bundler
bundle()