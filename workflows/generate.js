import { Generator } from '../libs/Generator.js';

(async () => {
    let generator = new Generator();

    generator.init();

    await generator.readDB();
    await generator.readPdf();

    await generator.discoverNewPuzzles();
    await generator.generatePuzzles();

    await generator.sortPuzzles();

    await generator.generatePDF();

    await generator.writeDB();
})();