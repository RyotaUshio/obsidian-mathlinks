import { TFile } from 'obsidian';

export function formatRegex(str: string): string {
    return str
        .replace(/\s/g, '\\s')
        .replace(/\./g, '\\.')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');
}

export function isExcluded(file: TFile, excludedFilePaths: string[]): boolean {
    for (let i = 0; i < excludedFilePaths.length; i++) {
        let path = excludedFilePaths[i];
        if (path.isFile && file.path === path.path) {
            return true;
        } else if (!path.isFile) {
            let pathRegex = new RegExp(`\\b${path.path}/`);
            if (pathRegex.test(file.path)) {
                return true;
            }
        }

        if (i === excludedFilePaths.length) {
            return false;
        }
   }
}

export function countIncluded(allNotes: TFile[], excludedFilePaths: string[]): number {
    let numNotes = 0;
    allNotes.forEach((note) => {
        if (!isExcluded(note, excludedFilePaths)) {
            numNotes++;
        }
    });

    return numNotes;
}
