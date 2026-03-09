import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import Groq from 'groq-sdk';
import Evidence from '../models/Evidence.js';

// ─── COLUMN MAPPING PATTERNS ────────────────────────────────────────────────
// Expanded to cover Cellebrite, AXIOM, Oxygen, UFED, XRY, and generic exports
const COLUMN_MAPPINGS = {
    timestamp: [
        'timestamp', 'date', 'time', 'datetime', 'created', 'sent_at', 'received_at',
        'call_time', 'msg_time', 'created_at', 'updated_at', 'event_time', 'event_date',
        'start_time', 'end_time', 'log_time', 'record_date', 'occurred', 'when',
        'time_stamp', 'date_time', 'utc_time', 'local_time', 'msg_date', 'call_date',
        'interaction_time', 'activity_time', 'captured_date', 'extraction_date'
    ],
    sender: [
        'sender', 'from', 'from_number', 'caller', 'origin', 'source_id', 'from_id',
        'originator', 'party_a', 'initiator', 'sent_by', 'author', 'from_address',
        'from_phone', 'caller_id', 'calling_number', 'outgoing_number', 'from_name',
        'msg_from', 'sender_name', 'sender_number', 'sender_id', 'source_phone',
        'a_party', 'a_number', 'msisdn_a'
    ],
    receiver: [
        'receiver', 'to', 'to_number', 'recipient', 'destination', 'target_id', 'to_id',
        'party_b', 'to_address', 'to_phone', 'called_number', 'incoming_number',
        'to_name', 'msg_to', 'receiver_name', 'receiver_number', 'receiver_id',
        'dest_phone', 'b_party', 'b_number', 'msisdn_b', 'dialed_number', 'received_by'
    ],
    content: [
        'content', 'body', 'message', 'text', 'msg', 'message_body', 'msg_content',
        'message_text', 'sms_body', 'chat_message', 'note', 'description', 'snippet',
        'preview', 'data', 'payload', 'detail', 'details', 'summary', 'subject',
        'msg_body', 'msg_text', 'chat_text', 'communication', 'transcript'
    ],
    source: [
        'source', 'app', 'app_name', 'application', 'platform', 'service',
        'channel', 'medium', 'network', 'provider', 'client', 'protocol',
        'app_id', 'source_app', 'source_type', 'origin_app', 'tool', 'interface',
        'messaging_app', 'im_client', 'social_media'
    ],
    duration: [
        'duration', 'call_duration', 'length', 'call_length', 'dur', 'dur_sec',
        'duration_seconds', 'duration_sec', 'duration_ms', 'talk_time', 'ring_time',
        'call_time_sec', 'elapsed', 'time_elapsed', 'seconds', 'total_time'
    ],
    type: [
        'type', 'msg_type', 'message_type', 'call_type', 'record_type',
        'event_type', 'category', 'class', 'classification', 'kind',
        'evidence_type', 'data_type', 'item_type', 'entry_type', 'communication_type',
        'interaction_type', 'activity_type', 'log_type'
    ],
    latitude: [
        'latitude', 'lat', 'location_lat', 'geo_lat', 'y', 'coord_lat',
        'gps_lat', 'position_lat', 'loc_lat'
    ],
    longitude: [
        'longitude', 'lng', 'lon', 'location_lng', 'location_lon', 'geo_lon',
        'x', 'coord_lon', 'gps_lon', 'position_lon', 'loc_lon', 'long'
    ],
    contactName: [
        'name', 'contact_name', 'display_name', 'full_name', 'first_name',
        'person', 'contact', 'participant', 'user', 'username', 'handle',
        'alias', 'nickname', 'profile_name', 'account_name'
    ],
    phoneNumbers: [
        'phone', 'phone_number', 'mobile', 'telephone', 'cell', 'cell_number',
        'mobile_number', 'tel', 'phone_no', 'number', 'msisdn', 'contact_number',
        'sim_number', 'device_number'
    ],
    emails: [
        'email', 'email_address', 'mail', 'e_mail', 'email_id', 'contact_email',
        'user_email', 'address'
    ],
    organization: [
        'organization', 'company', 'org', 'workplace', 'employer', 'business',
        'firm', 'institution', 'affiliation'
    ],
    locationName: [
        'location', 'place', 'address', 'location_name', 'loc', 'area',
        'city', 'region', 'venue', 'site', 'position', 'geo_name', 'place_name',
        'cell_tower', 'tower_id', 'tower_name'
    ],
    direction: [
        'direction', 'dir', 'call_direction', 'msg_direction', 'flow',
        'inbound_outbound', 'incoming_outgoing', 'sent_received'
    ],
    status: [
        'status', 'state', 'delivery_status', 'read_status', 'msg_status',
        'call_status', 'result', 'outcome', 'disposition'
    ]
};

