import Evidence from '../models/Evidence.js';

/**
 * Detect burst communication patterns (unusual spikes in activity)
 */
export async function detectBurstCommunication(caseId, options = {}) {
    const { windowHours = 1, thresholdMultiplier = 3 } = options;

    const pipeline = [
        { $match: { caseId } },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m-%d-%H',
                        date: '$timestamp'
                    }
                },
                count: { $sum: 1 },
                messages: { $push: '$$ROOT' }
            }
        },
        { $sort: { '_id': 1 } }
    ];

    const hourlyData = await Evidence.aggregate(pipeline);

    if (hourlyData.length === 0) return { bursts: [], average: 0 };

    // Calculate average
    const total = hourlyData.reduce((sum, h) => sum + h.count, 0);
    const average = total / hourlyData.length;
    const threshold = average * thresholdMultiplier;

    // Find bursts
    const bursts = hourlyData
        .filter(h => h.count > threshold)
        .map(h => ({
            hour: h._id,
            count: h.count,
            intensity: (h.count / average).toFixed(2),
            sampleMessages: h.messages.slice(0, 5).map(m => ({
                id: m._id,
                content: m.content?.substring(0, 100),
                sender: m.sender
            }))
        }));

    return { bursts, average: Math.round(average), threshold: Math.round(threshold) };
}

/**
 * Detect late night activity (communications during unusual hours)
 */
