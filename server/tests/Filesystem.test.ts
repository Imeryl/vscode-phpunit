import { Filesystem, POSIX, WINDOWS, FilesystemContract } from './../src/Filesystem';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Filesystem Test', () => {
    it('it should get content from file', () => {
        const files: FilesystemContract = new Filesystem();
        const path = resolve(__dirname, 'fixtures/PHPUnitTest.php');
        expect(files.get(path)).toEqual(readFileSync(path).toString('utf8'));
    });

    it('it should normalize path when os is posix', () => {
        const files: FilesystemContract = new POSIX();
        expect(files.normalizePath('file:///foo/bar')).toEqual('/foo/bar');
        expect(files.normalizePath('file:///foo/ba r')).toEqual('/foo/ba\\ r');
    });

    it('it should normalize path when os is windows', () => {
        const files: FilesystemContract = new WINDOWS();
        expect(files.normalizePath('file:///c%3A/foo/bar')).toEqual('c:\\foo\\bar');
        expect(files.normalizePath('c:\\foo\\bar')).toEqual('c:\\foo\\bar');
        expect(files.normalizePath('c:/foo/bar')).toEqual('c:\\foo\\bar');
        expect(files.normalizePath('file:///c%3A/foo/ba r')).toEqual('c:\\foo\\ba\\ r');
    });

    it('it should normalize path', () => {
        const files: FilesystemContract = new Filesystem(new WINDOWS());
        expect(files.normalizePath('file:///c%3A/foo/bar')).toEqual('c:\\foo\\bar');
    });
});