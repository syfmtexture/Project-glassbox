import Groq from 'groq-sdk';
import Evidence from '../models/Evidence.js';
import AnalysisJob from '../models/AnalysisJob.js';
import Case from '../models/Case.js';

// Lazy initialize Groq client
let groq = null;

function getGroqClient() {
    if (!groq) {
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
    }
    return groq;
}


// Detection categories and keywords for pre-filtering
const DETECTION_PATTERNS = {
    drug_reference: [
        'weed', 'coke', 'meth', 'heroin', 'pills', 'dealer', 'stash',
        'gram', 'ounce', 'score', 'plug', 'dope', 'high', 'smoke'
    ],
    violence_threat: [
        'kill', 'hurt', 'gun', 'knife', 'weapon', 'attack', 'threat',
        'beat', 'shoot', 'stab', 'die', 'dead', 'murder'
    ],
    financial_crime: [
        'launder', 'cash', 'wire', 'offshore', 'fraud', 'scam',
        'bitcoin', 'crypto', 'account', 'transfer', 'payment'
    ],
    conspiracy: [
        'plan', 'secret', 'meeting', 'nobody knows', 'dont tell',
        'keep quiet', 'between us', 'delete this'
    ],
    evasion: [
        'delete', 'erase', 'destroy', 'evidence', 'burner', 'vpn',
        'encrypted', 'disappear', 'hide'
    ]
};

/**
 * Pre-filter content for quick pattern detection
 */
function quickPatternScan(content) {
    if (!content) return { hasPatterns: false, categories: [] };

    const lowerContent = content.toLowerCase();
    const matchedCategories = [];

    for (const [category, keywords] of Object.entries(DETECTION_PATTERNS)) {
        if (keywords.some(kw => lowerContent.includes(kw))) {
            matchedCategories.push(category);
        }
    }

    return {
        hasPatterns: matchedCategories.length > 0,
        categories: matchedCategories
    };
}

/**
 * Build batch analysis prompt for LLM
 */
function buildBatchAnalysisPrompt(evidenceBatch) {
    const recordsText = evidenceBatch.map((ev, i) => `
RECORD #${i + 1}
ID: ${ev._id}
Timestamp: ${ev.timestamp || 'Unknown'}
Type: ${ev.type}
Sender: ${ev.sender || 'Unknown'}
Receiver: ${ev.receiver || 'Unknown'}
Content: ${ev.content || 'No content'}
Source App: ${ev.source || 'Unknown'}
`).join('\n---\n');

    return `You are a digital forensic analyst assistant. Analyze the following ${evidenceBatch.length} communication records and provide a structured analysis for each.

Analysis requirements for each record:
1. Priority score (0-100) based on investigative relevance
2. Flags for suspicious content categories
3. Brief summary (1-2 sentences)
4. Sentiment classification
5. Extracted entities

Priority Scoring Guide:
- 80-100 (Critical): Direct evidence of criminal activity
- 60-79 (High): Suspicious content requiring review  
- 40-59 (Medium): Potentially relevant context
- 0-39 (Low): Likely irrelevant, casual conversation

Detection Categories: drug_reference, violence_threat, financial_crime, conspiracy, evasion, key_entity.

Records to analyze:
${recordsText}

Respond ONLY with a valid JSON object containing an array named "results" with exactly ${evidenceBatch.length} items in the same order as provided:
{
  "results": [
    {
      "id": "<record_id>",
      "priorityScore": <number 0-100>,
      "flags": [<array of strings>],
      "summary": "<brief summary>",
      "sentiment": "<positive|neutral|negative>",
      "entities": [{"type": "<person|location|organization|phone|email>", "value": "<entity value>"}]
    },
    ...
  ]
}`;
}

/**
 * Call the Groq LLM for a batch of evidence records with automatic retry.
 */
async function analyzeBatchWithLLM(evidenceBatch, attempt = 1) {
    const MAX_ATTEMPTS = 4;
    try {
        const prompt = buildBatchAnalysisPrompt(evidenceBatch);

        const completion = await getGroqClient().chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a forensic analyst AI. Respond only with valid JSON, no markdown or extra text.'
                },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 3000,
            response_format: { type: 'json_object' }
        });

        const response = JSON.parse(completion.choices[0]?.message?.content);
        return response.results || [];
    } catch (error) {
        const status = error?.status || error?.response?.status;
        if (status === 429 && attempt <= MAX_ATTEMPTS) {
            let waitMs = Math.min(2000 * Math.pow(2, attempt - 1), 30000);
            const match = error.message?.match(/try again in ([\d.]+)s/);
            if (match) waitMs = Math.max(Math.ceil(parseFloat(match[1]) * 1000) + 200, waitMs);

            console.warn(`Rate limited. Waiting ${waitMs}ms before retrying batch (attempt ${attempt}/${MAX_ATTEMPTS})...`);
            await new Promise(r => setTimeout(r, waitMs));
            return analyzeBatchWithLLM(evidenceBatch, attempt + 1);
        }
        console.error('Batch LLM analysis error:', error.message);
        return [];
    }
}

