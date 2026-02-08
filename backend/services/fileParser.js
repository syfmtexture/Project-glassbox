import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import Evidence from '../models/Evidence.js';

// Column mapping patterns for auto-detection
const COLUMN_MAPPINGS = {
    timestamp: ['timestamp', 'date', 'time', 'datetime', 'created', 'sent_at', 'received_at', 'call_time', 'msg_time'],
    sender: ['sender', 'from', 'from_number', 'caller', 'origin', 'source_id', 'from_id'],
    receiver: ['receiver', 'to', 'to_number', 'recipient', 'destination', 'target_id', 'to_id'],
    content: ['content', 'body', 'message', 'text', 'msg', 'message_body', 'msg_content'],
    source: ['source', 'app', 'app_name', 'application', 'platform', 'service'],
    duration: ['duration', 'call_duration', 'length', 'call_length'],
    type: ['type', 'msg_type', 'message_type', 'call_type', 'record_type'],
    latitude: ['latitude', 'lat', 'location_lat'],
    longitude: ['longitude', 'lng', 'lon', 'location_lng'],
    contactName: ['name', 'contact_name', 'display_name', 'full_name'],
    phoneNumbers: ['phone', 'phone_number', 'mobile', 'telephone'],
    emails: ['email', 'email_address', 'mail'],
    organization: ['organization', 'company', 'org', 'workplace']
};

/**
 * Auto-detect column mappings from header row
 * Falls back to positional mapping if headers are generic (v1, v2, etc.)
 */
function detectColumnMappings(headers) {
    const mappings = {};
    const lowerHeaders = headers.map(h => String(h || '').toLowerCase().trim());

    // Check if headers look generic (v1, v2, column1, etc.)
    const genericPatterns = [/^v\d+$/, /^column\d+$/, /^col\d+$/, /^field\d+$/, /^f\d+$/, /^\d+$/];
    const isGenericHeaders = lowerHeaders.every(h =>
        h === '' || genericPatterns.some(p => p.test(h))
    );

    if (isGenericHeaders && headers.length >= 6) {
        // Use positional mapping for standard forensic export format:
        // timestamp, type, source/app, sender, receiver, content, [score], [category]
        console.log('Using positional column mapping (generic headers detected)');
        return {
            timestamp: headers[0],
            type: headers[1],
            source: headers[2],
            sender: headers[3],
            receiver: headers[4],
            content: headers[5],
            // Optional additional columns
            ...(headers[6] ? { score: headers[6] } : {}),
            ...(headers[7] ? { category: headers[7] } : {})
        };
    }

    // Try pattern-based detection
    for (const [field, patterns] of Object.entries(COLUMN_MAPPINGS)) {
        for (const pattern of patterns) {
            const index = lowerHeaders.findIndex(h =>
                h === pattern || h.includes(pattern) || pattern.includes(h)
            );
            if (index !== -1 && !mappings[field]) {
                mappings[field] = headers[index];
                break;
            }
        }
    }

    // Log what was detected
    console.log('Detected column mappings:', mappings);

    return mappings;
}

/**
 * Detect evidence type from data
 */
function detectEvidenceType(row, mappings) {
    // Check if it has duration (likely a call)
    if (mappings.duration && row[mappings.duration]) {
        return 'call';
    }

    // Check if it has coordinates (likely a location)
    if (mappings.latitude && mappings.longitude &&
        row[mappings.latitude] && row[mappings.longitude]) {
        return 'location';
    }

    // Check if it has phone/email but no content (likely a contact)
    if ((mappings.phoneNumbers || mappings.emails) &&
        mappings.contactName && !row[mappings.content]) {
        return 'contact';
    }

    // Check if it has content (likely a message)
    if (mappings.content && row[mappings.content]) {
        return 'message';
    }

    return 'other';
}

/**
 * Parse a date string with multiple format support
 */
function parseDate(dateStr) {
    if (!dateStr) return null;

    // Try direct parsing first
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date;
    }

    // Common forensic export formats
    const formats = [
        /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,  // YYYY-MM-DD HH:mm:ss
        /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/,  // MM/DD/YYYY HH:mm:ss
        /(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/,  // DD-MM-YYYY HH:mm:ss
    ];

    for (const format of formats) {
        const match = String(dateStr).match(format);
        if (match) {
            return new Date(dateStr);
        }
    }

    return null;
}

/**
 * Transform row data to Evidence schema
 */
