export type EslintContext = {
  report: (message: any) => void
}

export type EslintNode = {
  callee?: {
    type: string,
    name: string,
    property?: {
      name: string,
      value: string,
    },
    object?: {
      name: string,
    },
  }
}
