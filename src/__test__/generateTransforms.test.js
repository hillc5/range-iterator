import test from 'tape';

import { TRANSFORM_TYPES, generateTransform } from '../range';

test('generateTransforms - should default to a MAP type', t => {
    const transform = generateTransform(undefined, () => {});

    t.equal(transform.type, TRANSFORM_TYPES.MAP);
    t.end();
});

test('generateTransforms - should return the function and type specified', t => {
    const type = TRANSFORM_TYPES.FILTER;
    const fn = () => {};

    const transform = generateTransform(type, fn);
    t.equal(transform.type, type);
    t.equal(transform.transform, fn);
    t.end();
});