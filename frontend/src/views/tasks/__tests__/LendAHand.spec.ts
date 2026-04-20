import {describe, it, expect, vi, beforeEach} from 'vitest'
import {mount, flushPromises} from '@vue/test-utils'
import {nextTick} from 'vue'

const {mockGetAll, mockVolunteer, mockSuccess, mockRouterPush} = vi.hoisted(() => ({
	mockGetAll: vi.fn(),
	mockVolunteer: vi.fn(),
	mockSuccess: vi.fn(),
	mockRouterPush: vi.fn(),
}))

vi.mock('@/services/task', () => ({
	default: vi.fn(function(this: Record<string, unknown>) {
		this.getAll = mockGetAll
		this.volunteer = mockVolunteer
	}),
}))
vi.mock('@/message', () => ({success: mockSuccess}))
vi.mock('vue-router', () => ({useRouter: () => ({push: mockRouterPush})}))
vi.mock('vue-i18n', () => ({useI18n: () => ({t: (key: string) => key})}))

import LendAHand from '../LendAHand.vue'

const BaseButtonStub = {
	template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
	emits: ['click'],
}

function mountComponent({suppressErrors = false} = {}) {
	return mount(LendAHand, {
		global: {
			mocks: {$t: (key: string) => key},
			stubs: {BaseButton: BaseButtonStub},
			config: suppressErrors ? {errorHandler: () => {}} : {},
		},
	})
}

function makeTask(id: number, overrides = {}) {
	return {id, title: `Task ${id}`, projectId: 1, needsSupport: true, ...overrides}
}

describe('LendAHand', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('fetches tasks with needs_support filter on mount', async () => {
		mockGetAll.mockResolvedValue([])
		mountComponent()
		await flushPromises()
		expect(mockGetAll).toHaveBeenCalledWith({}, {filter: 'needs_support = true'})
	})

	it('shows loading state while fetching', async () => {
		mockGetAll.mockReturnValue(new Promise(() => {}))
		const wrapper = mountComponent()
		await nextTick()
		expect(wrapper.find('.tasks-loading').exists()).toBe(true)
		expect(wrapper.find('.task-cards').exists()).toBe(false)
	})

	it('renders a card for each task returned', async () => {
		mockGetAll.mockResolvedValue([makeTask(1), makeTask(2)])
		const wrapper = mountComponent()
		await flushPromises()
		expect(wrapper.findAll('.task-card')).toHaveLength(2)
		expect(wrapper.text()).toContain('Task 1')
		expect(wrapper.text()).toContain('Task 2')
	})

	it('shows empty state when no tasks are returned', async () => {
		mockGetAll.mockResolvedValue([])
		const wrapper = mountComponent()
		await flushPromises()
		expect(wrapper.find('.empty-state').exists()).toBe(true)
		expect(wrapper.find('.task-cards').exists()).toBe(false)
	})

	it('hides loading state after fetch completes', async () => {
		mockGetAll.mockResolvedValue([])
		const wrapper = mountComponent()
		await flushPromises()
		expect(wrapper.find('.tasks-loading').exists()).toBe(false)
	})

	it('volunteer button calls the service and removes task from list', async () => {
		const task = makeTask(10)
		mockGetAll.mockResolvedValue([task])
		mockVolunteer.mockResolvedValue({task: {...task, needsSupport: false}})

		const wrapper = mountComponent()
		await flushPromises()

		const volunteerBtn = wrapper.find('.volunteer-button')
		await volunteerBtn.trigger('click')
		await flushPromises()

		expect(mockVolunteer).toHaveBeenCalledWith(10)
		expect(wrapper.findAll('.task-card')).toHaveLength(0)
	})

	it('shows success toast after volunteering', async () => {
		mockGetAll.mockResolvedValue([makeTask(10)])
		mockVolunteer.mockResolvedValue({task: {}})

		const wrapper = mountComponent()
		await flushPromises()
		await wrapper.find('.volunteer-button').trigger('click')
		await flushPromises()

		expect(mockSuccess).toHaveBeenCalledWith({message: 'lendAHand.volunteerSuccess'})
	})

	it('does not remove task from list when volunteer call fails', async () => {
		// suppressErrors absorbs the Vue unhandled error; the component currently
		// lacks a catch block — this is a known gap the test documents.
		const task = makeTask(10)
		mockGetAll.mockResolvedValue([task])
		mockVolunteer.mockRejectedValue(new Error('Server error'))

		const wrapper = mountComponent({suppressErrors: true})
		await flushPromises()
		await wrapper.find('.volunteer-button').trigger('click')
		await flushPromises()

		expect(wrapper.findAll('.task-card')).toHaveLength(1)
		expect(mockSuccess).not.toHaveBeenCalled()
	})

	it('prevents double-click on volunteer button while in flight', async () => {
		const task = makeTask(10)
		mockGetAll.mockResolvedValue([task])

		let resolve!: (v: unknown) => void
		mockVolunteer.mockReturnValue(new Promise(r => { resolve = r }))

		const wrapper = mountComponent()
		await flushPromises()

		const btn = wrapper.find('.volunteer-button')
		await btn.trigger('click')
		await btn.trigger('click')

		resolve({task: {}})
		await flushPromises()

		expect(mockVolunteer).toHaveBeenCalledTimes(1)
	})

	it('task title click navigates to task detail', async () => {
		mockGetAll.mockResolvedValue([makeTask(7)])
		const wrapper = mountComponent()
		await flushPromises()
		await wrapper.find('.task-title').trigger('click')
		expect(mockRouterPush).toHaveBeenCalledWith({name: 'task.detail', params: {id: 7}})
	})
})
