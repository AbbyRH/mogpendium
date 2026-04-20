<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {success} from '@/message'
import TaskService from '@/services/task'
import type {ITask} from '@/modelTypes/ITask'
import BaseButton from '@/components/base/BaseButton.vue'
import {useRouter} from 'vue-router'

const {t} = useI18n({useScope: 'global'})
const router = useRouter()
const taskService = new TaskService()

const tasks = ref<ITask[]>([])
const isLoading = ref(false)
const volunteering = ref<Record<number, boolean>>({})

onMounted(async () => {
	isLoading.value = true
	try {
		const result = await taskService.getAll({}, {filter: 'needs_support = true'})
		tasks.value = Array.isArray(result) ? result : []
	} finally {
		isLoading.value = false
	}
})

async function volunteer(task: ITask) {
	if (volunteering.value[task.id]) return
	volunteering.value[task.id] = true
	try {
		await taskService.volunteer(task.id)
		tasks.value = tasks.value.filter(t => t.id !== task.id)
		success({message: t('lendAHand.volunteerSuccess')})
	} finally {
		volunteering.value[task.id] = false
	}
}

function openTask(task: ITask) {
	router.push({name: 'task.detail', params: {id: task.id}})
}
</script>

<template>
	<div class="is-max-width-desktop lend-a-hand-view">
		<h1 class="title mbe-4">
			{{ $t('lendAHand.title') }}
		</h1>
		<p class="mbe-4 description">
			{{ $t('lendAHand.description') }}
		</p>

		<div
			v-if="isLoading"
			class="tasks-loading"
		>
			<span class="loader-container is-loading-small is-loading" />
		</div>

		<div
			v-else-if="tasks.length === 0"
			class="empty-state"
		>
			<p>{{ $t('lendAHand.empty') }}</p>
		</div>

		<div
			v-else
			class="task-cards"
		>
			<div
				v-for="task in tasks"
				:key="task.id"
				class="task-card"
			>
				<div class="task-card-content">
					<BaseButton
						class="task-title"
						@click="openTask(task)"
					>
						{{ task.title }}
					</BaseButton>
					<p
						v-if="task.projectId"
						class="task-project"
					>
						{{ $t('lendAHand.inProject', {project: task.projectId}) }}
					</p>
				</div>
				<BaseButton
					class="volunteer-button"
					:class="{'is-loading': volunteering[task.id]}"
					@click="volunteer(task)"
				>
					{{ $t('lendAHand.volunteerButton') }}
				</BaseButton>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.lend-a-hand-view {
	padding: 2rem 1rem;
}

.description {
	color: var(--text-light);
	font-size: 1rem;
}

.tasks-loading {
	display: flex;
	justify-content: center;
	padding: 3rem;
}

.empty-state {
	text-align: center;
	padding: 4rem 2rem;
	color: var(--text-light);
	font-size: 1.1rem;
}

.task-cards {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.task-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 1.25rem 1.5rem;
	background: var(--white);
	border: 1px solid var(--card-border-color);
	border-radius: 0.75rem;
	box-shadow: var(--shadow-sm);
	transition: box-shadow 150ms ease;

	&:hover {
		box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,.08));
	}
}

.task-card-content {
	flex: 1;
	min-inline-size: 0;
}

.task-title {
	font-size: 1rem;
	font-weight: 600;
	color: var(--text-strong);
	text-align: start;
	white-space: normal;
	word-break: break-word;

	&:hover {
		color: var(--primary);
	}
}

.task-project {
	margin-block-start: 0.25rem;
	font-size: 0.85rem;
	color: var(--text-light);
}

.volunteer-button {
	flex-shrink: 0;
	padding: 0.5rem 1.25rem;
	background: var(--primary);
	color: var(--primary-invert);
	border-radius: 2rem;
	font-weight: 600;
	font-size: 0.9rem;
	transition: background 150ms ease, transform 100ms ease;

	&:hover {
		background: var(--primary-dark);
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
	}
}
</style>
