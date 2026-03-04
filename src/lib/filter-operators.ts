export interface OperatorOption {
  value: string;
  label: string;
}

export const OPERATORS_BY_TYPE: Record<string, OperatorOption[]> = {
  text: [
    { value: "=", label: "equals" },
    { value: "!=", label: "not equals" },
    { value: "LIKE", label: "contains" },
  ],
  number: [
    { value: "=", label: "=" },
    { value: "!=", label: "!=" },
    { value: ">", label: ">" },
    { value: "<", label: "<" },
    { value: ">=", label: ">=" },
    { value: "<=", label: "<=" },
  ],
  calendar_date: [
    { value: "=", label: "on" },
    { value: ">", label: "after" },
    { value: "<", label: "before" },
    { value: ">=", label: "on or after" },
    { value: "<=", label: "on or before" },
  ],
};

export function getOperatorsForType(dataType: string): OperatorOption[] {
  return OPERATORS_BY_TYPE[dataType] ?? OPERATORS_BY_TYPE.text;
}
