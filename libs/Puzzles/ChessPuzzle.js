import {Puzzle} from './Puzzle.js';
import puppeteer from 'puppeteer';
import crypto from 'crypto';
import Bluebird from 'bluebird';
import { exec as execCallback } from 'child_process';
const exec = Bluebird.promisify(execCallback);

const rn = max => Math.ceil(Math.random()*(max-1))

export class ChessPuzzle extends Puzzle {
    constructor() {
        super(`chess_puzzle`);

    }

    async generate() {
        const url = `https://chesspuzzle.net/Puzzle/`
        const destination = `${this.getTmpDir()}/${crypto.randomBytes(20).toString('hex')}_${this.key}.png`

        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        await page.setViewport({width: 260, height: 600, deviceScaleFactor: 2});
        await page.goto(url, {waitUntil: 'networkidle2'});

        await page.waitForSelector('div[role="dialog"] button[mode="primary"]');

        await page.click('div[role="dialog"] button[mode="primary"]');

        await page.evaluate(() => {
            let example = document.querySelector('#chesspuzzle_mobile_leaderboard');
            example.parentNode.removeChild(example);

            example = document.querySelector('.speedmode');
            example.parentNode.removeChild(example);
          });

        await page.waitForSelector('#puzzlecontent');

        await Bluebird.delay(1000)

        const element = await page.$('#puzzlecontent');

        await element.screenshot({ path: destination });

        await browser.close();

        return destination;
    }

    static all() {
        const puzzles = [];
        
        puzzles.push(new ChessPuzzle());

        return puzzles;
    }
}