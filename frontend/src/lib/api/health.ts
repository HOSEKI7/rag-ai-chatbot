export type ServiceHealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface BackendHealthData {
  status: ServiceHealthStatus
  service: string
  version: string
  environment: string
  connectivity: Record<string, string>
}

export interface HealthCheckResult {
  isHealthy: boolean
  data: BackendHealthData | null
  error: string | null
}

/**
 * Probes the backend health status endpoint.
 * @param baseUrl Optional base URL for backend (defaults to env NEXT_PUBLIC_BACKEND_URL or http://localhost:8000)
 */
export async function checkBackendHealth(
  baseUrl?: string
): Promise<HealthCheckResult> {
  const host =
    baseUrl ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:8000'

  const endpoint = `${host.replace(/\/$/, '')}/api/v1/health`

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return {
        isHealthy: false,
        data: null,
        error: `HTTP error ${response.status}: ${response.statusText}`,
      }
    }

    const data = (await response.json()) as BackendHealthData

    return {
      isHealthy: data.status === 'healthy',
      data,
      error: null,
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown network error occurred'
    return {
      isHealthy: false,
      data: null,
      error: message,
    }
  }
}
