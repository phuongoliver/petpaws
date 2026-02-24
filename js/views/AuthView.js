import { bus } from '../core/EventBus.js';

export class AuthView {
    constructor(userModel) {
        this.userModel = userModel;
        this.isLoginMode = true;

        // DOM Elements
        this.authViewEl = document.getElementById('auth-view');
        this.mainViewEl = document.getElementById('main-view');
        this.authForm = document.getElementById('auth-form');
        this.authTitle = document.getElementById('auth-title');
        this.authSubmitBtn = document.getElementById('auth-submit-btn');
        this.authSwitchText = document.getElementById('auth-switch-text');
        this.authSwitchBtn = document.getElementById('auth-switch-btn');
        this.authError = document.getElementById('auth-error');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.logoutBtn = document.getElementById('logout-btn');

        this.bindEvents();
    }

    bindEvents() {
        // Form Switch
        if (this.authSwitchBtn) {
            this.authSwitchBtn.addEventListener('click', () => this.toggleMode());
        }

        // Form Submit
        if (this.authForm) {
            this.authForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Logout
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => {
                bus.emit('REQUEST_LOGOUT'); // Timer should stop if running
                this.userModel.logout();
            });
        }

        // Listen to EventBus for View changes
        bus.on('USER_LOGGED_IN', (data) => {
            if (data.hasAdoptedPet) {
                this.showMainView();
            } else {
                this.hideAuthView(); // Let OnboardingView handle the rest
            }
        });

        bus.on('USER_LOGGED_OUT', () => this.showAuthView());

        bus.on('ONBOARDING_COMPLETE', () => this.showMainView());
    }

    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
        this.authError.textContent = '';
        if (this.isLoginMode) {
            this.authTitle.textContent = 'Đăng nhập';
            this.authSubmitBtn.textContent = 'Vào ngay';
            this.authSwitchText.textContent = 'Chưa có tài khoản?';
            this.authSwitchBtn.textContent = 'Đăng ký ngay';
        } else {
            this.authTitle.textContent = 'Đăng ký';
            this.authSubmitBtn.textContent = 'Tạo tài khoản';
            this.authSwitchText.textContent = 'Đã có tài khoản?';
            this.authSwitchBtn.textContent = 'Đăng nhập';
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (!username || !password) {
            this.showError('Vui lòng nhập đầy đủ thông tin.');
            return;
        }

        let result;
        if (this.isLoginMode) {
            result = this.userModel.login(username, password);
        } else {
            result = this.userModel.register(username, password);
        }

        if (!result.success) {
            this.showError(result.message);
        }
    }

    showError(msg) {
        if (this.authError) this.authError.textContent = msg;
    }

    showAuthView() {
        if (this.authViewEl) {
            this.authViewEl.style.display = 'flex';
        }
        if (this.mainViewEl) {
            this.mainViewEl.style.display = 'none';
        }
        this.authError.textContent = '';
        this.usernameInput.value = '';
        this.passwordInput.value = '';
    }

    hideAuthView() {
        if (this.authViewEl) {
            this.authViewEl.style.display = 'none';
        }
    }

    showMainView() {
        if (this.authViewEl) this.authViewEl.style.display = 'none';
        if (this.mainViewEl) this.mainViewEl.style.display = 'flex';
    }
}
