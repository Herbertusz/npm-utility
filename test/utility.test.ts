/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it, vi } from 'vitest';
import {
    switching, condition, delay, promiseSequence, tryRequest, macrotask, toggleArray, sortDescriptor, arrayToMap,
    ArrayOfObjects, SVG, SortDirection, promiseSettledSequence, ratioRange, IMG, FILE, generateString, animate,
    Interval, objectKeys, includesAll, removeAt, objectEntries, mapper, reverseMapper, getPercentage, promiseSequenceAll
} from '../src/utility';

describe('utility', () => {

    it('switching', () => {
        const control = (key) => switching(key, {
            'W': 'accelerate',
            'A': 'turnLeft',
            'S': 'brake',
            'D': 'turnRight'
        }, null);
        expect(control('A')).toEqual('turnLeft');
        expect(control('X')).toEqual(null);
        expect(control('')).toEqual(null);
        expect(control(null)).toEqual(null);
        expect(control(undefined)).toEqual(null);
        const value = (key) => switching(key, {
            true: 'yes',
            false: 'no'
        }, '?');
        expect(value(true)).toEqual('yes');
        expect(value(false)).toEqual('no');
        expect(value(null)).toEqual('?');
        expect(value(undefined)).toEqual('?');
    });

    it('condition', () => {
        const variable = (a, b) => condition([
            [a < b, 1],
            [a > b, -1],
            [a === b, 0]
        ]);
        expect(variable(1, 3)).toEqual(1);
        expect(variable(2, 1)).toEqual(-1);
        expect(variable(2, 2)).toEqual(0);
        expect(condition([[false, 1], [true, 2], [false, 3], [true, 4]])).toEqual(2);
        expect(condition([[true, 1], [true, 2], [false, 3], [true, 4]])).toEqual(1);
        expect(condition([[false, 1], [false, 2], [false, 3], [true, 4]])).toEqual(4);
        expect(condition([[false, 1], [true, 2], [true, 3], [true, 4]])).toEqual(2);
    });
    
    it('delay', async () => {
        await expect(delay(500, 1)).resolves.toBeDefined();
        await expect(delay(1000, 1)).resolves.toBeDefined();
    });

    it('promiseSequence', async () => {
        const runPromise = () => promiseSequence<number>([
            () => delay(200, 1).then(() => 1),
            (value) => delay(500, value).then((val) => val + 1),
            (value) => delay(200, value).then((val) => val + 1)
        ]).then(
            (value) => value
        ).catch(
            (error) => error
        );
        await expect(runPromise()).resolves.toEqual(3);
    });
    
    it('promiseSequenceAll', async () => {
        const runPromise = () => promiseSequenceAll<number>([
            (prev) => delay(200, prev).then((val) => Number(val) + 1),
            (prev) => delay(500, prev).then((val) => Number(val) + 1),
            (prev) => delay(200, prev).then((val) => Number(val) + 1)
        ]).then(
            (value) => value
        ).catch(
            (error) => error
        );
        await expect(runPromise()).resolves.toEqual([1, 2, 3]);
    });
    
    it('promiseSettledSequence', async () => {
        const runPromise = () => promiseSettledSequence<number>([
            () => { return Promise.resolve(1); },
            (prev) => Promise.reject((prev ?? 1) + 1),
            (prev) => Promise.resolve((prev ?? 2) + 1),
            (prev) => Promise.reject((prev ?? 3) + 1),
            (prev) => Promise.resolve((prev ?? 4) + 1)
        ]).then(
            (values) => values
        ).catch(
            (error) => error
        );
        await expect(runPromise()).resolves.toEqual([
            { status: 'fulfilled', value: 1 },
            { status: 'rejected', reason: 2 },
            { status: 'fulfilled', value: 3 },
            { status: 'rejected', reason: 4 },
            { status: 'fulfilled', value: 5 },
        ]);
    });

    it.skip('tryRequest', async () => {
        const runPromise = (url) => tryRequest({
            times: 3,
            url
        }).then(
            (value) => Promise.resolve(value)
        ).catch(
            (error) => Promise.reject(error)
        );
        await expect(runPromise('https://google.com')).resolves.toBeDefined();
        await expect(runPromise('http://doesntexist12345.com')).rejects.toBeInstanceOf(Error);
    });

    it('macrotask', async () => {
        const callbacks = {
            first: () => 1
        };
        const spy = vi.spyOn(callbacks, 'first');
        expect(await macrotask(callbacks.first)).toEqual(1);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveReturnedWith(1);
    });

    it('toggleArray', () => {
        expect(toggleArray([1, 2, 3], 2)).toEqual([1, 3]);
        expect(toggleArray([1, 2, 3], 7)).toEqual([1, 2, 3, 7]);
        expect(toggleArray([{ a: 1 }, { a: 2 }], { a: 2 })).toEqual([{ a: 1 }]);
        expect(toggleArray([{ a: 1 }, { a: 2 }], { a: 3 })).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
    });

    it('sortDescriptor', () => {
        const asc = [2, 7, 1, 8, 3].sort(
            (a, b) => sortDescriptor(a, b, SortDirection.asc)
        );
        const desc = [2, 7, 1, 8, 3].sort(
            (a, b) => sortDescriptor(a, b, SortDirection.desc)
        );
        expect(asc).toEqual([1, 2, 3, 7, 8]);
        expect(desc).toEqual([8, 7, 3, 2, 1]);
    });

    it('intersectionIntervals', () => {
        expect(Interval.intersection([1, 4], [6, 9])).toEqual(null);
        expect(Interval.intersection([1, 10], [1, 10])).toEqual([1, 10]);
        expect(Interval.intersection([1, 10], [4, 6])).toEqual([4, 6]);
        expect(Interval.intersection([3, 8], [5, 9])).toEqual([5, 8]);
    });

    it('mergeIntervals', () => {
        expect(Interval.union([])).toEqual([]);
        expect(Interval.union([[1, 6]])).toEqual([[1, 6]]);
        expect(Interval.union([[2, 2], [4, 4]])).toEqual([[2, 2], [4, 4]]);
        expect(Interval.union([[1, 6], [8, 9]])).toEqual([[1, 6], [8, 9]]);
        expect(Interval.union([[1, 8], [2, 3]])).toEqual([[1, 8]]);
        expect(Interval.union([[1, 5], [4, 8]])).toEqual([[1, 8]]);
        expect(Interval.union([[6, 8], [1, 7], [2, 4], [9, 10]])).toEqual([[1, 8], [9, 10]]);
    });
    
    it('complementMultiIntervals', () => {
        expect(Interval.multiComplement([1, 10], [])).toEqual([[1, 10]]);
        expect(Interval.multiComplement([1, 10], [[1, 10]])).toEqual([]);
        expect(Interval.multiComplement([1, 10], [[1, 6]])).toEqual([[6, 10]]);
        expect(Interval.multiComplement([1, 10], [[6, 10]])).toEqual([[1, 6]]);
        expect(Interval.multiComplement([1, 10], [[3, 5]])).toEqual([[1, 3], [5, 10]]);
        expect(Interval.multiComplement([1, 10], [[3, 5], [6, 8]])).toEqual([[1, 3], [5, 6], [8, 10]]);
        expect(Interval.multiComplement([1, 10], [[2, 7], [3, 5]])).toEqual([[1, 2], [7, 10]]);
        expect(Interval.multiComplement([1, 10], [[2, 5], [4, 7]])).toEqual([[1, 2], [7, 10]]);
        expect(Interval.multiComplement([1, 10], [[1, 5], [8, 10]])).toEqual([[5, 8]]);
    });
    
    it('intersectionMultiIntervals', () => {
        expect(Interval.multiIntersection([1, 10], [])).toEqual([]);
        expect(Interval.multiIntersection([1, 10], [[1, 10]])).toEqual([[1, 10]]);
        expect(Interval.multiIntersection([1, 10], [[1, 6]])).toEqual([[1, 6]]);
        expect(Interval.multiIntersection([5, 8], [[1, 6]])).toEqual([[5, 6]]);
        expect(Interval.multiIntersection([5, 6], [[7, 8]])).toEqual([]);
        expect(Interval.multiIntersection([3, 10], [[1, 5], [1, 4], [8, 9], [12, 15]])).toEqual([[3, 5], [8, 9]]);
    });

    it('getPercentage', () => {
        expect(getPercentage(0, 1)).toEqual(0);
        expect(getPercentage(25, 50)).toEqual(50);
        expect(getPercentage(17, 10)).toEqual(170);
        expect(getPercentage(100 / 3, 100, 3)).toEqual(33.333);
    });
    
    it('ratioRange', () => {
        expect(ratioRange(6, [3, 9], [0, 100])).toEqual(50);
        expect(ratioRange(12, [10, 20], [1, 2])).toEqual(1.2);
        expect(ratioRange(20, [0, 10], [0, 100])).toEqual(200);
    });

    it('arrayToMap', () => {
        expect(arrayToMap([])).toEqual(new Map());
        expect(arrayToMap(['a', 'b'])).toEqual(new Map([[0, 'a'], [1, 'b']]));
    });

    describe('ArrayOfObjects', () => {

        const source0 = [];
        const source1 = [
            { id: 1, name: 'a', age: 20 },
            { id: 2, name: 'b', age: 21 },
            { id: 3, name: 'c', age: 22 },
            { id: 4, name: 'b', age: 23 },
        ];
        const source2 = [
            { num: 1, name: 'a', age: 20 },
            { num: 2, name: 'b', age: 21 },
            { num: 3, name: 'c', age: 22 },
            { num: 4, name: 'b', age: 23 },
        ];
        const source3 = [
            { num: 4, name: 'b', age: 23 },
            { num: 2, name: 'b', age: 21 },
            { num: 1, name: 'a', age: 20 },
            { num: 3, name: 'c', age: 22 },
        ];

        it('expand', () => {
            expect(ArrayOfObjects.expand({
                from: [2, 4],
                source: source0,
                plusProp: 'name'
            })).toEqual([
                { id: 2, name: null },
                { id: 4, name: null },
            ]);
            expect(ArrayOfObjects.expand({
                from: [2, 4],
                source: source1,
                plusProp: 'name'
            })).toEqual([
                { id: 2, name: 'b' },
                { id: 4, name: 'b' },
            ]);
            expect(ArrayOfObjects.expand({
                from: [2, 4],
                source: source2,
                plusProp: 'name',
                plusPropName: 'nickName',
                identityProp: 'num'
            })).toEqual([
                { num: 2, nickName: 'b' },
                { num: 4, nickName: 'b' },
            ]);
        });

        it('tight', () => {
            expect(ArrayOfObjects.tight(source0, ['id', 'age'])).toEqual([]);
            expect(ArrayOfObjects.tight(source1, ['id', 'age'])).toEqual([
                { id: 1, age: 20 },
                { id: 2, age: 21 },
                { id: 3, age: 22 },
                { id: 4, age: 23 },
            ]);
            expect(ArrayOfObjects.tight(source2, ['num'])).toEqual([
                { num: 1 },
                { num: 2 },
                { num: 3 },
                { num: 4 },
            ]);
        });

        it('take', () => {
            expect(ArrayOfObjects.take(source0, 'age')).toEqual([]);
            expect(ArrayOfObjects.take(source1, 'age')).toEqual([20, 21, 22, 23]);
        });
        
        it('takeOne', () => {
            expect(ArrayOfObjects.takeOne(source0)).toEqual([]);
            expect(ArrayOfObjects.takeOne([
                { prop: 'a' },
                { prop: 'b' },
                { prop: 'c' },
            ])).toEqual(['a', 'b', 'c']);
        });
        
        it('reverseTakeOne', () => {
            expect(ArrayOfObjects.reverseTakeOne([], 'prop')).toEqual([]);
            expect(ArrayOfObjects.reverseTakeOne(['a', 'b', 'c'], 'prop')).toEqual([
                { prop: 'a' },
                { prop: 'b' },
                { prop: 'c' },
            ]);
        });
        
        it('sort', () => {
            expect(ArrayOfObjects.sort([], 'prop')).toEqual([]);
            expect(ArrayOfObjects.sort(source3, 'age')).toEqual(source2);
            expect(ArrayOfObjects.sort(source3, 'age', SortDirection.desc)).toEqual([
                { num: 4, name: 'b', age: 23 },
                { num: 3, name: 'c', age: 22 },
                { num: 2, name: 'b', age: 21 },
                { num: 1, name: 'a', age: 20 },
            ]);
        });
        
        it('sortByValue', () => {
            expect(ArrayOfObjects.sortByValue([], _value => null)).toEqual([]);
            expect(ArrayOfObjects.sortByValue([
                { num: 1, age: 23, add: 2 },
                { num: 2, age: 22, add: 1 },
                { num: 3, age: 21, add: 5 },
                { num: 4, age: 20, add: 2 },
            ], value => value.age + value.add)).toEqual([
                { num: 4, age: 20, add: 2 },
                { num: 2, age: 22, add: 1 },
                { num: 1, age: 23, add: 2 },
                { num: 3, age: 21, add: 5 },
            ]);
            expect(ArrayOfObjects.sortByValue([
                { num: 1, name: 'abcde' },
                { num: 2, name: 'a' },
                { num: 3, name: 'abcd' },
                { num: 4, name: 'abc' },
            ], value => value.name.length, SortDirection.desc)).toEqual([
                { num: 1, name: 'abcde' },
                { num: 3, name: 'abcd' },
                { num: 4, name: 'abc' },
                { num: 2, name: 'a' },
            ]);
        });

        it('find', () => {
            expect(ArrayOfObjects.find(source3, 'age', 100)).toEqual(null);
            expect(ArrayOfObjects.find(source3, 'age', 21)).toEqual({ num: 2, name: 'b', age: 21 });
            expect(ArrayOfObjects.find(source3, 'name', 'b')).toEqual({ num: 4, name: 'b', age: 23 });
        });
        
        it('findAll', () => {
            expect(ArrayOfObjects.findAll(source3, 'age', 100)).toEqual([]);
            expect(ArrayOfObjects.findAll(source3, 'age', 21)).toEqual([
                { num: 2, name: 'b', age: 21 }
            ]);
            expect(ArrayOfObjects.findAll(source3, 'name', 'b')).toEqual([
                { num: 4, name: 'b', age: 23 },
                { num: 2, name: 'b', age: 21 },
            ]);
        });
        
        it('unique', () => {
            expect(ArrayOfObjects.unique(source0, 'name')).toEqual([]);
            expect(ArrayOfObjects.unique(source1, 'name')).toEqual([
                { id: 1, name: 'a', age: 20 },
                { id: 4, name: 'b', age: 23 },
                { id: 3, name: 'c', age: 22 },
            ]);
            expect(ArrayOfObjects.unique([
                { id: 1, name: 'a' },
                { id: 2, name: 'a' },
                { id: 3, name: 'a' },
            ], 'name')).toEqual([
                { id: 3, name: 'a' }
            ]);
        });
        
        it('multiUnique', () => {
            expect(ArrayOfObjects.multiUnique(source0, 'name', 'age')).toEqual([]);
            expect(ArrayOfObjects.multiUnique(source1, 'name')).toEqual([
                { id: 1, name: 'a', age: 20 },
                { id: 2, name: 'b', age: 21 },
                { id: 3, name: 'c', age: 22 },
            ]);
            expect(ArrayOfObjects.multiUnique(source1, 'name', 'age')).toEqual([
                { id: 1, name: 'a', age: 20 },
                { id: 2, name: 'b', age: 21 },
                { id: 3, name: 'c', age: 22 },
                { id: 4, name: 'b', age: 23 },
            ]);
            expect(ArrayOfObjects.multiUnique([
                { id: 1, name: 'a', age: 20 },
                { id: 2, name: 'a', age: 23 },
                { id: 3, name: 'a', age: 22 },
            ], 'name', 'age')).toEqual([
                { id: 1, name: 'a', age: 20 },
                { id: 2, name: 'a', age: 23 },
                { id: 3, name: 'a', age: 22 },
            ]);
            expect(ArrayOfObjects.multiUnique([
                { id: 1, name: 'a', age: 20 },
                { id: 2, name: 'a', age: 22 },
                { id: 3, name: 'a', age: 22 },
            ], 'name', 'age')).toEqual([
                { id: 1, name: 'a', age: 20 },
                { id: 2, name: 'a', age: 22 },
            ]);
            expect(ArrayOfObjects.multiUnique([
                { id: 1, name: 'a', age: 20 },
                { id: 2, name: 'a', age: 22 },
                { id: 1, name: 'a', age: 20 },
            ], ...objectKeys(source1[0]))).toEqual([
                { id: 1, name: 'a', age: 20 },
                { id: 2, name: 'a', age: 22 },
            ]);
        });

        it('duplicatedElements', () => {
            expect(ArrayOfObjects.duplicatedElements(source0, 'name')).toEqual([]);
            expect(ArrayOfObjects.duplicatedElements(source1, 'name')).toEqual([
                { id: 2, name: 'b', age: 21 },
                { id: 4, name: 'b', age: 23 },
            ]);
            expect(ArrayOfObjects.duplicatedElements([
                { id: 1, name: 'a' },
                { id: 1, name: 'b' },
                { id: 1, name: 'a' },
                { id: 3, name: 'a' },
            ], 'name')).toEqual([
                { id: 1, name: 'a' },
                { id: 1, name: 'a' },
                { id: 3, name: 'a' },
            ]);
            expect(ArrayOfObjects.duplicatedElements([
                { id: 1, name: 'a' },
                { id: 2, name: 'b' },
                { id: 3, name: 'a' },
                { id: 4, name: 'a' },
                { id: 5, name: 'c' },
                { id: 6, name: 'b' },
            ], 'name')).toEqual([
                { id: 1, name: 'a' },
                { id: 3, name: 'a' },
                { id: 4, name: 'a' },
                { id: 2, name: 'b' },
                { id: 6, name: 'b' },
            ]);
        });

        it('appendPosition', () => {
            expect(ArrayOfObjects.appendPosition(source0, 'rank')).toEqual([]);
            expect(ArrayOfObjects.appendPosition([
                { id: 1, rank: 2 },
                { id: 2, rank: 1 },
                { id: 3, rank: 4 },
                { id: 4, rank: 3 },
            ], 'rank', 'pos')).toEqual([
                { id: 3, rank: 4, pos: 1 },
                { id: 4, rank: 3, pos: 2 },
                { id: 1, rank: 2, pos: 3 },
                { id: 2, rank: 1, pos: 4 },
            ]);
            expect(ArrayOfObjects.appendPosition([
                { id: 1, rank: 3 },
                { id: 2, rank: 3 },
                { id: 3, rank: 1 },
                { id: 4, rank: 5 },
                { id: 5, rank: 2 },
                { id: 6, rank: 4 },
                { id: 7, rank: 3 },
                { id: 8, rank: 5 },
            ], 'rank')).toEqual([
                { id: 4, rank: 5, position: 1 },
                { id: 8, rank: 5, position: 1 },
                { id: 6, rank: 4, position: 3 },
                { id: 1, rank: 3, position: 4 },
                { id: 2, rank: 3, position: 4 },
                { id: 7, rank: 3, position: 4 },
                { id: 5, rank: 2, position: 7 },
                { id: 3, rank: 1, position: 8 },
            ]);
        });
    });

    describe('SVG', () => {

        it.skip('urlToElement', () => { });

        it('codeToElement', () => {
            expect(SVG.codeToElement('<svg></svg>')).toBeInstanceOf(SVGSVGElement);
        });

        it('elementToBase64', () => {
            expect(SVG.elementToBase64(SVG.codeToElement('<svg></svg>'))).toEqual(`
                data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=
            `.trim());
        });
        
        it('elementToDataUrl', () => {
            expect(SVG.elementToDataUrl(SVG.codeToElement('<svg></svg>'))).toEqual(`
                data:image/svg+xml;utf8,%3Csvg%3E%3C%2Fsvg%3E
            `.trim());
        });

        // Cannot test with happy-dom
        it.skip('dataUrlToPng', async () => {
            await expect(SVG.dataUrlToPng('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', 10)).resolves.toEqual(`
                data:image/png;base64,
            `.trim());
        });

        // Cannot test with happy-dom
        it.skip('elementToPng', async () => {
            await expect(SVG.elementToPng(SVG.codeToElement('<svg></svg>'), 10)).resolves.toEqual(`
                data:image/png;base64,
            `.trim());
        });

    });
    
    describe('IMG', () => {

        // Cannot test with happy-dom
        it.skip('urlToBase64', () => { });

        // Cannot test with happy-dom? (error: canvas.getContext is not a function)
        it.skip('elementToBase64', () => {
            const img = document.createElement('img');
            img.src = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';
            img.width = 1;
            img.height = 1;
            expect(IMG.elementToBase64(img)).toEqual('');
        });
        
        // Cannot test with happy-dom
        it.skip('getRatio', () => { });

        it('hexToRgb', () => {
            expect(IMG.hexToRgb('#0033ff')).toEqual([0, 51, 255]);
            expect(IMG.hexToRgb('#0033FF')).toEqual([0, 51, 255]);
            expect(IMG.hexToRgb('#03f')).toEqual([0, 51, 255]);
            expect(IMG.hexToRgb('#aa0000')).toEqual([170, 0, 0]);
        });
        
        it('invertColor', () => {
            expect(IMG.invertColor('#0000ff', false)).toEqual('#ffff00');
            expect(IMG.invertColor('#00FFFF', false)).toEqual('#ff0000');
            expect(IMG.invertColor('#00f', false)).toEqual('#ffff00');
            expect(IMG.invertColor('#0000ff', true)).toEqual('#FFFFFF');
            expect(IMG.invertColor('#00FFFF', true)).toEqual('#000000');
            expect(IMG.invertColor('#00F', true)).toEqual('#FFFFFF');
        });

    });
    
    describe('FILE', () => {
        
        it('base64ToBlob', async () => {
            await expect(FILE.base64ToBlob('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=')).resolves.toBeInstanceOf(Blob);
        });

        it.skip('download', () => { });

    });

    it('generateString', () => {
        expect(generateString(0)).toEqual('');
        expect(generateString(10).length).toEqual(10);
    });

    it('objectKeys', () => {
        expect(objectKeys({ })).toEqual([]);
        expect(objectKeys({ a: 1, b: 2, c: '' })).toEqual(['a', 'b', 'c']);
    });
    
    it('objectEntries', () => {
        expect(objectEntries({ })).toEqual([]);
        expect(objectEntries({ a: 1, b: 2, c: '' })).toEqual([['a', 1], ['b', 2], ['c', '']]);
    });

    it('includesAll', () => {
        expect(includesAll([], [])).toEqual(true);
        expect(includesAll([1, 2], [1])).toEqual(true);
        expect(includesAll([1, 2], [3])).toEqual(false);
        expect(includesAll([1, 2, 3], [1, 2])).toEqual(true);
        expect(includesAll([1, 2, 3], [3, 4])).toEqual(false);
    });

    it('removeAt', () => {
        expect(removeAt([], 0)).toEqual([]);
        expect(removeAt([1, 2, 3], 1)).toEqual([1, 3]);
        expect(removeAt([1, 2, 3], 3)).toEqual([1, 2, 3]);
    });
    
    it('mapper', () => {
        expect(mapper({ a: 1 }, { })).toEqual({ });
        expect(mapper({ a: 1 }, { a: 'b' })).toEqual({ b: 1 });
        expect(mapper({ a: 1 }, { b: 'c' })).toEqual({ c: undefined });
        expect(mapper({ a: 1, b: 2, c: 3 }, { b: 'd', c: 'x' })).toEqual({ d: 2, x: 3 });
    });
    
    it('reverseMapper', () => {
        expect(reverseMapper({ a: 1 }, { })).toEqual({ });
        expect(reverseMapper({ a: 1 }, { b: 'a' })).toEqual({ b: 1 });
        expect(reverseMapper({ a: 1 }, { c: 'b' })).toEqual({ c: undefined });
        expect(reverseMapper({ a: 1, b: 2, c: 3 }, { d: 'b', x: 'c' })).toEqual({ d: 2, x: 3 });
    });

    it.skip('animate', () => {
        // TODO
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '0px';
        animate(200, current => {
            div.style.left = `${current}px`;
            return current < 500;
        }).then(
            current => {
                console.info(current);
            }
        ).catch(
            error => {
                console.error(error);
            }
        );
    });

});
