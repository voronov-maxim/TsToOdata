import { Traverse } from '../ts2odata-babel/source/traverse';
import { OdataParser } from './source/OdataParser';
import { OdataParserTests } from './test/OdataParserTests';
import { QueryTests } from './test/QueryTests';
import schema from './test/schema.json';

let odataParser = new OdataParser(schema);
let traverse = new Traverse();
new OdataParserTests(traverse, 'http://localhost:5000/api', odataParser).runAll();
new QueryTests(traverse, 'http://localhost:5000/api', odataParser).runAll();
new QueryTests(traverse, 'http://localhost:5000/api').runAll();

process.stdin.on('data', _ => process.exit());