// ─── DELIMITER DETECTION ────────────────────────────────────────────────────

/**
 * Auto-detect the delimiter used in a CSV/text file by analyzing the first few lines.
 * Counts occurrences of each candidate delimiter and picks the most consistent one.
 */
function detectDelimiter(text) {
    const candidates = [',', '\t', ';', '|'];
    const lines = text.split(/\r?\n/).filter(l => l.trim()).slice(0, 10);

    if (lines.length === 0) return ',';

    let bestDelimiter = ',';
    let bestScore = -1;

    for (const delim of candidates) {
        // Count occurrences per line
        const counts = lines.map(line => {
            let count = 0;
            let inQuotes = false;
            for (const ch of line) {
                if (ch === '"') inQuotes = !inQuotes;
                else if (ch === delim && !inQuotes) count++;
            }
            return count;
        });

        // A good delimiter appears consistently across all lines and creates multiple columns
        const minCount = Math.min(...counts);
        const maxCount = Math.max(...counts);
        const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;

        // Consistency score: higher average count + lower variance = better
        const variance = maxCount - minCount;
        const score = avgCount * 10 - variance * 5;

        if (minCount > 0 && score > bestScore) {
            bestScore = score;
            bestDelimiter = delim;
        }
    }

    return bestDelimiter;
}

// ─── FUZZY MATCHING ─────────────────────────────────────────────────────────

/**
 * Normalize a column header for comparison:
 * lowercases, strips non-alphanumeric, collapses whitespace
 */
function normalizeHeader(header) {
    return String(header || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

/**
 * Compute similarity between two strings (0-1) using bigram overlap (Dice coefficient).
 * Faster than Levenshtein and works well for short header strings.
 */
function similarity(a, b) {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;

    const bigramsA = new Set();
    for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.slice(i, i + 2));

    let matches = 0;
    for (let i = 0; i < b.length - 1; i++) {
        if (bigramsA.has(b.slice(i, i + 2))) matches++;
    }

    return (2 * matches) / (a.length - 1 + b.length - 1);
}

/**
 * Try to match a header against all known patterns for a field using fuzzy matching.
 * Returns a confidence score (0-1). Threshold is 0.6.
 */
function matchHeaderToField(header, patterns) {
    const normHeader = normalizeHeader(header);
    if (!normHeader) return 0;

    let bestScore = 0;

    for (const pattern of patterns) {
        const normPattern = normalizeHeader(pattern);

        // Exact match
        if (normHeader === normPattern) return 1.0;

        // Contains match
        if (normHeader.includes(normPattern) || normPattern.includes(normHeader)) {
            bestScore = Math.max(bestScore, 0.85);
            continue;
        }

        // Fuzzy match
        const sim = similarity(normHeader, normPattern);
        bestScore = Math.max(bestScore, sim);
    }

    return bestScore;
}

// ─── CONTENT-BASED COLUMN INFERENCE ─────────────────────────────────────────

const CONTENT_PATTERNS = {
    timestamp: (values) => {
        const dateCount = values.filter(v => {
            if (!v) return false;
            const s = String(v).trim();
            // Check for date-like patterns or unix timestamps
            return /\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(s) ||
                /\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(s) ||
                /^\d{10,13}$/.test(s) ||
                !isNaN(Date.parse(s));
        }).length;
        return dateCount / values.length;
    },
    phoneNumbers: (values) => {
        const phoneCount = values.filter(v => {
            if (!v) return false;
            const s = String(v).replace(/[\s\-().+]/g, '');
            return /^\d{7,15}$/.test(s);
        }).length;
        return phoneCount / values.length;
    },
    emails: (values) => {
        const emailCount = values.filter(v =>
            v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())
        ).length;
        return emailCount / values.length;
    },
    latitude: (values) => {
        const latCount = values.filter(v => {
            const n = parseFloat(v);
            return !isNaN(n) && n >= -90 && n <= 90 && String(v).includes('.');
        }).length;
        return latCount / values.length;
    },
    longitude: (values) => {
        const lonCount = values.filter(v => {
            const n = parseFloat(v);
            return !isNaN(n) && n >= -180 && n <= 180 && String(v).includes('.');
        }).length;
        return lonCount / values.length;
    },
    duration: (values) => {
        const durCount = values.filter(v => {
            const n = parseInt(v);
            return !isNaN(n) && n >= 0 && n <= 86400 && String(v).trim() === String(n);
        }).length;
        return durCount / values.length;
    },
    content: (values) => {
        // Long text strings are likely message content
        const longTextCount = values.filter(v =>
            v && String(v).length > 20
        ).length;
        return longTextCount / values.length;
    }
};

