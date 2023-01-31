import os from 'os';
import fs from 'fs/promises';

const TMP_DIR = `${os.tmpdir()}/puzzles`;
fs.mkdir(TMP_DIR, { recursive: true });

export class Puzzle {
    constructor(key) {
        this.key = key;
    }

    getTmpDir() {
        return TMP_DIR;
    }

    async analyse() {
        const files = (await Generator.getFiles()).filter(file => file.file.includes(this.key));

        this.totalCount = files.length;
        this.modified = files.filter(file => file.stat.mtimeMs - file.stat.birthtimeMs > deltaMS);

        this.untouchedFile = files.filter(file => file.stat.mtimeMs - file.stat.birthtimeMs <= deltaMS);
        this.needs = Math.max(this.modified.length + Generator.margin, this.totalCount - Generator.maxDecrease);

        const toGenerate = Math.max(-1, this.needs - this.totalCount + this.modified.length);

        console.log(`
            Puzzle: ${this.key}
            Total: ${this.totalCount}
            Modified: ${this.modified.length}
            Needs: ${this.needs}
            To generate: ${toGenerate}
        `)
        
        for (let file of this.modified) {
            await fs.unlink(`${this.getTmpDir()}/${file.file}`);
        }

        if (this.needs == Generator.margin) {
            for (let file of files) {
                await fs.unlink(`${this.getTmpDir()}/${file.file}`);
            }
            return;
        }

        if (toGenerate < 0) {
            // delete a random file
            await fs.unlink(`${this.getTmpDir()}/${this.untouchedFile[rn(this.untouchedFile.length)].file}`);
        }

        for (let i = 0; i < toGenerate; i++) {
            await this.generate();
        }
    }
}