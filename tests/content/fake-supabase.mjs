// In-memory stand-in for the supabase-js client, covering just the query-builder
// calls the content code makes. Rows live in plain arrays the tests can inspect.
import { randomUUID } from "node:crypto";

const DEFAULTS = {
  content_items: () => ({
    position: 0,
    channels: ["instagram"],
    caption: "",
    caption_facebook: "",
    first_comment: "",
    media: [],
    details: {},
    blog_post_id: null,
    media_approved: false,
    caption_approved: false,
    status: "pending",
    publish_state: {},
    attempts: 0,
    last_error: null,
    locked_until: null,
    published_at: null,
  }),
  content_campaigns: () => ({ keyword: null, notes: [], author: null }),
  content_uploads: () => ({ status: "new", note: null }),
  content_replies: () => ({ status: "sent", error: null }),
  blog_posts: () => ({ status: "draft", content_json: {}, published_at: null }),
};

const PRIMARY_KEY = {
  content_integrations: ["provider"],
  content_settings: ["key"],
  content_replies: ["platform", "comment_id"],
};

const clone = (v) => (v == null ? v : structuredClone(v));

export function createFakeSupabase(seed = {}) {
  const tables = structuredClone(seed);
  const storage = {}; // "bucket/path" -> Buffer
  const table = (name) => (tables[name] ??= []);
  const keyOf = (name) => PRIMARY_KEY[name] ?? ["id"];
  const sameKey = (name, a, b) => keyOf(name).every((k) => a[k] === b[k]);

  class Query {
    constructor(name) {
      this.name = name;
      this.filters = [];
      this.op = "select";
      this.payload = null;
      this.mode = "many";
      this.sort = null;
      this.max = null;
      this.head = false;
      this.conflict = null;
    }
    select(_columns, options) {
      if (this.op === "select") this.head = Boolean(options?.head);
      return this;
    }
    insert(rows) {
      this.op = "insert";
      this.payload = [].concat(rows);
      return this;
    }
    update(patch) {
      this.op = "update";
      this.payload = patch;
      return this;
    }
    upsert(rows, options) {
      this.op = "upsert";
      this.payload = [].concat(rows);
      this.conflict = options?.onConflict?.split(",");
      return this;
    }
    delete() {
      this.op = "delete";
      return this;
    }
    eq(c, v) {
      this.filters.push((r) => r[c] === v);
      return this;
    }
    in(c, values) {
      this.filters.push((r) => values.includes(r[c]));
      return this;
    }
    lt(c, v) {
      this.filters.push((r) => r[c] != null && r[c] < v);
      return this;
    }
    lte(c, v) {
      this.filters.push((r) => r[c] != null && r[c] <= v);
      return this;
    }
    gte(c, v) {
      this.filters.push((r) => r[c] != null && r[c] >= v);
      return this;
    }
    // PostgREST "a.is.null,a.lt.2026-…" (only what the publisher uses).
    or(expression) {
      const tests = expression.split(",").map((part) => {
        const [column, op, ...rest] = part.split(".");
        const value = rest.join(".");
        if (op === "is") return (r) => r[column] == null;
        if (op === "lt") return (r) => r[column] != null && r[column] < value;
        throw new Error(`fake supabase: unsupported or() operator ${op}`);
      });
      this.filters.push((r) => tests.some((t) => t(r)));
      return this;
    }
    order(column, options) {
      this.sort = [column, options?.ascending !== false];
      return this;
    }
    limit(n) {
      this.max = n;
      return this;
    }
    maybeSingle() {
      this.mode = "maybe";
      return this;
    }
    single() {
      this.mode = "one";
      return this;
    }
    then(resolve, reject) {
      try {
        resolve(this.run());
      } catch (error) {
        reject(error);
      }
    }
    matches() {
      return table(this.name).filter((r) => this.filters.every((f) => f(r)));
    }
    shape(rows) {
      if (this.mode === "many") return { data: clone(rows), error: null };
      if (rows.length > 1 || (this.mode === "one" && rows.length === 0)) {
        return { data: null, error: { code: "PGRST116", message: "expected one row" } };
      }
      return { data: clone(rows[0] ?? null), error: null };
    }
    run() {
      const rows = table(this.name);
      const now = new Date().toISOString();
      const withDefaults = (row) => ({
        ...(keyOf(this.name)[0] === "id" ? { id: randomUUID() } : {}),
        created_at: now,
        updated_at: now,
        ...(DEFAULTS[this.name]?.() ?? {}),
        ...clone(row),
      });

      if (this.op === "select") {
        let found = this.matches();
        if (this.sort) {
          const [c, asc] = this.sort;
          found = [...found].sort(
            (a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc ? 1 : -1),
          );
        }
        if (this.max != null) found = found.slice(0, this.max);
        if (this.head) return { data: null, count: found.length, error: null };
        return this.shape(found);
      }
      if (this.op === "insert") {
        const added = [];
        for (const row of this.payload) {
          const full = withDefaults(row);
          if (rows.some((r) => sameKey(this.name, r, full))) {
            return { data: null, error: { code: "23505", message: "duplicate key" } };
          }
          rows.push(full);
          added.push(full);
        }
        return this.shape(added);
      }
      if (this.op === "update") {
        const found = this.matches();
        for (const r of found) Object.assign(r, clone(this.payload), { updated_at: now });
        return this.shape(found);
      }
      if (this.op === "upsert") {
        const keys = this.conflict ?? keyOf(this.name);
        const touched = [];
        for (const row of this.payload) {
          const existing = rows.find((r) => keys.every((k) => r[k] === row[k]));
          if (existing) Object.assign(existing, clone(row), { updated_at: now });
          else rows.push(withDefaults(row));
          touched.push(existing ?? rows.at(-1));
        }
        return this.shape(touched);
      }
      if (this.op === "delete") {
        const found = this.matches();
        tables[this.name] = rows.filter((r) => !found.includes(r));
        return this.shape(found);
      }
      throw new Error(`fake supabase: unsupported op ${this.op}`);
    }
  }

  const client = {
    from: (name) => new Query(name),
    rpc: async () => ({ data: null, error: null }),
    storage: {
      from: (bucket) => ({
        upload: async (path, body) => {
          storage[`${bucket}/${path}`] = Buffer.from(body);
          return { data: { path }, error: null };
        },
        download: async (path) => {
          const buf = storage[`${bucket}/${path}`];
          return buf
            ? { data: new Blob([buf]), error: null }
            : { data: null, error: { message: "not found" } };
        },
        remove: async (paths) => {
          for (const p of paths) delete storage[`${bucket}/${p}`];
          return { data: paths, error: null };
        },
        getPublicUrl: (path) => ({
          data: {
            publicUrl: `https://fake.supabase.co/storage/v1/object/public/${bucket}/${path}`,
          },
        }),
      }),
    },
  };

  return { client, tables, storage, table };
}
