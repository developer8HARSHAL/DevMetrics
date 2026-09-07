function summarize(requests) {
    const safeRequests = Array.isArray(requests) ? requests : [];
    const errorCount = safeRequests.filter(
            (r) => Number(r.status) >= 400)
        .length;
    const times = safeRequests.map((r) => Number(r.response_time))
        .filter((n) => Number.isFinite(n));
    const avgResponseTime = times.length > 0 ? Math.round(times.reduce((sum,
        value) => sum + value, 0) / times.length) : 0;
    return {
        requestCount: safeRequests.length,
        errorCount,
        avgResponseTime
    };
}

function durationMs(session) {
    if (!session?.started_at || !session?.ended_at) {
        return null;
    }
    return Math.max(0, new Date(session.ended_at)
        .getTime() - new Date(session.started_at)
        .getTime());
}

function byEndpoint(requests) {
    const map = new Map();
    for (const request of requests || []) {
        if (!map.has(request.endpoint)) {
            map.set(request.endpoint, {
                count: 0,
                errorCount: 0,
                lastStatus: null,
                lastTimestamp: null
            });
        }
        const entry = map.get(request.endpoint);
        entry.count += 1;
        if (Number(request.status) >= 400) {
            entry.errorCount += 1;
        }
        if (!entry.lastTimestamp || new Date(request.timestamp) > new Date(entry
                .lastTimestamp)) {
            entry.lastStatus = request.status;
            entry.lastTimestamp = request.timestamp;
        }
    }
    return map;
}

function pctChange(from, to) {
    if (from === 0) {
        return null;
    }
    return Math.round(
        ((to - from) / from) * 100);
}

function findingKey(finding) {
    return `${finding.type}::${finding.endpoint ?? ""}`;
}

function diffFindings(findingsA, findingsB) {
    const safeA = Array.isArray(findingsA) ? findingsA : [];
    const safeB = Array.isArray(findingsB) ? findingsB : [];
    const keysA = new Set(safeA.map(findingKey));
    const keysB = new Set(safeB.map(findingKey));
    const resolved = safeA.filter(
        (finding) => !keysB.has(findingKey(finding)));
    const newFindings = safeB.filter(
        (finding) => !keysA.has(findingKey(finding)));
    return {
        resolved,
        new: newFindings
    };
}

function severityRank(severity) {
    switch (severity) {
        case "critical":
            return 3;
        case "warning":
            return 2;
        case "info":
            return 1;
        default:
            return 0;
    }
}

function hasMeaningfulLatencyRegression(avgA, avgB) {
    /*
     * No baseline latency means there is
     * no meaningful percentage comparison.
     */
    if (avgA <= 0) {
        return false;
    }
    /*
     * Treat >10% slower average latency as
     * a regression signal.
     */
    return (
        ((avgB - avgA) / avgA) > 0.10);
}

function hasMeaningfulLatencyImprovement(avgA, avgB) {
    if (avgA <= 0) {
        return false;
    }
    return (
        ((avgA - avgB) / avgA) > 0.10);
}

