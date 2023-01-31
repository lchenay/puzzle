import {Puzzle} from './Puzzle.js';
import puppeteer from 'puppeteer';
import crypto from 'crypto';
import Bluebird from 'bluebird';
import { exec as execCallback } from 'child_process';
const exec = Bluebird.promisify(execCallback);

const rn = max => Math.ceil(Math.random()*(max-1))

export class Krazydad extends Puzzle {
    constructor(name, version, difficulty, volume = 5, book = 30, puzzle = 8) {
        super(`${name}_${difficulty}_${version}_krazydad`);
        this.name = name;
        this.version = version;
        this.difficulty = difficulty;
        this.volume = volume;
        this.book = book;
        this.puzzle = puzzle;
    }

    async generate() {
        const url = `https://krazydad.com/play/${this.name}/?kind=${this.version}&volumeNumber=${rn(this.volume)}&bookNumber=${rn(this.book)}&puzzleNumber=${rn(this.puzzle)}`
        const destination = `${this.getTmpDir()}/${crypto.randomBytes(20).toString('hex')}_${this.key}.png`

        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        await page.setViewport({width: 2000, height: 2000, deviceScaleFactor: 2});
        await page.goto(url, {waitUntil: 'networkidle2'});

        await page.waitForSelector('.unselectable');

        await Bluebird.delay(1000)

        const element = await page.$('.unselectable');

        await element.screenshot({ path: destination });

        /*
        await exec(`convert tmp/${this.name}_${this.version}_.png \
            -bordercolor none -border 500x500 \
            ${destination}`);
        await exec(`rm tmp/${this.name}_${this.version}_.png`);
        */

        await browser.close();

        return destination;
    }

    static all() {
        const puzzles = [];
        
        puzzles.push(new Krazydad("suguru", "8x8", "easy"));
        puzzles.push(new Krazydad("suguru", "12x10", "medium"));
        puzzles.push(new Krazydad("suguru", "15x10", "hard"));
        puzzles.push(new Krazydad("suguru", "15x10n6", "hard"));

        puzzles.push(new Krazydad("suguru", "8x8", "easy"))
        puzzles.push(new Krazydad("suguru", "12x10", "medium"))
        puzzles.push(new Krazydad("suguru", "15x10", "hard"))
        puzzles.push(new Krazydad("suguru", "15x10n6", "hard"))

        puzzles.push(new Krazydad("starbattle", "8x8", "easy"))
        puzzles.push(new Krazydad("starbattle", "10x10", "medium"))
        puzzles.push(new Krazydad("starbattle", "14x14", "hard"))

        puzzles.push(new Krazydad("corral", "8x8_d1", "easy"))

        puzzles.push(new Krazydad("vslitherlink", "hexagons_sm_d2", "medium"))
        puzzles.push(new Krazydad("vslitherlink", "hexagons_lg_d2", "medium"))
        puzzles.push(new Krazydad("vslitherlink", "snubsquare_md_d2", "medium"))
        puzzles.push(new Krazydad("vslitherlink", "laves_sm_d2", "medium"))
        puzzles.push(new Krazydad("vslitherlink", "rhombille1_md_d2", "medium"))
        puzzles.push(new Krazydad("vslitherlink", "cairo_md_d2", "medium"))
        puzzles.push(new Krazydad("vslitherlink", "penrose_sm_d2", "medium"))
        puzzles.push(new Krazydad("vslitherlink", "altair_smsq_d2", "medium"))
        puzzles.push(new Krazydad("vslitherlink", "floret_md_d2", "medium"))

        puzzles.push(new Krazydad("ripple", "EZ_7x7", "easy"))
        puzzles.push(new Krazydad("ripple", "CH_8x8", "medium"))
        puzzles.push(new Krazydad("ripple", "TF_8x8", "hard"))

        return puzzles;
    }
}