/**
 * Analyze column data to infer what field it represents based on content patterns.
 * Returns { field, confidence } or null.
 */
function inferColumnFromContent(values) {
    const nonEmpty = values.filter(v => v != null && String(v).trim() !== '');
    if (nonEmpty.length === 0) return null;

    let bestField = null;
    let bestScore = 0;

    for (const [field, testFn] of Object.entries(CONTENT_PATTERNS)) {
        const score = testFn(nonEmpty);
        if (score > bestScore && score >= 0.5) {
            bestScore = score;
            bestField = field;
        }
    }

    return bestField ? { field: bestField, confidence: bestScore } : null;
}

// ─── AI-POWERED COLUMN MAPPING (TIER 2) ─────────────────────────────────────

let groqClient = null;

function getGroqClient() {
    if (!groqClient && process.env.GROQ_API_KEY) {
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
}

/**
 * Use the Groq LLM to intelligently map CSV columns to evidence fields.
 * Only called when algorithmic detection is uncertain (< 3 key columns mapped).
 */
async function aiMapColumns(headers, sampleRows) {
    const client = getGroqClient();
    if (!client) {
        console.log('AI column mapping skipped: no GROQ_API_KEY');
        return null;
    }

    try {
        // Build a compact representation of the data
        const sampleText = sampleRows.slice(0, 3).map((row, i) => {
            const cells = headers.map((h, j) => `${h}: "${String(row[j] ?? '').slice(0, 100)}"`);
            return `Row ${i + 1}: { ${cells.join(', ')} }`;
        }).join('\n');

        const prompt = `You are a data parsing expert. Given the following CSV headers and sample data rows, map each column header to the most appropriate evidence field.

Available evidence fields:
- timestamp: date/time of the event
- sender: who sent the message / made the call (phone number, name, or ID)
- receiver: who received the message / call
- content: message body / text content
- source: app name or platform (WhatsApp, SMS, etc.)
- duration: call duration in seconds
- type: evidence type (message, call, location, contact, media)
- latitude: GPS latitude
- longitude: GPS longitude
- contactName: person's display name
- phoneNumbers: phone number for contacts
- emails: email address
- organization: company/org name
- locationName: place name or address
- direction: incoming/outgoing
- status: delivery/read status
- score: priority/relevance score (numeric)
- category: classification category

Headers: [${headers.join(', ')}]

Sample Data:
${sampleText}

Map ONLY the columns that clearly match a field. Skip ambiguous ones.
Respond ONLY with valid JSON in this exact format:
{
  "mappings": { "evidence_field": "csv_column_header", ... },
  "confidence": <number 0-100>,
  "notes": "<brief explanation of the mapping logic>"
}`;

        const completion = await client.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a forensic data parser. Respond only with valid JSON, no markdown or extra text.'
                },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            max_tokens: 600,
            response_format: { type: 'json_object' }
        });

        const response = JSON.parse(completion.choices[0]?.message?.content);
        console.log('AI column mapping result:', response);

        if (response?.mappings && response.confidence >= 50) {
            // Convert from { evidence_field: csv_header } format to our { field: header } format
            const aiMappings = {};
            for (const [field, csvHeader] of Object.entries(response.mappings)) {
                // Verify the header actually exists in the CSV
                const matchedHeader = headers.find(h =>
                    normalizeHeader(h) === normalizeHeader(csvHeader) ||
                    h === csvHeader
                );
                if (matchedHeader) {
                    aiMappings[field] = matchedHeader;
                }
            }
            return aiMappings;
        }

        return null;
    } catch (error) {
        console.error('AI column mapping failed:', error.message);
        return null;
    }
}

