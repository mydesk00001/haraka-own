'use strict';

const fixtures     = require('haraka-test-fixtures');
const dns          = require('dns');

const _set_up = function (done) {

    this.plugin = new fixtures.plugin('mail_from.is_resolvable');
    this.plugin.register();

    this.connection = fixtures.connection.createConnection();

    this.connection.transaction = {
        notes: {},
        results: new fixtures.results(this.plugin),
    };

    done();
}

exports.mxErr = {
    setUp : _set_up,
    'any.com, no err code' (test) {
        test.expect(3);
        const txn = this.connection.transaction;
        const err = new Error('oops');
        err.code = null;
        let called = false;
        function cb () { called = true; }
        const r  = this.plugin.mxErr(this.connection, 'any.com', 'MX', err, cb);
        test.equal(r, true);
        test.equal(called, true);
        const mf = txn.results.get('mail_from.is_resolvable');
        test.equal(mf.msg[0], 'any.com:MX:oops');
        test.done();
    },
    'any.com, bypass err code' (test) {
        test.expect(3);
        const txn = this.connection.transaction;
        const err = new Error('oops');
        err.code=dns.NOTFOUND;
        let called = false;
        function cb () { called = true; }
        const r  = this.plugin.mxErr(this.connection, 'any.com', 'MX', err, cb);
        test.equal(r, false);
        test.equal(called, false);
        const mf = txn.results.get('mail_from.is_resolvable');
        test.equal(mf.msg[0], 'any.com:MX:oops');
        test.done();
    }
}

exports.implicit_mx = {
    setUp : _set_up,
    'tnpi.net' (test) {
        test.expect(2);
        const txn = this.connection.transaction;
        this.plugin.implicit_mx(this.connection, 'tnpi.net', err => {
            test.equal(err, undefined);
            const mf = txn.results.get('mail_from.is_resolvable');
            test.equal(mf.pass.length, 1);
            test.done();
        });
    },
    'harakamail.com' (test) {
        test.expect(1);
        const txn = this.connection.transaction;
        this.plugin.implicit_mx(this.connection, 'harakamail.com', () => {
            // console.log(arguments);
            const mf = txn.results.get('mail_from.is_resolvable');
            // console.log(mf);
            test.equal(mf.pass.length, 1);
            test.done();
        });
    },
    'mx.theartfarm.com' (test) {
        test.expect(1);
        const txn = this.connection.transaction;
        this.plugin.implicit_mx(this.connection, 'mx.theartfarm.com', () => {
            const mf = txn.results.get('mail_from.is_resolvable');
            // console.log(mf);
            test.equal(mf.fail.length, 1);
            test.done();
        });
    },
    'resolve-fail-definitive.josef-froehle.de' (test) {
        test.expect(1);
        const txn = this.connection.transaction;
        this.plugin.implicit_mx(this.connection, 'resolve-fail-definitive.josef-froehle.de', () => {
            const mf = txn.results.get('mail_from.is_resolvable');
            //console.log(mf);
            test.equal(mf.fail.length, 1);
            test.done();
        });
    },
    'resolve-fail-a.josef-froehle.de' (test) {
        test.expect(1);
        const txn = this.connection.transaction;
        this.plugin.implicit_mx(this.connection, 'resolve-fail-a.josef-froehle.de', () => {
            const mf = txn.results.get('mail_from.is_resolvable');
            //console.log(mf);
            test.equal(mf.fail.length, 1);
            test.done();
        });
    },
    'resolve-fail-aaaa.josef-froehle.de' (test) {
        test.expect(1);
        const txn = this.connection.transaction;
        this.plugin.implicit_mx(this.connection, 'resolve-fail-aaaa.josef-froehle.de', () => {
            const mf = txn.results.get('mail_from.is_resolvable');
            //console.log(mf);
            test.equal(mf.fail.length, 1);
            test.done();
        });
    },
}
