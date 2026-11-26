// server.js - entry point for production using ts-node

require('dotenv').config();
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

require('./src/index.ts');
