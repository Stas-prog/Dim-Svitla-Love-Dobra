"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

const MessagesContext = createContext<any>(null);

type Props = {
  children: ReactNode;
  messages: any;
};

export function MessagesProvider({
  children,
  messages,
}: Props) {
  return (
    <MessagesContext.Provider value={messages}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);

  if (!context) {
    throw new Error(
      "useMessages must be used inside MessagesProvider."
    );
  }

  return context;
}