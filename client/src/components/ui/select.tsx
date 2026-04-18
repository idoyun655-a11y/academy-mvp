import * as React from "react";

type SelectProps = React.PropsWithChildren<{
  value?: string;
  onValueChange?: (value: string) => void;
}>;

type SelectContextValue = {
  value?: string;
  onValueChange?: (value: string) => void;
};

const SelectContext = React.createContext<SelectContextValue>({});

export function Select({ children, value, onValueChange }: SelectProps) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children }: React.PropsWithChildren) {
  return <div>{children}</div>;
}

export function SelectValue() {
  const { value } = React.useContext(SelectContext);
  return <span>{value ?? "Select..."}</span>;
}

export function SelectContent({ children }: React.PropsWithChildren) {
  return <div className="mt-2 space-y-2">{children}</div>;
}

export function SelectItem({
  children,
  value,
}: React.PropsWithChildren<{ value: string }>) {
  const { onValueChange } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  );
}
