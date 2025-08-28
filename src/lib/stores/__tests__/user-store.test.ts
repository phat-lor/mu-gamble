import { describe, it, expect, beforeEach } from 'bun:test';
import { userStore } from '../user-store';

describe('User Store', () => {
	beforeEach(() => {
		// Reset store before each test
		userStore.reset();
	});

	it('should initialize with null user and false loading', () => {
		let state: any;
		const unsubscribe = userStore.subscribe((s) => {
			state = s;
		});
		unsubscribe();
		
		expect(state.user).toBeNull();
		expect(state.isLoading).toBe(false);
	});

	it('should set user correctly', () => {
		const testUser = {
			id: 'test-id',
			username: 'testuser',
			balance: 1000,
			isAdmin: false
		};

		userStore.setUser(testUser);
		
		let state: any;
		const unsubscribe = userStore.subscribe((s) => {
			state = s;
		});
		unsubscribe();
		
		expect(state.user).toEqual(testUser);
	});

	it('should update balance correctly', () => {
		const testUser = {
			id: 'test-id',
			username: 'testuser',
			balance: 1000,
			isAdmin: false
		};

		userStore.setUser(testUser);
		userStore.updateBalance(1500);

		let state: any;
		const unsubscribe = userStore.subscribe((s) => {
			state = s;
		});
		unsubscribe();
		
		expect(state.user?.balance).toBe(1500);
		expect(state.user?.username).toBe('testuser'); // Other properties unchanged
	});

	it('should not update balance when user is null', () => {
		userStore.updateBalance(1500);
		
		let state: any;
		const unsubscribe = userStore.subscribe((s) => {
			state = s;
		});
		unsubscribe();
		
		expect(state.user).toBeNull();
	});

	it('should set loading state correctly', () => {
		userStore.setLoading(true);
		
		let state: any;
		const unsubscribe = userStore.subscribe((s) => {
			state = s;
		});
		unsubscribe();
		
		expect(state.isLoading).toBe(true);
	});

	it('should reset to initial state', () => {
		const testUser = {
			id: 'test-id',
			username: 'testuser',
			balance: 1000,
			isAdmin: false
		};

		userStore.setUser(testUser);
		userStore.setLoading(true);
		userStore.reset();

		let state: any;
		const unsubscribe = userStore.subscribe((s) => {
			state = s;
		});
		unsubscribe();
		
		expect(state.user).toBeNull();
		expect(state.isLoading).toBe(false);
	});
});
