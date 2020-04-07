import * as bt from '@babel/types';
import { default as traverse, Scope } from '@babel/traverse';
import { parse } from '@babel/parser';
import * as fs from 'fs';
import { QueryCacheVisitor } from './source/plugin'
import generate, { GeneratorResult } from '@babel/generator';

let buffer: Buffer = fs.readFileSync('../project/test/QueryTests.js');
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
traverse(ast, new QueryCacheVisitor(), {} as Scope, state);
let result: GeneratorResult = generate(ast);

//var z = require('./test/QueryTests');
//new z.QueryTests('http://localhost:5000/api').runAll();
process.stdin.on('data', _ => process.exit());