function transformToEvidence(row, mappings, caseId) {
    // Use type from CSV if available, otherwise detect
    let type = 'other';
    if (mappings.type && row[mappings.type]) {
        const csvType = String(row[mappings.type]).toLowerCase().trim();
        // Map common CSV type values to Evidence type enum
        if (csvType.includes('sms') || csvType.includes('message') || csvType.includes('msg') || csvType.includes('text')) {
            type = 'message';
        } else if (csvType.includes('call') || csvType.includes('voice')) {
            type = 'call';
        } else if (csvType.includes('location') || csvType.includes('gps')) {
            type = 'location';
        } else if (csvType.includes('contact')) {
            type = 'contact';
        } else if (csvType.includes('media') || csvType.includes('photo') || csvType.includes('video')) {
            type = 'media';
        } else {
            type = detectEvidenceType(row, mappings);
        }
    } else {
        type = detectEvidenceType(row, mappings);
    }

    const evidence = {
        caseId,
        type,
        source: row[mappings.source] || 'Unknown',
        timestamp: parseDate(row[mappings.timestamp]),
        sender: row[mappings.sender],
        receiver: row[mappings.receiver],
        content: row[mappings.content],
        rawData: row
    };

    // Add type-specific fields
    if (type === 'call') {
        evidence.duration = parseInt(row[mappings.duration]) || 0;
    }

    if (type === 'location') {
        evidence.latitude = parseFloat(row[mappings.latitude]);
        evidence.longitude = parseFloat(row[mappings.longitude]);
    }

    if (type === 'contact') {
        evidence.contactName = row[mappings.contactName];
        if (row[mappings.phoneNumbers]) {
            evidence.phoneNumbers = [row[mappings.phoneNumbers]];
        }
        if (row[mappings.emails]) {
            evidence.emails = [row[mappings.emails]];
        }
        evidence.organization = row[mappings.organization];
    }

    // Pre-populate analysis if score/category columns exist in CSV
    // This gives the AI a head start and ensures flagged items are prioritized
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

    return evidence;
}

/**
 * Parse CSV file
 */
export async function parseCSV(filePath, caseId, onProgress) {
    return new Promise((resolve, reject) => {
        const results = [];
        let headers = null;
        let mappings = null;
        let rowCount = 0;

        createReadStream(filePath, { encoding: 'utf-8' })
            .pipe(csvParser())
            .on('headers', (headerRow) => {
                headers = headerRow;
                mappings = detectColumnMappings(headers);
                console.log('Detected column mappings:', mappings);
            })
            .on('data', (row) => {
                rowCount++;
                const evidence = transformToEvidence(row, mappings, caseId);
                results.push(evidence);

                if (onProgress && rowCount % 100 === 0) {
                    onProgress(rowCount);
                }
            })
            .on('end', () => {
                resolve({
                    records: results,
                    totalRows: rowCount,
                    mappings
                });
            })
            .on('error', reject);
    });
}

/**
 * Parse Excel file (XLSX/XLS)
 */
export async function parseExcel(filePath, caseId, onProgress) {
    const workbook = XLSX.readFile(filePath);
    const results = [];
    let totalRows = 0;

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length < 2) continue;  // Skip empty sheets

        const headers = data[0];
        const mappings = detectColumnMappings(headers);

        console.log(`Processing sheet "${sheetName}" with ${data.length - 1} rows`);

        for (let i = 1; i < data.length; i++) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = data[i][index];
            });

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
 * Main parser function - auto-detects file type
 */
export async function parseFile(filePath, caseId, onProgress) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.csv') {
        return parseCSV(filePath, caseId, onProgress);
    } else if (['.xlsx', '.xls'].includes(ext)) {
        return parseExcel(filePath, caseId, onProgress);
    } else {
        throw new Error(`Unsupported file format: ${ext}`);
    }
}

/**
 * Parse CSV from buffer (for GridFS/memory uploads)
 */
export async function parseCSVFromBuffer(buffer, caseId, onProgress) {
    const csvContent = buffer.toString('utf-8');
    const lines = csvContent.split(/\r?\n/);

    if (lines.length === 0) {
        return { records: [], totalRows: 0, mappings: {} };
    }

    // Parse header row
    const headers = parseCSVLine(lines[0]);
    const mappings = detectColumnMappings(headers);
    console.log('Detected column mappings:', mappings);

    const results = [];
    let rowCount = 0;

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
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
        mappings
    };
}

/**
 * Simple CSV line parser (handles quoted values)
 */
function parseCSVLine(line) {
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
        } else if (char === ',' && !inQuotes) {
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
 * Parse Excel from buffer (for GridFS/memory uploads)
 */
export async function parseExcelFromBuffer(buffer, caseId, onProgress) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const results = [];
    let totalRows = 0;

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length < 2) continue;  // Skip empty sheets

        const headers = data[0].map(h => String(h || ''));
        const mappings = detectColumnMappings(headers);

        console.log(`Processing sheet "${sheetName}" with ${data.length - 1} rows`);

        for (let i = 1; i < data.length; i++) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = data[i][index];
            });

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
    detectColumnMappings
};
