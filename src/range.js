import { withinBounds, underLimit, updateValue } from './utils';
import initializeRangeConfig from './config/initializeRangeConfig';
import applyTransforms from './transforms/applyTransforms';
import generateTransform from './transforms/generateTransform';
import TRANSFORM_TYPES from './transforms/transform-types';

function _generateValue(element, transforms, end, reverse) {
    let newElement = element;
    let { value, filtered } = applyTransforms(newElement, transforms);
    
    while (filtered && withinBounds(newElement, end, reverse)) {
        newElement = updateValue(newElement, reverse);
        // weird destructuring syntax for existing variables
        ({ value, filtered } = applyTransforms(newElement, transforms));
    }

    return { value, newElement };
}

/**
 * @param  {number} start - The starting value
 * @param  {number} end - The ending (inclusive) value
 * @param  {number} limit - The total number of values desired to be returned
 * @param  {array<Object>} transforms - List of transform object of the form 
 *                                      { type: TRANSFORM_TYPES{MAP|FILTER}, transform: fn }
 * @return {function} iter - An iterator function that returns an Object with { next: fn } 
 */
function _getRangeIterator({ start, end, limit, transforms, reverse }) {
    let pushCount = 0;

    [start, end] = reverse ? [end - 1, start] : [start, end];
    
    function iter() {
        let element = start;

        return {
            next() {
                const { value, newElement } = _generateValue(element, transforms, end, reverse);
                element = newElement;

                if (withinBounds(element, end, reverse) && underLimit(pushCount, limit)) {
                    pushCount++;
                    element = updateValue(element, reverse);
                    return { value, done: false };
                }

                return { done: true };
            }
        }
    }

    return iter;
}

/**
 * @param  {Number} start - The starting (inclusive) value for the desired 
 *                          range (if ommitted zero is default)
 * @param  {Number} end - The ending (inclusive) value for the desired range
 * @return {Object} result - iterable object with functions to transform (map), 
 *                           reverse, filter, or limit (limit) the range output 
 *                           { limit(num), map(fn), filter(fn) [Symbol.iterator] }
 */
export default function range(start = 0, end) {
    if (end === undefined || end === null) {
        end = start;
        start = 0;
    }

    const getNewConfig = initializeRangeConfig(start, end);

    const rangeObject = {
        limit(num) {
            this[Symbol.iterator] = _getRangeIterator(getNewConfig({ limit: num }));
            return rangeObject;
        },

        map(fn) {
            const update = { transforms: [ generateTransform(TRANSFORM_TYPES.MAP, fn) ] };
            this[Symbol.iterator] = _getRangeIterator(getNewConfig(update));
            return rangeObject;
        },

        filter(fn) {
            const update = { transforms: [ generateTransform(TRANSFORM_TYPES.FILTER, fn) ] };
            this[Symbol.iterator] = _getRangeIterator(getNewConfig(update));
            return rangeObject;
        },

        reverse() {
            this[Symbol.iterator] = _getRangeIterator(getNewConfig({ reverse: true }));
            return rangeObject;
        },

        [Symbol.iterator]: _getRangeIterator(getNewConfig())
    }

    return rangeObject;
}