import { QueryTests } from './test/QueryTests';

let queryTests = new QueryTests('http://localhost:5000/api');
queryTests.runAll();

process.stdin.on('data', _ => process.exit());