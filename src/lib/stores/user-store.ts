import { writable } from 'svelte/store';
import type { PublicUser } from '$lib/server/auth';

export interface UserState {
	user: PublicUser | null;
	isLoading: boolean;
}

function createUserStore() {
	const { subscribe, set, update } = writable<UserState>({
		user: null,
		isLoading: false
	});

	return {
		subscribe,
		setUser: (user: PublicUser | null) => {
			update(state => ({ ...state, user }));
		},
		updateBalance: (newBalance: number) => {
			update(state => {
				if (state.user) {
					return {
						...state,
						user: {
							...state.user,
							balance: newBalance
						}
					};
				}
				return state;
			});
		},
		setLoading: (isLoading: boolean) => {
			update(state => ({ ...state, isLoading }));
		},
		reset: () => {
			set({ user: null, isLoading: false });
		}
	};
}

export const userStore = createUserStore();
