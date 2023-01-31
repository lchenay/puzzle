export class PuzzleStats {
    discover = 0;
    less = 0;
    more = 0;
    finished = 0;
    generated = 0;

    static fromData(data) {
        let stats = new PuzzleStats()
        for (const key of ["discover", "less", "more", "finished"]) {
            if (data[key] !== undefined) {
                stats[key] = data[key]
            }
        }
        return stats
    }
}