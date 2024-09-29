import React, { createContext, useContext, useState } from "react";

export type PanelState = "closed" | "list" | "detail";
interface PanelContextType {
  panelState: PanelState;
  setPanelState: React.Dispatch<React.SetStateAction<PanelState>>;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export function PanelContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [panelState, setPanelState] = useState<PanelState>(() => {
    return window.innerWidth < 768 ? "closed" : "list";
  });

  return (
    <PanelContext.Provider value={{ panelState, setPanelState }}>
      {children}
    </PanelContext.Provider>
  );
}

export const usePanelContext = () => {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error(
      "usePanelContext must be used within a PanelContextProvider"
    );
  }
  return context;
};
