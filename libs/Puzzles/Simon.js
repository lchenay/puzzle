import puppeteer from 'puppeteer';
import crypto from 'crypto';
import { Puzzle } from './Puzzle.js';
import Bluebird from 'bluebird';
import { exec as execCallback } from 'child_process';
const exec = Bluebird.promisify(execCallback);

export class Simon extends Puzzle {

    constructor(name, version, level, size) {
        super(`${name}_${version}_${level}_${size}_simon`)
        this.name = name;
        this.version = version;
        this.level = level;
        this.size = size;
    }

    async generate() {
        const destination = `${this.getTmpDir()}/${crypto.randomBytes(20).toString('hex')}_${this.key}.png`

        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        await page.setViewport({width: 2000, height: 2000, deviceScaleFactor: 4});
        await page.goto(`https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/${this.name}.html#${this.version}`, {waitUntil: 'networkidle2'});

        await page.waitForSelector('#puzzlecanvas');          // wait for the selector to load

        await page.waitForSelector('#apology', {visible: false});
        await page.waitForSelector('#puzzlecanvas', {visible: true});
        await page.waitForSelector('#resizehandle', {visible: true});
        
        await page.evaluate(() => {
            let dom = document.querySelector('canvas:not(#puzzlecanvas)');
            if (dom) dom.style.display = "none";
        });

        // generate random hash
        const hash = crypto.randomBytes(20).toString('hex');
        const tmp = `${this.getTmpDir()}/${this.name}_${this.version}_${hash}.png`;
        const element = await page.$('#puzzlecanvas');        // declare a variable with an ElementHandle
        await element.screenshot({ path: tmp });

        await browser.close();

        await exec(`convert ${tmp} \
            -fuzz 25% -fill white -opaque 'rgb(208,207,67)' \
            -fuzz 0% -fill white -opaque 'rgb(230,230,230)' \
            -fuzz 0% -fill white -opaque 'rgb(213,213,213)' \
            -fuzz 0% -fill white -opaque 'rgb(212,212,212)' \
            -fuzz 0% -fill white -opaque 'rgb(172,172,172)'\
            -flatten -fuzz 5% +repage \
            -background white -pointsize 20 -fill '#000'  -gravity Center -append \
            ${destination}`);
        //-bordercolor none -border 500x500 \

        await exec(`rm ${tmp}`);
        return destination;
    }

    static all() {
        const puzzles = [];
        
        puzzles.push(new Simon("bridges",`15x15i30e10m2d0`, "easy", `15x15`));
        puzzles.push(new Simon("solo",`3x3dd`, "normal", `3x3`));

        puzzles.push(new Simon("magnets",`8x8de`, "easy", `8x8`));

        puzzles.push(new Simon("tents",`8x8de`, "easy", `8x8`));

        puzzles.push(new Simon("tents", "10x10de", "easy", "10x10"))
        puzzles.push(new Simon("tents", "10x10dt", "hard", "10x10"))

        puzzles.push(new Simon("tracks", "10x10de", "easy", "10x10"))
        puzzles.push(new Simon("tracks", "10x10dt", "hard", "10x10"))

        puzzles.push(new Simon("lightup", "7x7b20s4d0", "easy", "7x7"))
        puzzles.push(new Simon("lightup", "10x10b20s4d0", "easy", "10x10"))
        puzzles.push(new Simon("lightup", "14x14b20s4d0", "easy", "14x14"))

        puzzles.push(new Simon("lightup", "7x7b20s4d1", "tricky", "7x7"))
        puzzles.push(new Simon("lightup", "10x10b20s4d1", "tricky", "10x10"))
        puzzles.push(new Simon("lightup", "14x14b20s4d1", "tricky", "14x14"))

        puzzles.push(new Simon("filling", "9x7", "easy", "9x7"))
        puzzles.push(new Simon("filling", "13x9", "medium", "13x9"))
        puzzles.push(new Simon("filling", "17x13", "hard", "17x13"))

        for (let size of [3, 4, 5, 6, 7, 8, 9, 10]) {
            puzzles.push(new Simon("loopy",`${size}x${size}t0dh`, "hard", `${size}x${size}`));
        }

        for (let size of [10, 15, 20, 25, 30]) {
            puzzles.push(new Simon("loopy",`${size}x${size}t0dn`, "normal", `${size}x${size}`));
        }

        return puzzles;
    }
}