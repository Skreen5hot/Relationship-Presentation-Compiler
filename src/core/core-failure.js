export class CoreFailure extends Error {
  constructor(code, violations = []) {
    super(code);
    this.code = code;
    this.violations = violations;
  }
}

export function fail(code, violations = []) {
  throw new CoreFailure(code, violations);
}
