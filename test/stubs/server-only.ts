/**
 * Test stub for the `server-only` package.
 *
 * In an app build the guard is enforced by the bundler (importing a server module
 * from a client component fails). Under Vitest everything is Node, and the real
 * package throws unconditionally, so tests alias it to this empty module. The
 * guard itself is verified by `npm run build`, not by unit tests.
 */
export {};
