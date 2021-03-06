/* file : partitioned-bloom-filter.js
MIT License

Copyright (c) 2016 Thomas Minier & Arnaud Grall

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict';

const fm = require('./formulas.js');
const utils = require('./utils.js');
const Exportable = require('./exportable.js');

/**
 * A Partitioned Bloom Filter is a variation of a classic Bloom filter.
 *
 * This filter works by partitioning the M-sized bit array into k slices of size m = M/k bits, k = nb of hash functions in the filter.
 * Each hash function produces an index over m for its respective slice.
 * Thus, each element is described by exactly k bits, meaning the distribution of false positives is uniform across all elements.
 *
 * Be careful, as a Partitioned Bloom Filter have much higher collison risks that a classic Bloom Filter on small sets of data.
 *
 * Reference: Chang, F., Feng, W. C., & Li, K. (2004, March). Approximate caches for packet classification. In INFOCOM 2004. Twenty-third AnnualJoint Conference of the IEEE Computer and Communications Societies (Vol. 4, pp. 2196-2207). IEEE.
 * @see {@link https://pdfs.semanticscholar.org/0e18/e24b37a1f4196fddf8c9ff8e4368b74cfd88.pdf} for more details about Partitioned Bloom Filters
 * @extends Exportable
 * @author Thomas Minier
 * @example
 * const PartitionedBloomFilter = require('bloom-filters').PartitionedBloomFilter;
 *
 * // create a Partitioned Bloom Filter with capacity = 15 and 1% error rate
 * let filter = new PartitionedBloomFilter(15, 0.1);
 *
 * // alternatively, create a Partitioned Bloom Filter from an array with 1% error rate
 * filter = PartitionedBloomFilter.from([ 'alice', 'bob' ], 0.1);
 *
 * // add some value in the filter
 * filter.add('alice');
 * filter.add('bob');
 *
 * // lookup for some data
 * console.log(filter.has('bob')); // output: true
 * console.log(filter.has('daniel')); // output: false
 *
 * // print false positive rate (around 0.1)
 * console.log(filter.rate());
 */
class PartitionedBloomFilter extends Exportable {
  /**
   * Constructor
   * @param {int} capacity - The filter capacity, i.e. the maximum number of elements it will contains
   * @param {number} errorRate - The error rate, i.e. 'false positive' rate, targetted by the filter
   */
  constructor (capacity, errorRate) {
    super('PartitionedBloomFilter', 'capacity', 'errorRate', 'length', 'filter');
    this.capacity = capacity;
    this.errorRate = errorRate;
    this.size = fm.optimalFilterSize(capacity, errorRate);
    this.nbHashes = fm.optimalHashes(this.size, capacity);
    this.subarraySize = Math.ceil(this.size / this.nbHashes);
    this.filter = utils.allocateArray(this.nbHashes, () => utils.allocateArray(this.subarraySize, false));
    this.length = 0;
  }

  /**
   * Build a new Partitioned Bloom Filter from an existing array with a fixed error rate
   * @param {Array} array - The array used to build the filter
   * @param {number} errorRate - The error rate, i.e. 'false positive' rate, targetted by the filter
   * @return {BloomFilter} A new Bloom Filter filled with iterable's elements
   * @example
   * // create a filter with a false positive rate of 0.1
   * const filter = PartitionedBloomFilter.from(['alice', 'bob', 'carl'], 0.1);
   */
  static from (array, errorRate) {
    const filter = new PartitionedBloomFilter(array.length, errorRate);
    array.forEach(element => filter.add(element));
    return filter;
  }

  /**
   * Create a new Partitioned Bloom Filter from a JSON export
   * @param  {Object} json - A JSON export of a Partitioned Bloom Filter
   * @return {PartitionedBloomFilter} A new Partitioned Bloom Filter
   */
  static fromJSON (json) {
    if ((json.type !== 'PartitionedBloomFilter') || !('capacity' in json) || !('errorRate' in json) || !('length' in json) || !('filter' in json))
    throw new Error('Cannot create a PartitionedBloomFilter from a JSON export which does not represent a Partitioned Bloom Filter');
    const filter = new PartitionedBloomFilter(json.capacity, json.errorRate);
    filter.length = json.length;
    filter.filter = json.filter.slice(0);
    return filter;
  }

  /**
   * Add an element to the filter
   * @param {*} element - The element to add
   * @return {void}
   * @example
   * const filter = new PartitionedBloomFilter(15, 0.1);
   * filter.add('foo');
   */
  add (element) {
    const hashes = utils.hashTwice(element, true);

    for(let i = 0; i < this.nbHashes; i++) {
      this.filter[i][utils.doubleHashing(i, hashes.first, hashes.second, this.subarraySize)] = true;
    }
    this.length++;
  }

  /**
   * Test an element for membership
   * @param {*} element - The element to look for in the filter
   * @return {boolean} False if the element is definitively not in the filter, True is the element might be in the filter
   * @example
   * const filter = new PartitionedBloomFilter(15, 0.1);
   * filter.add('foo');
   * console.log(filter.has('foo')); // output: true
   * console.log(filter.has('bar')); // output: false
   */
  has (element) {
    const hashes = utils.hashTwice(element, true);

    for(let i = 0; i < this.nbHashes; i++) {
      if(!this.filter[i][utils.doubleHashing(i, hashes.first, hashes.second, this.subarraySize)]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get the current false positive rate (or error rate) of the filter
   * @return {int} The current false positive rate of the filter
   * @example
   * const filter = new PartitionedBloomFilter(15, 0.1);
   * console.log(filter.rate()); // output: something around 0.1
   */
  rate () {
    return Math.pow(1 - Math.exp((-this.nbHashes * this.length) / this.size), this.nbHashes);
  }
}

module.exports = PartitionedBloomFilter;
