import { QueryTests } from './test/QueryTests';
import { OdataParserTests } from './test/OdataParserTests';
import { OdataParser } from './source/OdataParser';
import schema from './test/schema.json';

let odataParser = new OdataParser(schema);
new OdataParserTests('http://localhost:5000/api', odataParser).runAll();
new QueryTests('http://localhost:5000/api', odataParser).runAll();
new QueryTests('http://localhost:5000/api').runAll();

process.stdin.on('data', _ => process.exit());