export async function detectLateNightActivity(caseId, options = {}) {
    const { startHour = 23, endHour = 5 } = options;

    const pipeline = [
        { $match: { caseId, timestamp: { $exists: true } } },
        {
            $addFields: {
                hour: { $hour: '$timestamp' }
            }
        },
        {
            $match: {
                $or: [
                    { hour: { $gte: startHour } },
                    { hour: { $lte: endHour } }
                ]
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                count: { $sum: 1 },
                hours: { $addToSet: '$hour' },
                samples: { $push: { id: '$_id', sender: '$sender', hour: '$hour' } }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
    ];

    const results = await Evidence.aggregate(pipeline);

    return {
        dates: results.map(r => ({
            date: r._id,
            count: r.count,
            hours: r.hours.sort((a, b) => a - b),
            samples: r.samples.slice(0, 5)
        })),
        totalLateNight: results.reduce((sum, r) => sum + r.count, 0)
    };
}

/**
 * Identify contact network by message frequency
 */
export async function analyzeContactNetwork(caseId, options = {}) {
    const { minMessages = 3, limit = 50 } = options;

    // Aggregate by sender-receiver pairs
    const pipeline = [
        { $match: { caseId, type: 'message' } },
        {
            $group: {
                _id: {
                    sender: '$sender',
                    receiver: '$receiver'
                },
                messageCount: { $sum: 1 },
                firstContact: { $min: '$timestamp' },
                lastContact: { $max: '$timestamp' }
            }
        },
        { $match: { messageCount: { $gte: minMessages } } },
        { $sort: { messageCount: -1 } },
        { $limit: limit }
    ];

    const pairs = await Evidence.aggregate(pipeline);

    // Build contact frequency map
    const contacts = {};

    for (const pair of pairs) {
        const { sender, receiver } = pair._id;

        if (sender) {
            contacts[sender] = contacts[sender] || { total: 0, contacts: {} };
            contacts[sender].total += pair.messageCount;
            contacts[sender].contacts[receiver || 'Unknown'] = pair.messageCount;
        }

        if (receiver) {
            contacts[receiver] = contacts[receiver] || { total: 0, contacts: {} };
            contacts[receiver].total += pair.messageCount;
            contacts[receiver].contacts[sender || 'Unknown'] = pair.messageCount;
        }
    }

    // Rank contacts by total messages
    const rankedContacts = Object.entries(contacts)
        .map(([name, data]) => ({
            name,
            totalMessages: data.total,
            uniqueContacts: Object.keys(data.contacts).length,
            topContacts: Object.entries(data.contacts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([contact, count]) => ({ contact, count }))
        }))
        .sort((a, b) => b.totalMessages - a.totalMessages)
        .slice(0, 20);

    return {
        keyContacts: rankedContacts,
        totalPairs: pairs.length
    };
}

/**
 * Detect timeline gaps (suspicious periods of no activity)
 */
export async function detectTimelineGaps(caseId, options = {}) {
    const { minGapHours = 24 } = options;

    // Get all timestamps sorted
    const evidence = await Evidence.find(
        { caseId, timestamp: { $exists: true } },
        { timestamp: 1 }
    ).sort({ timestamp: 1 });

    if (evidence.length < 2) return { gaps: [], totalRecords: evidence.length };

    const gaps = [];

    for (let i = 1; i < evidence.length; i++) {
        const prev = evidence[i - 1].timestamp;
        const curr = evidence[i].timestamp;
        const diffHours = (curr - prev) / (1000 * 60 * 60);

        if (diffHours >= minGapHours) {
            gaps.push({
                startTime: prev,
                endTime: curr,
                gapHours: Math.round(diffHours),
                gapDays: (diffHours / 24).toFixed(1)
            });
        }
    }

    // Sort by gap size
    gaps.sort((a, b) => b.gapHours - a.gapHours);

    return {
        gaps: gaps.slice(0, 20),
        totalGaps: gaps.length,
        totalRecords: evidence.length,
        timespan: {
            first: evidence[0].timestamp,
            last: evidence[evidence.length - 1].timestamp
        }
    };
}

/**
 * Get temporal distribution (messages per day/hour)
 */
export async function getTemporalDistribution(caseId) {
    // Daily distribution
    const dailyPipeline = [
        { $match: { caseId, timestamp: { $exists: true } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                count: { $sum: 1 },
                types: { $addToSet: '$type' }
            }
        },
        { $sort: { '_id': 1 } }
    ];

    // Hourly distribution (aggregate by hour of day)
    const hourlyPipeline = [
        { $match: { caseId, timestamp: { $exists: true } } },
        {
            $group: {
                _id: { $hour: '$timestamp' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } }
    ];

    // Day of week distribution
    const weekdayPipeline = [
        { $match: { caseId, timestamp: { $exists: true } } },
        {
            $group: {
                _id: { $dayOfWeek: '$timestamp' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } }
    ];

    const [daily, hourly, weekday] = await Promise.all([
        Evidence.aggregate(dailyPipeline),
        Evidence.aggregate(hourlyPipeline),
        Evidence.aggregate(weekdayPipeline)
    ]);

    // Convert weekday numbers to names
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdayData = weekday.map(w => ({
        day: weekdayNames[w._id - 1],
        count: w.count
    }));

    return {
        daily: daily.map(d => ({ date: d._id, count: d.count })),
        hourly: hourly.map(h => ({ hour: h._id, count: h.count })),
        weekday: weekdayData
    };
}

/**
 * Generate case statistics summary
 */
export async function getCaseStats(caseId) {
    const pipeline = [
        { $match: { caseId } },
        {
            $group: {
                _id: null,
                totalRecords: { $sum: 1 },
                byType: { $push: '$type' },
                bySource: { $push: '$source' },
                avgPriority: { $avg: '$analysis.priorityScore' },
                highPriority: {
                    $sum: { $cond: [{ $gte: ['$analysis.priorityScore', 60] }, 1, 0] }
                },
                critical: {
                    $sum: { $cond: [{ $gte: ['$analysis.priorityScore', 80] }, 1, 0] }
                },
                bookmarked: {
                    $sum: { $cond: ['$isBookmarked', 1, 0] }
                },
                analyzed: {
                    $sum: { $cond: [{ $ifNull: ['$analysis.analyzedAt', false] }, 1, 0] }
                },
                firstTimestamp: { $min: '$timestamp' },
                lastTimestamp: { $max: '$timestamp' }
            }
        }
    ];

    const [result] = await Evidence.aggregate(pipeline);

    if (!result) {
        return {
            totalRecords: 0,
            types: {},
            sources: {},
            priority: { avgScore: 0, high: 0, critical: 0 },
            bookmarked: 0,
            analyzed: 0,
            timespan: null
        };
    }

    // Count types and sources
    const typeCounts = {};
    result.byType.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1; });

    const sourceCounts = {};
    result.bySource.forEach(s => { sourceCounts[s || 'Unknown'] = (sourceCounts[s || 'Unknown'] || 0) + 1; });

    return {
        totalRecords: result.totalRecords,
        types: typeCounts,
        sources: sourceCounts,
        priority: {
            avgScore: Math.round(result.avgPriority || 0),
            high: result.highPriority,
            critical: result.critical
        },
        bookmarked: result.bookmarked,
        analyzed: result.analyzed,
        timespan: result.firstTimestamp && result.lastTimestamp ? {
            start: result.firstTimestamp,
            end: result.lastTimestamp,
            days: Math.ceil((result.lastTimestamp - result.firstTimestamp) / (1000 * 60 * 60 * 24))
        } : null
    };
}

export default {
    detectBurstCommunication,
    detectLateNightActivity,
    analyzeContactNetwork,
    detectTimelineGaps,
    getTemporalDistribution,
    getCaseStats
};