// ─── MAIN COLUMN DETECTION ──────────────────────────────────────────────────

/**
 * Auto-detect column mappings from header row.
 * Uses a three-tier approach:
 *   1. Fuzzy header matching against known patterns
 *   2. Content-based inference from sample data
 *   3. AI fallback for ambiguous CSVs
 */
async function detectColumnMappings(headers, sampleRows = []) {
    const mappings = {};
    const usedHeaders = new Set();
    const FUZZY_THRESHOLD = 0.6;

    // ── Tier 1: Fuzzy header matching ──
    // Check if headers look generic (v1, v2, column1, etc.)
    const lowerHeaders = headers.map(h => String(h || '').toLowerCase().trim());
    const genericPatterns = [/^v\d+$/, /^column\d+$/, /^col\d+$/, /^field\d+$/, /^f\d+$/, /^\d+$/];
    const isGenericHeaders = lowerHeaders.every(h =>
        h === '' || genericPatterns.some(p => p.test(h))
    );

    if (!isGenericHeaders) {
        // Score each header against each field's patterns
        const scoreboard = [];

        for (const [field, patterns] of Object.entries(COLUMN_MAPPINGS)) {
            for (let i = 0; i < headers.length; i++) {
                const score = matchHeaderToField(headers[i], patterns);
                if (score >= FUZZY_THRESHOLD) {
                    scoreboard.push({ field, headerIndex: i, header: headers[i], score });
                }
            }
        }

        // Sort by score descending and assign greedily (highest score first, no conflicts)
        scoreboard.sort((a, b) => b.score - a.score);

        for (const entry of scoreboard) {
            if (!mappings[entry.field] && !usedHeaders.has(entry.headerIndex)) {
                mappings[entry.field] = entry.header;
                usedHeaders.add(entry.headerIndex);
            }
        }
    }

    // ── Tier 2: Content-based inference for unmapped columns ──
    if (sampleRows.length > 0) {
        for (let i = 0; i < headers.length; i++) {
            if (usedHeaders.has(i)) continue;

            const columnValues = sampleRows.map(row => row[i]).filter(v => v != null);
            if (columnValues.length === 0) continue;

            const inference = inferColumnFromContent(columnValues);
            if (inference && !mappings[inference.field]) {
                mappings[inference.field] = headers[i];
                usedHeaders.add(i);
                console.log(`Content inference: "${headers[i]}" → ${inference.field} (confidence: ${(inference.confidence * 100).toFixed(0)}%)`);
            }
        }
    }

    // ── Tier 3: AI fallback if we don't have enough key mappings ──
    const keyFields = ['timestamp', 'sender', 'content'];
    const mappedKeyCount = keyFields.filter(f => mappings[f]).length;

    if (mappedKeyCount < 2 && sampleRows.length > 0) {
        console.log(`Only ${mappedKeyCount}/3 key fields mapped algorithmically. Invoking AI...`);

        const sampleData = sampleRows.slice(0, 5).map(row =>
            headers.map((_, j) => row[j])
        );

        const aiMappings = await aiMapColumns(headers, sampleData);

        if (aiMappings) {
            // Merge AI results, but don't override existing high-confidence mappings
            for (const [field, header] of Object.entries(aiMappings)) {
                if (!mappings[field]) {
                    mappings[field] = header;
                    console.log(`AI mapping: "${header}" → ${field}`);
                }
            }
        }
    }

    // ── Positional fallback for generic headers with 6+ columns ──
    if (isGenericHeaders && headers.length >= 6 && Object.keys(mappings).length < 3) {
        console.log('Using positional column mapping (generic headers, algorithmic/AI insufficient)');
        return {
            timestamp: headers[0],
            type: headers[1],
            source: headers[2],
            sender: headers[3],
            receiver: headers[4],
            content: headers[5],
            ...(headers[6] ? { score: headers[6] } : {}),
            ...(headers[7] ? { category: headers[7] } : {})
        };
    }

    console.log('Final column mappings:', mappings);
    return mappings;
}

// ─── ROBUST DATE PARSING ────────────────────────────────────────────────────

/**
 * Parse a date string with comprehensive format support.
 * Handles: ISO 8601, Unix timestamps, DD/MM/YYYY, MM/DD/YYYY, and 15+ more formats.
 */
