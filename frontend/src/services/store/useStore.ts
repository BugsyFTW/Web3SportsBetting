import { create } from "zustand";

import { getECCompetition } from "@/services/api";
import { CompetitionData } from "@/types";

interface StoreData {
  competition: CompetitionData | null;
  loading: boolean;
  error: string | null;
  fetchCompetition: () => Promise<void>;
}

export const useStore = create<StoreData>((set) => ({
  competition: null,
  loading: false,
  error: null,
  fetchCompetition: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await getECCompetition();
      set({ competition: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));