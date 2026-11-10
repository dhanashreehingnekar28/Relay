import {defineConfig} from '@playwright/test';
import {existsSync} from 'node:fs';
const address=process.env.RELAY_TEST_URL || 'http://127.0.0.1:5173';
export default defineConfig({testDir:'tests',workers:1,timeout:120000,use:{baseURL:address,headless:true,launchOptions:existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{}},webServer:process.env.RELAY_TEST_URL?undefined:{command:'node scripts/test-server.js',url:address,timeout:60000}});
