/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it } from 'vitest';
import {
    addCoords,
    distance,
    getCoord,
    getLineIntersection,
    getRectIntersection,
    getRectTouching,
    getVector,
    isPointInsideRectangle,
    isRectIntersection,
    rectToEdges
} from '../src/geometry';

describe('geometry', () => {

    it('getVector', () => {
        expect(getVector({ x: 0, y: 0 })).toEqual({ length: 0, angle: NaN });
        expect(getVector({ x: 1, y: 1 })).toEqual({ length: Math.sqrt(2), angle: Math.PI / 4 });
        expect(getVector({ x: 0, y: -5 })).toEqual({ length: 5, angle: -0 });  // FIXME: miért nem Math.PI?
        expect(getVector({ x: 0, y: 5 })).toEqual({ length: 5, angle: 0 });
        expect(getVector({ x: 3, y: 0 })).toEqual({ length: 3, angle: Math.PI / 2 });
        expect(getVector({ x: -3, y: 0 })).toEqual({ length: 3, angle: -(Math.PI / 2) });
    });

    it('getCoord', () => {
        // expect(getCoord().toEqual());
    });

    it('addCoords', () => {
        expect(addCoords({ x: 0, y: 0 }, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    });

    it('rectToEdges', () => {
        // expect(rectToEdges()).toEqual();
    });

    it('getLineIntersection', () => {
        // expect(getLineIntersection()).toEqual();
    });

    it('getRectTouching', () => {
        // expect(getRectTouching()).toEqual();
    });

    it('isRectIntersection', () => {
        // expect(isRectIntersection()).toEqual();
    });

    it('getRectIntersection', () => {
        // expect(getRectIntersection()).toEqual();
    });

    it('distance', () => {
        // expect(distance()).toEqual();
    });

    it('isPointInsideRectangle', () => {
        // expect(isPointInsideRectangle()).toEqual();
    });

});
