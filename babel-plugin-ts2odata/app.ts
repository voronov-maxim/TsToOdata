import generate, { GeneratorResult } from '@babel/generator';
import { parse } from '@babel/parser';
import { default as traverse, Scope, TraverseOptions } from '@babel/traverse';
import * as bt from '@babel/types';
import * as fs from 'fs';
import { QueryCacheVisitor } from './source/plugin';

let buffer: Buffer = fs.readFileSync('../ts2odata/test/QueryTests.js');
let code: string = buffer.toString();
let ast: bt.File = parse(code);
let state = {
    opts: {
        extra: {
            checkModuleName: '../source/OdataContext',
            odataNamespace: 'OdataToEntity.Test.Model'
        }
    }
};
traverse(ast, new QueryCacheVisitor() as TraverseOptions, {} as Scope, state);
let result: GeneratorResult = generate(ast);

new (require('./test/fixtures/test1/output')).QueryTests('http://localhost:5000/api').runAll();

process.stdin.on('data', _ => process.exit());
