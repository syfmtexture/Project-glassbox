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
 * Build analysis prompt for LLM
 */
function buildAnalysisPrompt(evidence) {
    return `You are a digital forensic analyst assistant. Analyze the following communication record and provide:
1. Priority score (0-100) based on investigative relevance
2. Flags for suspicious content categories
3. Brief summary (1-2 sentences)
4. Sentiment classification

Priority Scoring Guide:
- 80-100 (Critical): Direct evidence of criminal activity
- 60-79 (High): Suspicious content requiring review  
- 40-59 (Medium): Potentially relevant context
- 0-39 (Low): Likely irrelevant, casual conversation

Detection Categories:
- drug_reference: Drug-related content
- violence_threat: Violence or threatening language
- financial_crime: Money laundering, fraud indicators
- conspiracy: Planning, secrecy indicators
- evasion: Evidence destruction, anti-forensic mentions
- key_entity: Important names, locations, organizations

Communication Record:
Timestamp: ${evidence.timestamp || 'Unknown'}
Type: ${evidence.type}
Sender: ${evidence.sender || 'Unknown'}
Receiver: ${evidence.receiver || 'Unknown'}
Content: ${evidence.content || 'No content'}
Source App: ${evidence.source || 'Unknown'}

Respond ONLY with valid JSON in this exact format:
{
  "priorityScore": <number 0-100>,
  "flags": [<array of category strings>],
  "summary": "<brief summary>",
  "sentiment": "<positive|neutral|negative>",
  "entities": [{"type": "<person|location|organization|phone|email>", "value": "<entity value>"}]
}`;
}

/**
 * Analyze a single evidence record with Groq
 */
async function analyzeWithLLM(evidence) {
    try {
        const prompt = buildAnalysisPrompt(evidence);

        const completion = await getGroqClient().chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a forensic analyst AI. Respond only with valid JSON, no markdown or extra text.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 500,
            response_format: { type: 'json_object' }
        });

        const response = completion.choices[0]?.message?.content;
        return JSON.parse(response);
    } catch (error) {
        console.error('LLM analysis error:', error.message);
        return null;
    }
}

/**
 * Analyze evidence with hybrid approach (pattern matching + LLM)
 */
async function analyzeEvidence(evidence, useLLM = true) {
    // Quick pattern scan first
    const patternResult = quickPatternScan(evidence.content);

    let analysis = {
        priorityScore: 0,
        flags: patternResult.categories,
        summary: '',
        sentiment: 'neutral',
        entities: [],
        analyzedAt: new Date()
    };

    // If patterns detected or content is substantial, use LLM
    if (useLLM && (patternResult.hasPatterns || (evidence.content && evidence.content.length > 20))) {
        const llmResult = await analyzeWithLLM(evidence);

        if (llmResult) {
            analysis = {
                priorityScore: llmResult.priorityScore || 0,
                flags: [...new Set([...patternResult.categories, ...(llmResult.flags || [])])],
                summary: llmResult.summary || '',
                sentiment: llmResult.sentiment || 'neutral',
                entities: llmResult.entities || [],
                analyzedAt: new Date()
            };
        } else if (patternResult.hasPatterns) {
            // Fallback: boost score if pattern matched but LLM failed
            analysis.priorityScore = 50;
            analysis.summary = 'Pattern-based detection (LLM unavailable)';
        }
    } else if (patternResult.hasPatterns) {
        // Pattern only (no LLM)
        analysis.priorityScore = 40;
        analysis.summary = `Detected: ${patternResult.categories.join(', ')}`;
    }

    return analysis;
}

/**
 * Process analysis job for a case
 */
export async function runAnalysisJob(jobId, options = {}) {
    const { batchSize = 10, useLLM = true, delayMs = 100 } = options;

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
        for (let i = 0; i < evidence.length; i += batchSize) {
            const batch = evidence.slice(i, i + batchSize);

            // Process batch concurrently
            const analysisPromises = batch.map(ev => analyzeEvidence(ev, useLLM));
            const results = await Promise.all(analysisPromises);

            // Update evidence records
            for (let j = 0; j < batch.length; j++) {
                const ev = batch[j];
                const analysis = results[j];

                ev.analysis = analysis;
                await ev.save();

                processedCount++;
                totalScore += analysis.priorityScore;

                if (analysis.priorityScore >= 60) highPriorityCount++;
                if (analysis.priorityScore >= 80) criticalCount++;
            }

            // Update job progress
            job.processedRecords = processedCount;
            job.highPriorityCount = highPriorityCount;
            job.criticalCount = criticalCount;
            job.stats.averageScore = processedCount > 0 ? Math.round(totalScore / processedCount) : 0;
            await job.save();

            // Rate limiting delay
            if (delayMs > 0 && i + batchSize < evidence.length) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
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
    analyzeEvidence,
    runAnalysisJob,
    startAnalysis,
    getJobStatus,
    quickPatternScan
};
