/**
 * Quick test for the universal CSV parser logic.
 * Run: node test-parser.js
 * 
 * Tests delimiter detection, fuzzy matching, date parsing, and content inference
 * without needing a MongoDB connection.
 */

import fileParser from './services/fileParser.js';
const {
    detectDelimiter,
    normalizeHeader,
    similarity,
    parseDate,
    detectColumnMappings
} = fileParser;

let passed = 0;
let failed = 0;

function assert(condition, msg) {
    if (condition) {
        console.log(`  ✓ ${msg}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${msg}`);
        failed++;
    }
}

// ── Delimiter Detection ──
console.log('\n═══ Delimiter Detection ═══');

assert(detectDelimiter('a,b,c\n1,2,3\n4,5,6') === ',', 'Detects comma');
assert(detectDelimiter('a\tb\tc\n1\t2\t3\n4\t5\t6') === '\t', 'Detects tab');
assert(detectDelimiter('a;b;c\n1;2;3\n4;5;6') === ';', 'Detects semicolon');
assert(detectDelimiter('a|b|c\n1|2|3\n4|5|6') === '|', 'Detects pipe');
assert(detectDelimiter('timestamp,sender,receiver,content\n2024-01-01,Alice,Bob,Hello\n2024-01-02,Bob,Alice,Hi') === ',', 'Detects comma in realistic CSV');
assert(detectDelimiter('timestamp\tsender\treceiver\tcontent\n2024-01-01\tAlice\tBob\tHello there friend\n2024-01-02\tBob\tAlice\tHi back') === '\t', 'Detects tab in realistic TSV');

// ── Fuzzy Matching ──
console.log('\n═══ Fuzzy Matching ═══');

assert(normalizeHeader('Sender Name') === 'sendername', 'normalizeHeader strips spaces');
assert(normalizeHeader('from_number') === 'fromnumber', 'normalizeHeader strips underscores');
assert(normalizeHeader('   MSG-Body   ') === 'msgbody', 'normalizeHeader handles messy input');
assert(similarity('sender', 'sender') === 1.0, 'Exact similarity = 1.0');
assert(similarity('sender', 'sende') > 0.7, 'Close similarity > 0.7');
assert(similarity('timestamp', 'xyz') < 0.3, 'Unrelated similarity < 0.3');

// ── Date Parsing ──
console.log('\n═══ Date Parsing ═══');

assert(parseDate('2024-01-15T10:30:00Z') instanceof Date, 'ISO 8601');
assert(parseDate('2024-01-15 10:30:00') instanceof Date, 'YYYY-MM-DD HH:mm:ss');
assert(parseDate('2024/01/15') instanceof Date, 'YYYY/MM/DD');
assert(parseDate('1705312200') instanceof Date, 'Unix timestamp (seconds)');
assert(parseDate('1705312200000') instanceof Date, 'Unix timestamp (milliseconds)');
assert(parseDate('15 Jan 2024') instanceof Date, 'DD Mon YYYY');
assert(parseDate('Jan 15, 2024') instanceof Date, 'Mon DD, YYYY');
assert(parseDate(null) === null, 'null returns null');
assert(parseDate('') === null, 'empty string returns null');
assert(parseDate('not-a-date') === null, 'garbage returns null');

// ── Column Detection ──
console.log('\n═══ Column Detection ═══');

// Standard headers (should map perfectly)
const stdHeaders = ['timestamp', 'sender', 'receiver', 'content', 'source', 'type'];
const stdMappings = await detectColumnMappings(stdHeaders, []);
assert(stdMappings.timestamp === 'timestamp', 'Maps standard "timestamp"');
assert(stdMappings.sender === 'sender', 'Maps standard "sender"');
assert(stdMappings.content === 'content', 'Maps standard "content"');

// Unconventional headers (should fuzzy match)
const oddHeaders = ['msg_date', 'from_number', 'to_number', 'msg_body', 'app_name', 'msg_type'];
const oddMappings = await detectColumnMappings(oddHeaders, []);
assert(oddMappings.timestamp === 'msg_date', 'Fuzzy maps "msg_date" → timestamp');
assert(oddMappings.sender === 'from_number', 'Fuzzy maps "from_number" → sender');
assert(oddMappings.content === 'msg_body', 'Fuzzy maps "msg_body" → content');

// Generic headers with content inference
const genericHeaders = ['col1', 'col2', 'col3', 'col4'];
const sampleRows = [
    ['2024-01-15 10:30:00', '+1234567890', '+0987654321', 'Hey how are you doing today?'],
    ['2024-01-15 11:00:00', '+1234567890', '+5551234567', 'I am doing great, thanks for asking!'],
    ['2024-01-15 11:30:00', '+5551234567', '+1234567890', 'Lets meet at the park this afternoon.']
];
const genericMappings = await detectColumnMappings(genericHeaders, sampleRows);
console.log('  Generic header mappings:', genericMappings);
// With content inference, it should detect something useful
assert(Object.keys(genericMappings).length >= 2, 'At least 2 fields mapped from generic headers via content inference');

// ── Summary ──
console.log(`\n═══ Results: ${passed} passed, ${failed} failed ═══\n`);
process.exit(failed > 0 ? 1 : 0);