function parseDate(dateStr) {
    if (!dateStr) return null;

    const s = String(dateStr).trim();
    if (!s) return null;

    // Unix timestamp (seconds: 10 digits, milliseconds: 13 digits)
    if (/^\d{10}$/.test(s)) {
        return new Date(parseInt(s) * 1000);
    }
    if (/^\d{13}$/.test(s)) {
        return new Date(parseInt(s));
    }

    // Excel serial date numbers (5 digits like 44927)
    if (/^\d{5}$/.test(s)) {
        const excelEpoch = new Date(1899, 11, 30);
        const days = parseInt(s);
        if (days > 1 && days < 100000) {
            return new Date(excelEpoch.getTime() + days * 86400000);
        }
    }

    // Try native Date.parse first (handles ISO 8601 and many standard formats)
    const nativeParse = new Date(s);
    if (!isNaN(nativeParse.getTime())) {
        // Sanity check: year should be between 1970 and 2100
        const year = nativeParse.getFullYear();
        if (year >= 1970 && year <= 2100) {
            return nativeParse;
        }
    }

    // Manual format parsing
    const formats = [
        // YYYY-MM-DD HH:mm:ss (and variants)
        { regex: /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})[\sT](\d{1,2}):(\d{2})(?::(\d{2}))?/, parse: (m) => new Date(m[1], m[2] - 1, m[3], m[4], m[5], m[6] || 0) },
        // YYYY-MM-DD
        { regex: /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/, parse: (m) => new Date(m[1], m[2] - 1, m[3]) },
        // DD/MM/YYYY HH:mm:ss
        { regex: /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/, parse: (m) => new Date(m[3], m[2] - 1, m[1], m[4], m[5], m[6] || 0) },
        // DD/MM/YYYY
        { regex: /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/, parse: (m) => new Date(m[3], m[2] - 1, m[1]) },
        // MM/DD/YYYY (American) — resolved by heuristic if ambiguous
        { regex: /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/, parse: (m) => new Date(m[3], m[1] - 1, m[2]) },
        // DD Mon YYYY
        { regex: /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})/i, parse: (m) => new Date(`${m[2]} ${m[1]}, ${m[3]}`) },
        // Mon DD, YYYY
        { regex: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s+(\d{4})/i, parse: (m) => new Date(`${m[1]} ${m[2]}, ${m[3]}`) },
        // DD-Mon-YY
        { regex: /^(\d{1,2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*-(\d{2})$/i, parse: (m) => new Date(`${m[2]} ${m[1]}, 20${m[3]}`) },
    ];

    for (const { regex, parse } of formats) {
        const match = s.match(regex);
        if (match) {
            const date = parse(match);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }

    return null;
}

// ─── TYPE DETECTION ─────────────────────────────────────────────────────────

const TYPE_KEYWORDS = {
    message: ['sms', 'message', 'msg', 'text', 'chat', 'im', 'instant', 'mms', 'whatsapp', 'telegram', 'signal', 'viber', 'line', 'wechat', 'imessage', 'messenger'],
    call: ['call', 'voice', 'dial', 'ring', 'phone', 'voip', 'cellular', 'missed', 'incoming call', 'outgoing call'],
    location: ['location', 'gps', 'geo', 'coordinate', 'cell tower', 'wifi', 'position', 'waypoint', 'checkin', 'check-in'],
    contact: ['contact', 'addressbook', 'address book', 'phonebook', 'phone book', 'vcard'],
    media: ['media', 'photo', 'video', 'image', 'picture', 'file', 'attachment', 'document', 'audio', 'recording']
};

/**
 * Detect evidence type from row data
 */
function detectEvidenceType(row, mappings) {
    // If type column exists, use it
    if (mappings.type && row[mappings.type]) {
        const csvType = String(row[mappings.type]).toLowerCase().trim();
        for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
            if (keywords.some(kw => csvType.includes(kw))) {
                return type;
            }
        }
    }

    // Infer from content
    if (mappings.duration && row[mappings.duration]) return 'call';
    if (mappings.latitude && mappings.longitude && row[mappings.latitude] && row[mappings.longitude]) return 'location';
    if ((mappings.phoneNumbers || mappings.emails) && mappings.contactName && !row[mappings.content]) return 'contact';
    if (mappings.content && row[mappings.content]) return 'message';

    // Check direction column for call hints
    if (mappings.direction && row[mappings.direction]) {
        const dir = String(row[mappings.direction]).toLowerCase();
        if (dir.includes('missed') || dir.includes('dial') || dir.includes('ring')) return 'call';
    }

    return 'other';
}

