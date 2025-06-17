class ChainUserError extends Error {
  constructor(message, code = 666) {
    super(message);
    this.code = code;
  }
}

class UserInputError extends Error {
  code;
  solution
  error_code;
  constructor(message, code = 400, extra) {
    super(message);
    this.name = 'UserInputError';
    this.code = code;
    if (extra?.solution) {
      this.solution = extra.solution
    }
    if (extra?.err_code) {
      this.error_code = extra.err_code
    }
  }
}

module.exports = { UserInputError, ChainUserError };
