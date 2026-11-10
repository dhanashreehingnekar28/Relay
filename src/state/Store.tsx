import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
  type Dispatch,
} from "react";
import { initialState, reducer, type Action } from "../domain/engine";
import type { State } from "../domain/types";
import { parseState, STORAGE_KEY } from "./persistence";
function read(): State {
  try {
    return parseState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return initialState();
  }
}
const Context = createContext<{
  state: State;
  dispatch: Dispatch<Action>;
  storageError: boolean;
} | null>(null);
export function Store({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, read);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  return (
    <Context.Provider value={{ state, dispatch, storageError }}>
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const c = useContext(Context);
  if (!c) throw Error("Store missing");
  return { ...c, p: c.state.projects[c.state.projectId] };
}
