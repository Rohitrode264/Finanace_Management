import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
    theme: Theme;
    toggle: () => void;
    setTheme: (theme: Theme) => void;
    applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'light',

            toggle: () => {
                const next = get().theme === 'light' ? 'dark' : 'light';
                set({ theme: next });
                get().applyTheme();
            },

            setTheme: (theme: Theme) => {
                set({ theme });
                get().applyTheme();
            },

            applyTheme: () => {
                const { theme } = get();
                const root = document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(theme);
            },
        }),
        { name: 'fms-theme' }
    )
);
