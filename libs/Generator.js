import { Simon } from './Puzzles/Simon.js';
import { Krazydad } from './Puzzles/Krazydad.js';
import { promises as fs, createWriteStream } from 'fs';
import { PuzzleStats } from './PuzzleStats.js';
import _ from 'lodash';
import os from 'os';
import crypto from 'crypto';

import Bluebird from 'bluebird';
import { exec as execCallback } from 'child_process';
const exec = Bluebird.promisify(execCallback);

import PDFDocument from 'pdfkit';
import { ChessPuzzle } from './Puzzles/ChessPuzzle.js';
import pLimit from 'p-limit';

Bluebird.retry = function(fn, nbRetry, delayBetween) {
    return Bluebird.try(fn).catch((err) => {
        if (nbRetry == 0)
            throw err;

        return Bluebird.delay(delayBetween)
            .then(() => Bluebird.retry(fn, --nbRetry, delayBetween));
    });
};

export class Generator {
    puzzles = []
    db = {
        puzzles: {},
        files: []
    }

    queue = pLimit(16);

    init() {
        this.puzzles.push(...ChessPuzzle.all());
        this.puzzles.push(...Krazydad.all());
        this.puzzles.push(...Simon.all());
    }

    async readDB() {
        if (await fs.exists('./data/db.json')) {
            this.db = JSON.parse(await fs.readFile('./data/db.json')) || {};
        }

        if (!this.db.puzzles) this.db.puzzles = {};
        if (!this.db.files) this.db.files = [];

        for (const puzzle of this.puzzles) {
            this.db.puzzles[puzzle.key] = PuzzleStats.fromData(this.db.puzzles[puzzle.key] || {});
        }
    }

    async writeDB() {
        await fs.writeFile('./data/db.json', JSON.stringify(this.db, null, 2));
    }

    async discoverNewPuzzles() {
        const current = Object.values(this.db.puzzles).filter(p => p.discover).length;
        Object.values(this.db.puzzles)
            .sort(() => Math.random() - 0.5)
            .filter(p => p.more == p.less && p.more == 0)
            .slice(0, 2 - current)
            .forEach(p => p.more = 1);
    }

    async generatePuzzles() {
        const interval = setInterval(() => {
            console.log(`Generating: ${this.queue.pendingCount} / ${this.queue.activeCount}`);
        }, 1000);

        await Bluebird.map(this.puzzles, puzzle => this.generatePuzzle(puzzle));

        clearInterval(interval);
    }

    async generatePuzzleFile(puzzle) {
        const stats = this.db.puzzles[puzzle.key];
        const file = await puzzle.generate();
        //const fileSurounded = await this.suroundPuzzle(file, puzzle.key);
        const fileSurounded = '';

        await exec(`optipng -strip all ${file}`);

        this.db.files.push({file, fileSurounded, puzzle: puzzle.key })
        stats.generated++;
    }

    async generatePuzzle(puzzle) {
        const stats = this.db.puzzles[puzzle.key];
        let toGenerate = stats.more - stats.less;

        return Bluebird.map(_.range(toGenerate), () => this.queue(() => Bluebird.retry(() => this.generatePuzzleFile(puzzle), 3, 1000)));
    }

    async sortPuzzles() {
        this.db.files = _.sortBy(this.db.files, (file) => -this.db.puzzles[file.puzzle].generated);
    }

    async suroundPuzzle(file, puzzle) {
        const doc = new PDFDocument();
        const fd = createWriteStream('output_suround.pdf');
        doc.pipe(fd);

        doc.image(file, 0, 0, {
            fit: [595, 842],
            align: 'center',
            valign: 'center'
        }).text(puzzle, {lineBreak: false})
        .text("More?" + "    " + "Less?", {align: "right"})

        doc.lineJoin('miter').rect(470, 90, 20, 20).stroke();
        doc.lineJoin('miter').rect(510, 90, 20, 20).stroke();
        doc.end();
        
        await Bluebird.delay(5000);

        const newFile = file.replace('/', '/surounded_');

        await exec(`convert -density 150 output_suround.pdf[0] -background white -alpha background -alpha off -compress zip -quality 90 ${newFile}`)
        return newFile;
    }

    async readPdf(fromPdf = true) {
        let page = 2;

        await Bluebird.map(this.db.files, async (file) => {
            const puzzle = this.puzzles.find(p => p.key === file.puzzle);
            const stats = this.db.puzzles[puzzle.key];

            // generate random key
            const key = crypto.randomBytes(20).toString('hex');
            const tmp = os.tmpdir() + '/' + key + '_';

            await exec(`pdftoppm output.pdf -f ${page} -singlefile ${tmp}extract -png`);

            await exec(`magick -extract 70x70+960+170 ${tmp}extract.png ${tmp}more.png`)
            await exec(`magick -extract 70x70+1050+170 ${tmp}extract.png ${tmp}less.png`)

            const less = await exec(`convert ${tmp}less.png txt:- | grep -v '#00000000' | grep -v '#FFFFFF' | wc -l`)
            const more = await exec(`convert ${tmp}more.png txt:- | grep -v '#00000000' | grep -v '#FFFFFF' | wc -l`)

            if (less > 700) {
                stats.less++;
            } else if (more > 700) {
                stats.more++;
            }

            stats.finished++;
            page++;
            try {
                await fs.unlink(file.file);
                //await fs.unlink(file.fileSurounded);
            } catch (e) {

            }
        }, {concurrency: 8});

        this.db.files = [];
    }

    async generatePDF() {
        const doc = new PDFDocument();
        doc.pipe(createWriteStream('output.pdf'));

        for (const file of this.db.files) {
            doc.image(file.file, 10, 130, {
                fit: [595, 642],
                align: 'center',
                valign: 'center'
            }).text(file.puzzle, {lineBreak: false})
            .text("More?" + "    " + "Less?", {align: "right"})
    
            doc.lineJoin('miter').rect(470, 90, 20, 20).stroke();
            doc.lineJoin('miter').rect(510, 90, 20, 20).stroke();
            doc.addPage();
        }

        doc.text('Stats');
        doc.text('');
        _.forEach(_.groupBy(this.db.files, f => f.puzzle), (files, puzzle) => {
            const stats = this.db.puzzles[puzzle];
            doc.text(`${puzzle}: More ${stats.more}, Less ${stats.less}, Generated ${stats.generated}, Finished ${stats.finished}, Currents ${files.length}`)
        });
        doc.end();

        await exec('cp output.pdf /Users/lchenay/Dropbox/morning/output.pdf');
    }
}
