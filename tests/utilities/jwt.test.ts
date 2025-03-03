import * as assert from "assert";
import * as jwt from 'jsonwebtoken';

import { validateSig } from "../../src/utilities/jwt";

describe('utilities/jwt', function () {
    describe('#validateSig', function () {
        it('check that a signature can be validated', function() {
            const token = jwt.sign({
                'claim': 'hello',
            }, 'key==', {
                expiresIn: '1h',
            });
            assert.ok(validateSig(token, 'key=='));
        });
        it("check that a signature can't be validated if it's expired", function() {
            const token = jwt.sign({
                'claim': 'hello',
            }, 'key==', {
                expiresIn: '-1h',
            });
            assert.ok(!validateSig(token, 'key=='));
        });
        it("check that a signature can't be validated if the key doesn't match", function() {
            const token = jwt.sign({
                'claim': 'hello',
            }, 'key==', {
                expiresIn: '1h',
            });
            assert.ok(!validateSig(token, 'key==='));
        });
        it("check the ISS of a claim", function() {
            const token = jwt.sign({
                'claim': 'hello',
                'iss': 'foo',
            }, 'key==', {
                expiresIn: '1h',
            });
            assert.ok(validateSig(token, 'key==', 'foo'));
        });
        it("check claim with missing ISS won't validate", function() {
            const token = jwt.sign({
                'claim': 'hello',
            }, 'key==', {
                expiresIn: '1h',
            });
            assert.ok(!validateSig(token, 'key==', 'foo'));
        });
        it("check claim with mismatched ISS won't validate", function() {
            const token = jwt.sign({
                'claim': 'hello',
                'iss': 'bar',
            }, 'key==', {
                expiresIn: '1h',
            });
            assert.ok(!validateSig(token, 'key==', 'foo'));
        });
    });
});
