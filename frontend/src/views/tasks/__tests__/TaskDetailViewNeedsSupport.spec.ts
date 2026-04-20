import {describe, it, expect, vi, beforeEach} from 'vitest'
import {ref, unref} from 'vue'
import type {ITask} from '@/modelTypes/ITask'

const mockUpdate = vi.fn()

vi.mock('@/services/task', () => ({
	default: vi.fn(function(this: Record<string, unknown>) {
		this.update = mockUpdate
	}),
}))

import {useNeedsSupport} from '@/composables/useNeedsSupport'

describe('toggleNeedsSupport', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls update with needsSupport flipped to true', async () => {
		const task = ref({id: 1, title: 'Test', needsSupport: false} as ITask)
		mockUpdate.mockResolvedValue({id: 1, title: 'Test', needsSupport: true} as ITask)

		const {toggleNeedsSupport} = useNeedsSupport(task)
		await toggleNeedsSupport()

		expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({needsSupport: true}))
	})

	it('calls update with needsSupport flipped to false', async () => {
		const task = ref({id: 1, title: 'Test', needsSupport: true} as ITask)
		mockUpdate.mockResolvedValue({id: 1, title: 'Test', needsSupport: false} as ITask)

		const {toggleNeedsSupport} = useNeedsSupport(task)
		await toggleNeedsSupport()

		expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({needsSupport: false}))
	})

	it('updates the task ref with the response from the server', async () => {
		const task = ref({id: 1, title: 'Test', needsSupport: false} as ITask)
		mockUpdate.mockResolvedValue({id: 1, title: 'Test', needsSupport: true})

		const {toggleNeedsSupport} = useNeedsSupport(task)
		await toggleNeedsSupport()

		expect(unref(task).needsSupport).toBe(true)
	})
})
