import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type SessionFilterOptions = {
  hideSessionsWithoutUserMessages: boolean;
};

export const sessionFilterAtom = atomWithStorage<SessionFilterOptions>(
  "session-filters",
  {
    hideSessionsWithoutUserMessages: true,
  }
);

export const hideSessionsWithoutUserMessagesAtom = atom(
  (get) => get(sessionFilterAtom).hideSessionsWithoutUserMessages,
  (get, set, newValue: boolean) => {
    const currentFilters = get(sessionFilterAtom);
    set(sessionFilterAtom, {
      ...currentFilters,
      hideSessionsWithoutUserMessages: newValue,
    });
  }
);
