#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Command } from 'commander';

const program = new Command();

program
  .name('create-react-express-app')
  .description('CLI to create a React app with an Express backend using Vite')
  .argument('<app-name>', 'Name of the app')
  .action(async (appName) => {
    const appPath = path.join(process.cwd(), appName);

    if (fs.existsSync(appPath)) {
      console.log(chalk.red(`Directory ${appName} already exists.`));
      process.exit(1);
    }

    console.log(chalk.green(`Creating project in ${appPath}...`));
    fs.mkdirSync(appPath);

    // Step 1: Initialize npm project
    console.log(chalk.blue('Initializing npm project...'));
    execSync('npm init -y', { cwd: appPath });

    // Step 2: Install dependencies
    console.log(chalk.blue('Installing dependencies...'));
    const dependencies = ['react', 'react-dom', 'express'];
    const devDependencies = ['vite', '@vitejs/plugin-react'];
    execSync(`npm install ${dependencies.join(' ')}`, { cwd: appPath });
    execSync(`npm install --save-dev ${devDependencies.join(' ')}`, { cwd: appPath });

    // Step 3: Set up project structure
    console.log(chalk.blue('Setting up project structure...'));
    const files = {
      'server.js': `
import express from 'express';
import { join } from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(process.cwd(), 'dist')));

  app.get('*', (req, res) => {
    res.sendFile(join(process.cwd(), 'dist', 'index.html'));
  });
} else {
  console.log('In development mode. Use Vite for the frontend.');
}

app.listen(PORT, () => {
  console.log('Server is running on http://localhost:'+PORT);
});
      `,
      'vite.config.js': `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/api/, ''),
      },
    },
  },
});
      `,
      'index.html': `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.jsx"></script>
  </body>
</html>
      `,
      'src/index.jsx': `
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
      `,
      'src/App.jsx': `
import React from 'react';

const App = () => {
  return <h1>Hello, Vite + React!</h1>;
};

export default App;
      `,
    };

    fs.mkdirSync(path.join(appPath, 'src'), { recursive: true });

    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(appPath, filePath);
      fs.outputFileSync(fullPath, content.trim());
    }

    // Step 4: Add scripts to package.json
    console.log(chalk.blue('Updating package.json...'));
    const packageJsonPath = path.join(appPath, 'package.json');
    const packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.type = 'module';
    packageJson.scripts = {
      dev: 'vite',
      build: 'vite build',
      start: 'NODE_ENV=production node server.js',
    };
    fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });

    console.log(chalk.green('Project created successfully!'));
    console.log(chalk.blue(`Run the following commands to get started:`));
    console.log(chalk.yellow(`cd ${appName}`));
    console.log(chalk.yellow('npm run dev'));
  });

program.parse(process.argv);
