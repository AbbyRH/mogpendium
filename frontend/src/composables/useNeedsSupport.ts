import {type Ref} from 'vue'
import type {ITask} from '@/modelTypes/ITask'
import TaskService from '@/services/task'

export function useNeedsSupport(task: Ref<ITask>) {
	const taskService = new TaskService()

	async function toggleNeedsSupport() {
		if (!task.value) return
		const newTask: ITask = {...task.value, needsSupport: !task.value.needsSupport}
		Object.assign(task.value, await taskService.update(newTask))
	}

	return {toggleNeedsSupport}
}
