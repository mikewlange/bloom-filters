/* file : bucket-test.js
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

require('chai').should();
const Bucket = require('../src/bucket.js');

describe('Bucket', () => {

	describe('#isFree', () => {
		it('should return True when the bucket as free space available', () => {
			const bucket = new Bucket(5);
			bucket.isFree().should.be.true;
			bucket.add('foo');
			bucket.isFree().should.be.true;
		});

		it('should return False when the bucket is full', () => {
			const bucket = new Bucket(1);
			bucket.add('foo');
			bucket.isFree().should.be.false;
		});
	});

	describe('#add', () => {
		it('should add an element to the bucket', () => {
			const bucket = new Bucket(5);
			bucket.add('foo');
			bucket.elements[0].should.equal('foo');
			bucket.length.should.equal(1);
		});

		it('should not add an element when bucket is full', () => {
			const bucket = new Bucket(1);
			bucket.add('foo');
			bucket.add('bar').should.be.false;
			bucket.length.should.equal(1);
		});
	});

	describe('#remove', () => {
		it('should remove an element from the bucket', () => {
			const bucket = new Bucket(5);
			bucket.add('foo');
			bucket.remove('foo').should.be.true;
			bucket.length.should.equal(0);
		});

		it('should remove an element without altering the others', () => {
			const bucket = new Bucket(5);
			bucket.add('foo');
			bucket.add('bar');
			bucket.add('moo');
			bucket.remove('bar').should.be.true;
			bucket.elements.indexOf('foo').should.be.greaterThan(-1);
			bucket.elements.indexOf('moo').should.be.greaterThan(-1);
			bucket.length.should.equal(2);
		});

		it('should fail to remove elements that are not in the bucket', () => {
			const bucket = new Bucket(5);
			bucket.add('foo');
			bucket.remove('bar').should.be.false;
			bucket.length.should.equal(1);
		});
	});

	describe('#has', () => {
		it('should return True when the element is in the bucket', () => {
			const bucket = new Bucket(5);
			bucket.add('foo');
			bucket.has('foo').should.be.true;
		});

		it('should return False when the element is not in the bucket', () => {
			const bucket = new Bucket(5);
			bucket.add('foo');
			bucket.has('moo').should.be.false;
		});
	});

	describe('#swapRandom', () => {
		it('should randomly swap an element from the inside of the bucket with one from the outside', () => {
			const bucket = new Bucket(5);
			const values = [ 'foo', 'bar', 'moo' ];
			values.forEach(value => bucket.add(value));
			const expected = 'boo';
			bucket.swapRandom(expected).should.be.oneOf(values);
			bucket.has(expected).should.be.true;
		});
	});
});