import type {Prefixes} from './types'

const MOGPENDIUM_PREFIXES: Prefixes = {
	label: '*',
	project: '+',
	priority: '!',
	assignee: '@',
}

const TODOIST_PREFIXES: Prefixes = {
	label: '@',
	project: '#',
	priority: '!',
	assignee: '+',
}

export enum PrefixMode {
	Disabled = 'disabled',
	Default = 'mogpendium',
	Todoist = 'todoist',
}

export const PREFIXES = {
	[PrefixMode.Disabled]: undefined,
	[PrefixMode.Default]: MOGPENDIUM_PREFIXES,
	[PrefixMode.Todoist]: TODOIST_PREFIXES,
}
