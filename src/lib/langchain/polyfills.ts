// LangChain 浏览器兼容性 Polyfill
export class AsyncLocalStorage {
  disable() {}
  getStore() { return undefined; }
  run(_: any, callback: () => any) { return callback(); }
  exit(callback: () => any) { return callback(); }
  enterWith() {}
}

export default {
  AsyncLocalStorage,
};