// ─── ROW TRANSFORMATION ────────────────────────────────────────────────────

/**
 * Transform a parsed row into an Evidence document
 */
function transformToEvidence(row, mappings, caseId) {
    const type = detectEvidenceType(row, mappings);

    const evidence = {
        caseId,
        type,
        source: cleanValue(row[mappings.source]) || 'Unknown',
        timestamp: parseDate(row[mappings.timestamp]),
        sender: cleanValue(row[mappings.sender]),
        receiver: cleanValue(row[mappings.receiver]),
        content: cleanValue(row[mappings.content]),
        rawData: row
    };

    // Type-specific fields
    if (type === 'call') {
        const dur = row[mappings.duration];
        evidence.duration = dur ? parseInt(String(dur).replace(/[^\d]/g, '')) || 0 : 0;
    }

    if (type === 'location') {
        evidence.latitude = parseFloat(row[mappings.latitude]);
        evidence.longitude = parseFloat(row[mappings.longitude]);
        if (mappings.locationName) {
            evidence.locationName = cleanValue(row[mappings.locationName]);
        }
    }

    if (type === 'contact') {
        evidence.contactName = cleanValue(row[mappings.contactName]);
        if (row[mappings.phoneNumbers]) {
            const phones = String(row[mappings.phoneNumbers]);
            evidence.phoneNumbers = phones.includes(';') ? phones.split(';').map(p => p.trim()) : [phones.trim()];
        }
        if (row[mappings.emails]) {
            const emails = String(row[mappings.emails]);
            evidence.emails = emails.includes(';') ? emails.split(';').map(e => e.trim()) : [emails.trim()];
        }
        evidence.organization = cleanValue(row[mappings.organization]);
    }

    // Pre-populate analysis if score/category columns exist
    if (mappings.score && row[mappings.score]) {
        const score = parseInt(row[mappings.score]) || 0;
        const category = mappings.category ? String(row[mappings.category] || '').toLowerCase() : '';

        evidence.analysis = {
            priorityScore: score,
            priority: score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low',
            flags: category ? [category] : [],
            summary: `Imported with score ${score}` + (category ? ` (${category})` : ''),
            sentiment: 'neutral',
            entities: [],
            analyzedAt: new Date()
        };
    }

    // If no content but there are unmapped columns, concatenate them as content
    if (!evidence.content) {
        const mappedHeaders = new Set(Object.values(mappings));
        const extraParts = [];
        for (const [key, val] of Object.entries(row)) {
            if (!mappedHeaders.has(key) && val && String(val).trim().length > 10) {
                extraParts.push(String(val).trim());
            }
        }
        if (extraParts.length > 0) {
            evidence.content = extraParts.join(' | ');
        }
    }

    return evidence;
}

/**
 * Clean a value: trim whitespace, handle "null"/"undefined" strings, strip quotes
 */
function cleanValue(val) {
    if (val == null) return undefined;
    let s = String(val).trim();
    if (s === '' || s === 'null' || s === 'undefined' || s === 'N/A' || s === 'n/a') return undefined;
    // Strip surrounding quotes
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        s = s.slice(1, -1).trim();
    }
    return s || undefined;
}

// ─── CSV LINE PARSER ────────────────────────────────────────────────────────

/**
 * Parse a delimited line respecting quoted fields.
 * Works with any single-character delimiter.
 */
