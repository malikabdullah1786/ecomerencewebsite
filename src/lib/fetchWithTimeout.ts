/**
 * fetchWithTimeout - A wrapper around fetch() that enforces a timeout.
 * 
 * If the request takes longer than `timeoutMs` milliseconds,
 * the request is aborted and an Error('Request timed out') is thrown.
 * This prevents API calls from hanging forever when the backend is slow.
 */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs = 20000
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } catch (err: any) {
        if (err.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeoutMs / 1000}s. Please try again.`);
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}
