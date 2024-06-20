import fs from "fs";

const Location = {
  Inline: 0,
  Remote: 1,
};

const CodeLanguage = {
  JavaScript: 0,
};

const ReturnType = {
  uint: "uint256",
  uint256: "uint256",
  int: "int256",
  int256: "int256",
  string: "string",
  bytes: "Buffer",
  Buffer: "Buffer",
};

// Configure the request by setting the fields below
export const requestConfig = {
  // Location of source code (only Inline is currently supported)
  codeLocation: Location.Inline,
  // Code language (only JavaScript is currently supported)
  codeLanguage: CodeLanguage.JavaScript,
  // String containing the source code to be executed
  source: fs.readFileSync("./api-call.ts").toString(),
  // Secrets can be accessed within the source code with `secrets.varName` (ie: secrets.apiKey). The secrets object can only contain string values.
  secrets: { apiKey: "TODO GET FROM .ENV" },
  // Args (string only array) can be accessed within the source code with `args[index]` (ie: args[0]).
  args: [""],
  // Expected type of the returned value
  expectedReturnType: ReturnType.uint256
}