function parseDelimitedLine(line, delimiter = ',') {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

/**
 * Strip UTF-8 BOM from the beginning of text
 */
function stripBOM(text) {
    if (text.charCodeAt(0) === 0xFEFF) return text.slice(1);
    return text;
}

// ─── MAIN PARSE FUNCTIONS ───────────────────────────────────────────────────

/**
 * Parse CSV/TSV/delimited file from buffer (universal parser)
 */
export async function parseCSVFromBuffer(buffer, caseId, onProgress) {
    let csvContent = buffer.toString('utf-8');
    csvContent = stripBOM(csvContent);

    const lines = csvContent.split(/\r?\n/);
    if (lines.length === 0) {
        return { records: [], totalRows: 0, mappings: {} };
    }

    // Auto-detect delimiter from first 10 lines
    const sampleText = lines.slice(0, 10).join('\n');
    const delimiter = detectDelimiter(sampleText);
    console.log(`Detected delimiter: "${delimiter === '\t' ? 'TAB' : delimiter}"`);

    // Parse header row
    const headers = parseDelimitedLine(lines[0], delimiter).map(h => h.trim());

    // Parse sample data rows for content inference and AI
    const sampleRows = [];
    for (let i = 1; i < Math.min(lines.length, 21); i++) {
        const line = lines[i].trim();
        if (!line) continue;
        sampleRows.push(parseDelimitedLine(line, delimiter));
    }

    // Detect column mappings (may invoke AI for ambiguous CSVs)
    const mappings = await detectColumnMappings(headers, sampleRows);
    console.log('Column mappings:', mappings);

    const results = [];
    let rowCount = 0;

    // Parse all data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseDelimitedLine(line, delimiter);

        // Skip rows that are clearly empty
        if (values.every(v => !v || v.trim() === '')) continue;

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        rowCount++;
        const evidence = transformToEvidence(row, mappings, caseId);
        results.push(evidence);

        if (onProgress && rowCount % 100 === 0) {
            onProgress(rowCount);
        }
    }

    return {
        records: results,
        totalRows: rowCount,
        mappings,
        detectedDelimiter: delimiter
    };
}

/**
 * Parse CSV file from disk (streams through csv-parser for comma-delimited,
 * or falls back to buffer parser for auto-delimiter support)
 */
export async function parseCSV(filePath, caseId, onProgress) {
    // Read file into buffer and use the universal parser
    const buffer = fs.readFileSync(filePath);
    return parseCSVFromBuffer(buffer, caseId, onProgress);
}

/**
 * Parse Excel file (XLSX/XLS) from disk
 */
export async function parseExcel(filePath, caseId, onProgress) {
    const workbook = XLSX.readFile(filePath);
    return parseExcelWorkbook(workbook, caseId, onProgress);
}

/**
 * Parse Excel file from buffer
 */
export async function parseExcelFromBuffer(buffer, caseId, onProgress) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    return parseExcelWorkbook(workbook, caseId, onProgress);
}

/**
 * Shared Excel workbook parser
 */
async function parseExcelWorkbook(workbook, caseId, onProgress) {
    const results = [];
    let totalRows = 0;

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length < 2) continue;

        const headers = data[0].map(h => String(h || ''));

        // Gather sample rows for content inference
        const sampleRows = data.slice(1, 21).map(row =>
            headers.map((_, j) => row[j])
        );

        const mappings = await detectColumnMappings(headers, sampleRows);
        console.log(`Processing sheet "${sheetName}" with ${data.length - 1} rows, mappings:`, mappings);

        for (let i = 1; i < data.length; i++) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = data[i][index];
            });

            // Skip empty rows
            if (Object.values(row).every(v => v == null || String(v).trim() === '')) continue;

            const evidence = transformToEvidence(row, mappings, caseId);
            results.push(evidence);
            totalRows++;

            if (onProgress && totalRows % 100 === 0) {
                onProgress(totalRows);
            }
        }
    }

    return {
        records: results,
        totalRows,
        sheets: workbook.SheetNames
    };
}

/**
 * Main parser — auto-detects file type
 */
export async function parseFile(filePath, caseId, onProgress) {
    const ext = path.extname(filePath).toLowerCase();

    if (['.csv', '.tsv', '.txt'].includes(ext)) {
        return parseCSV(filePath, caseId, onProgress);
    } else if (['.xlsx', '.xls'].includes(ext)) {
        return parseExcel(filePath, caseId, onProgress);
    } else {
        throw new Error(`Unsupported file format: ${ext}`);
    }
}

/**
 * Save parsed records to database in batches
 */
export async function saveEvidenceToDatabase(records, batchSize = 100) {
    const batches = [];

    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        batches.push(batch);
    }

    let savedCount = 0;

    for (const batch of batches) {
        await Evidence.insertMany(batch, { ordered: false });
        savedCount += batch.length;
    }

    return savedCount;
}

export default {
    parseFile,
    parseCSV,
    parseExcel,
    parseCSVFromBuffer,
    parseExcelFromBuffer,
    saveEvidenceToDatabase,
    detectColumnMappings,
    detectDelimiter,
    parseDate,
    normalizeHeader,
    similarity
};
