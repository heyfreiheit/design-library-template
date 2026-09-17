import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {chromium} from '@playwright/test';
import sharp from 'sharp';
import {loadModule} from './load-module.mjs';
const browser=await puppeteer.launch({executablePath:process.env.TEST_BROWSER_PATH||chromium.executablePath(),headless:true,args:['--no-sandbox']});
let checked=false;
const html='<!doctype html><html><body style="margin:0;background:#ece9df"><main style="height:3200px"><h1 style="margin:0;padding:100px">Screenshot-Test</h1><section style="margin-top:900px;background:#173145;color:white;padding:100px">Seitenmitte</section><footer style="position:absolute;top:3000px">Seitenende</footer></main><div role="dialog" id="cookie-banner" style="position:fixed;inset:0;background:black;color:white;z-index:99">Diese Website verwendet Cookies<button onclick="document.querySelector(\'#cookie-banner\').remove()">Alle ablehnen</button></div></body></html>';
const proxy={newPage:async()=>{const page=await browser.newPage();await page.setRequestInterception(true);page.on('request',r=>{if(!r.isInterceptResolutionHandled())void r.respond({status:200,contentType:'text/html',body:html});});return page;},close:async()=>{for(const page of await browser.pages())if(page.url().includes('fixture.example')){assert.equal(await page.$('#cookie-banner'),null);checked=true;}await browser.close();}};
const {captureWebsite}=loadModule('lib/capture-server.ts',{'puppeteer-core':{connect:async()=>proxy},'./analysis-server':{analysisConfig:async()=>({browserKey:'test-only',browserRegion:'production-ams.browserless.io'})}});
try{const capture=await captureWebsite('https://fixture.example/');assert(checked);assert.equal(capture.width,1440);assert.equal(capture.height,3200);assert(capture.bytes.length<3*1024*1024);const metadata=await sharp(capture.bytes).metadata();assert.equal(metadata.width,1440);assert.equal(metadata.height,3200);assert.equal(metadata.format,'jpeg');console.log('PASS: real browser fixture, cookie rejection, full-page scroll/capture, dimensions and JPEG compression. Remote Browserless connection is mocked.');}finally{await browser.close().catch(()=>{});}
