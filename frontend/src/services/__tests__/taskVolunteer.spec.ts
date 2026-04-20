import {describe, it, expect, vi, beforeEach} from 'vitest'
import TaskService from '../task'

const mockPost = vi.hoisted(() => vi.fn())

vi.mock('@/helpers/fetcher', () => ({
	AuthenticatedHTTPFactory: vi.fn(() => ({
		post: mockPost,
		get: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
		interceptors: {
			request: {use: vi.fn()},
			response: {use: vi.fn()},
		},
	})),
}))

describe('TaskService.volunteer', () => {
	let service: TaskService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new TaskService()
	})

	it('POSTs to the correct endpoint', async () => {
		mockPost.mockResolvedValue({data: {task: {id: 42, needsSupport: false}}})
		await service.volunteer(42)
		expect(mockPost).toHaveBeenCalledWith('/tasks/42/volunteer', {})
	})

	it('returns the task object from the response', async () => {
		const taskData = {id: 42, title: 'Test', needsSupport: false}
		mockPost.mockResolvedValue({data: {task: taskData}})
		const result = await service.volunteer(42)
		expect(result).toEqual({task: taskData})
	})

	it('propagates errors from the API', async () => {
		mockPost.mockRejectedValue(new Error('Forbidden'))
		await expect(service.volunteer(42)).rejects.toThrow('Forbidden')
	})
})