/**
 * Analyze evidence records (hybrid approach)
 */
async function analyzeEvidenceBatch(evidenceBatch, useLLM = true) {
    // 1. Initial quick scan for all
    const itemsToAnalyze = [];
    const results = new Map();

    for (const ev of evidenceBatch) {
        const patternResult = quickPatternScan(ev.content);
        results.set(ev._id.toString(), {
            priorityScore: patternResult.hasPatterns ? 40 : 0,
            flags: patternResult.categories,
            summary: patternResult.hasPatterns ? `Detected: ${patternResult.categories.join(', ')}` : '',
            sentiment: 'neutral',
            entities: [],
            analyzedAt: new Date()
        });

        if (useLLM && (patternResult.hasPatterns || (ev.content && ev.content.length > 20))) {
            itemsToAnalyze.push(ev);
        }
    }

    // 2. Perform batch LLM analysis if needed
    if (itemsToAnalyze.length > 0) {
        const llmResults = await analyzeBatchWithLLM(itemsToAnalyze);

        for (const res of llmResults) {
            if (!res.id) continue;
            const current = results.get(res.id);
            if (!current) continue;

            const mappedEntities = (res.entities || []).map(e => ({
                entityType: e.type || e.entityType,
                value: e.value
            }));

            results.set(res.id, {
                priorityScore: res.priorityScore || current.priorityScore,
                flags: [...new Set([...current.flags, ...(res.flags || [])])],
                summary: res.summary || current.summary,
                sentiment: res.sentiment || current.sentiment,
                entities: mappedEntities,
                analyzedAt: new Date()
            });
        }
    }

    return results;
}

/**
 * Process analysis job for a case
 */
export async function runAnalysisJob(jobId, options = {}) {
    // Process sequentially to stay within Groq's 30 RPM limit.
    // 2100ms between LLM calls = ~28 RPM, leaving headroom for other API usage.
    const { useLLM = true, llmDelayMs = 2100 } = options;

    const job = await AnalysisJob.findById(jobId);
    if (!job) throw new Error('Analysis job not found');

    try {
        // Update job status
        job.status = 'processing';
        job.startedAt = new Date();
        await job.save();

        // Get unanalyzed evidence
        const evidence = await Evidence.find({
            caseId: job.caseId,
            'analysis.analyzedAt': { $exists: false }
        });

        job.totalRecords = evidence.length;
        await job.save();

        let processedCount = 0;
        let highPriorityCount = 0;
        let criticalCount = 0;
        let totalScore = 0;

        // Process in batches
        const batchSize = 10;
        for (let i = 0; i < evidence.length; i += batchSize) {
            const batch = evidence.slice(i, i + batchSize);
            const batchResults = await analyzeEvidenceBatch(batch, useLLM);

            // Update database
            for (const ev of batch) {
                const analysis = batchResults.get(ev._id.toString());
                if (analysis) {
                    ev.analysis = analysis;
                    await ev.save();

                    processedCount++;
                    totalScore += analysis.priorityScore;
                    if (analysis.priorityScore >= 60) highPriorityCount++;
                    if (analysis.priorityScore >= 80) criticalCount++;
                }
            }

            // Update job progress
            job.processedRecords = processedCount;
            job.highPriorityCount = highPriorityCount;
            job.criticalCount = criticalCount;
            job.stats.averageScore = processedCount > 0 ? Math.round(totalScore / processedCount) : 0;
            await job.save();

            // Throttle between batches (respecting RPM)
            const hasLLMContent = batch.some(ev => {
                const p = quickPatternScan(ev.content);
                return useLLM && (p.hasPatterns || (ev.content && ev.content.length > 20));
            });

            if (hasLLMContent && i + batchSize < evidence.length) {
                await new Promise(r => setTimeout(r, llmDelayMs));
            }
        }

        // Mark job as complete
        job.status = 'completed';
        job.completedAt = new Date();
        await job.save();

        // Update case stats
        await Case.findByIdAndUpdate(job.caseId, {
            $set: {
                highPriorityCount: highPriorityCount
            }
        });

        return job;
    } catch (error) {
        job.status = 'failed';
        job.errorMessage = error.message;
        job.completedAt = new Date();
        await job.save();
        throw error;
    }
}

/**
 * Create and start an analysis job
 */
export async function startAnalysis(caseId, options = {}) {
    // Check for existing pending/processing job
    const existingJob = await AnalysisJob.findOne({
        caseId,
        status: { $in: ['pending', 'processing'] }
    });

    if (existingJob) {
        throw new Error('An analysis job is already running for this case');
    }

    // Create new job
    const job = await AnalysisJob.create({ caseId });

    // Run analysis in background (don't await)
    runAnalysisJob(job._id, options).catch(console.error);

    return job;
}

/**
 * Get analysis job status
 */
export async function getJobStatus(jobId) {
    const job = await AnalysisJob.findById(jobId);
    return job;
}

export default {
    analyzeEvidenceBatch,
    runAnalysisJob,
    startAnalysis,
    getJobStatus,
    quickPatternScan
};
