/** One Supabase client, explicit persistence; no tokens in diagnostics. */
export class BrowserAuthStorage {
  private readonly memory = new Map<string, string>();
  private persistent = false;
  private readonly preferenceKey: string;

  constructor(
    private readonly namespace: string,
    private readonly local: Storage | null,
    private readonly tab: Storage | null,
  ) {
    this.preferenceKey = `${namespace}.remember`;
    this.persistent = this.read(this.local, this.preferenceKey) === 'true';
    // Existing SDK sessions without a preference are migrated to this tab only.
    this.move(this.persistent ? this.tab : this.local, this.persistent ? this.local : this.tab);
  }

  getItem(key: string): string | null {
    return this.read(this.persistent ? this.local : this.tab, key) ?? this.memory.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.write(this.persistent ? this.local : this.tab, key, value)) this.memory.delete(key);
    else this.memory.set(key, value);
    this.remove(this.persistent ? this.tab : this.local, key);
  }
  removeItem(key: string): void {
    this.memory.delete(key);
    this.remove(this.local, key);
    this.remove(this.tab, key);
  }
  setRemember(remember: boolean): void {
    if (remember !== this.persistent) {
      this.move(remember ? this.tab : this.local, remember ? this.local : this.tab);
      this.persistent = remember;
    }
    this.write(this.local, this.preferenceKey, String(remember));
  }
  private owns(key: string): boolean {
    return key !== this.preferenceKey && (key === this.namespace || key.startsWith(`${this.namespace}-`));
  }
  private move(from: Storage | null, to: Storage | null): void {
    try {
      const keys = Array.from({ length: from?.length ?? 0 }, (_, i) => from?.key(i)).filter(
        (key): key is string => !!key && this.owns(key),
      );
      for (const key of keys) {
        const value = this.read(from, key);
        if (value !== null) {
          if (this.write(to, key, value)) this.memory.delete(key);
          else this.memory.set(key, value);
          this.remove(from, key);
        }
      }
    } catch {
      /* Blocked storage still permits an in-memory session. */
    }
  }
  private read(storage: Storage | null, key: string): string | null {
    try {
      return storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  private write(storage: Storage | null, key: string, value: string): boolean {
    try {
      if (!storage) return false;
      storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
  private remove(storage: Storage | null, key: string): void {
    try {
      storage?.removeItem(key);
    } catch {
      /* Storage may be blocked. */
    }
  }
}