function computeVerdict({
    summaryA,
    summaryB,
    resolved,
    newFindings,
    statusChanges
}) {
    const newCritical = newFindings.some(
        (finding) => finding.severity === "critical");
    const resolvedCritical = resolved.some(
        (finding) => finding.severity === "critical");
    const errorRegression = summaryB.errorCount > summaryA.errorCount;
    const errorImprovement = summaryB.errorCount < summaryA.errorCount;
    const latencyRegression = hasMeaningfulLatencyRegression(summaryA
        .avgResponseTime, summaryB.avgResponseTime);
    const latencyImprovement = hasMeaningfulLatencyImprovement(summaryA
        .avgResponseTime, summaryB.avgResponseTime);
    const statusRegression = statusChanges.some(
        (change) => {
            const beforeError = Number(change.statusA) >= 400;
            const afterError = Number(change.statusB) >= 400;
            return (!beforeError && afterError);
        });
    const statusImprovement = statusChanges.some(
        (change) => {
            const beforeError = Number(change.statusA) >= 400;
            const afterError = Number(change.statusB) >= 400;
            return (beforeError && !afterError);
        });
    const regressionSignals = [
            newCritical,
            errorRegression,
            latencyRegression,
            statusRegression
        ].filter(Boolean)
        .length;
    const improvementSignals = [
            errorImprovement,
            latencyImprovement,
            statusImprovement,
            resolvedCritical
        ].filter(Boolean)
        .length;
    if (regressionSignals > 0 && improvementSignals > 0) {
        return "mixed";
    }
    if (regressionSignals > 0) {
        return "regressed";
    }
    if (improvementSignals > 0) {
        return "improved";
    }
    if (resolved.length === 0 && newFindings.length === 0 && statusChanges
        .length === 0 && summaryA.errorCount === summaryB.errorCount && summaryA
        .avgResponseTime === summaryB.avgResponseTime && summaryA
        .requestCount === summaryB.requestCount) {
        return "unchanged";
    }
    return "mixed";
}
export function compareRuns(runA, runB) {
    const requestsA = Array.isArray(runA?.requests) ? runA.requests : [];
    const requestsB = Array.isArray(runB?.requests) ? runB.requests : [];
    const findingsA = Array.isArray(runA?.findings) ? runA.findings : [];
    const findingsB = Array.isArray(runB?.findings) ? runB.findings : [];
    const summaryA = summarize(requestsA);
    const summaryB = summarize(requestsB);
    const durationA = durationMs(runA?.session);
    const durationB = durationMs(runB?.session);
    const {
        resolved,
        new: newFindings
    } = diffFindings(findingsA, findingsB);
    const endpointsA = byEndpoint(requestsA);
    const endpointsB = byEndpoint(requestsB);
    const onlyInA = [...endpointsA.keys()].filter(
        (endpoint) => !endpointsB.has(endpoint));
    const onlyInB = [...endpointsB.keys()].filter(
        (endpoint) => !endpointsA.has(endpoint));
    const shared = [...endpointsA.keys()].filter(
        (endpoint) => endpointsB.has(endpoint));
    const statusChanges = shared.map((endpoint) => {
            const a = endpointsA.get(endpoint);
            const b = endpointsB.get(endpoint);
            if (a.lastStatus === b.lastStatus) {
                return null;
            }
            return {
                type: "status_change",
                endpoint,
                statusA: a.lastStatus,
                statusB: b.lastStatus
            };
        })
        .filter(Boolean);
    const verdict = computeVerdict({
        summaryA,
        summaryB,
        resolved,
        newFindings,
        statusChanges
    });
    return {
        runA: {
            id: runA.session.id,
            name: runA.session.name,
            ...summaryA,
            durationMs: durationA,
            findingCount: findingsA.length
        },
        runB: {
            id: runB.session.id,
            name: runB.session.name,
            ...summaryB,
            durationMs: durationB,
            findingCount: findingsB.length
        },
        deltas: {
            requestCount: summaryB.requestCount - summaryA.requestCount,
            errorCount: summaryB.errorCount - summaryA.errorCount,
            errorCountPct: pctChange(summaryA.errorCount, summaryB.errorCount),
            avgResponseTime: summaryB.avgResponseTime - summaryA
                .avgResponseTime,
            durationMs: durationA != null && durationB != null ? durationB -
                durationA : null,
            durationPct: durationA != null && durationB != null ? pctChange(
                durationA, durationB) : null,
            findingCount: findingsB.length - findingsA.length,
            findingCountPct: pctChange(findingsA.length, findingsB.length)
        },
        endpoints: {
            onlyInA,
            onlyInB,
            shared
        },
        statusChanges,
        findings: {
            resolved,
            new: newFindings
        },
        verdict
    };
}