import { create } from 'zustand';

export interface PulseToast {
  id: number;
  label: string;
}

interface ToastState {
  pulses: PulseToast[];
  pulse: (label: string) => void;
  remove: (id: number) => void;
}

let seq = 0;

export const useToastStore = create<ToastState>((set) => ({
  pulses: [],
  pulse: (label) => {
    const id = ++seq;
    set((s) => ({ pulses: [...s.pulses, { id, label }] }));
    window.setTimeout(() => {
      set((s) => ({ pulses: s.pulses.filter((p) => p.id !== id) }));
    }, 1400);
  },
  remove: (id) => set((s) => ({ pulses: s.pulses.filter((p) => p.id !== id) })),
}));
