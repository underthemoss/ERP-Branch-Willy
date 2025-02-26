//
const { contentTypeConfig } = require("./src/db/Config");
const fs = require("fs");

const traverse = (type: any, contents: any) => {};

const result = traverse(contentTypeConfig, "");
