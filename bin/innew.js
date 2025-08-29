#!/usr/bin/env node
import('../src/init.js').catch(err => {
  console.error(err);
  process.exit(1);
});
