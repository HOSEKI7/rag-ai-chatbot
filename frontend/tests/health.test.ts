import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkBackendHealth, BackendHealthData } from '@/lib/api/health'

describe('checkBackendHealth', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns healthy status when backend API responds successfully', async () => {
    const mockHealthData: BackendHealthData = {
      status: 'healthy',
      service: 'contexure-backend',
      version: '0.1.0',
      environment: 'test',
      connectivity: {
        api: 'connected',
        runtime: 'python-fastapi',
      },
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHealthData,
    })

    const result = await checkBackendHealth('http://localhost:8000')
    expect(result).toEqual({
      isHealthy: true,
      data: mockHealthData,
      error: null,
    })
  })

  it('handles backend network errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'))

    const result = await checkBackendHealth('http://localhost:8000')
    expect(result.isHealthy).toBe(false)
    expect(result.data).toBeNull()
    expect(result.error).toContain('Connection refused')
  })
})
