// Dynamic Module Federation remote loader
//
// Loads a remote entry script at runtime, initializes the container, and
// returns the requested module. Works with Next.js App Router where the
// remote MFE isn't available at build time.

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  var __remotes__: Record<string, any>;
}

if (typeof globalThis.__remotes__ === "undefined") {
  globalThis.__remotes__ = {};
}

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = url;
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load remote: ${url}`));
    document.head.appendChild(script);
  });
}

async function initContainer(
  containerName: string,
  remoteUrl: string
): Promise<any> {
  if (globalThis.__remotes__[containerName]) {
    return globalThis.__remotes__[containerName];
  }

  await loadScript(remoteUrl);

  const container = (window as any)[containerName];
  if (!container) {
    throw new Error(`Container "${containerName}" not found on window after loading ${remoteUrl}`);
  }

  // Initialize sharing scope
  await container.init(
    (globalThis as any).__webpack_share_scopes__?.default ?? {}
  );

  globalThis.__remotes__[containerName] = container;
  return container;
}

/**
 * Load a module from a remote Module Federation container.
 *
 * @example
 * const mod = await loadRemoteModule("hrNamechange", "http://localhost:3001/remoteEntry.js", "./NameChangeApp");
 * const Component = mod.default;
 */
export async function loadRemoteModule(
  containerName: string,
  remoteUrl: string,
  moduleName: string
): Promise<any> {
  const container = await initContainer(containerName, remoteUrl);
  const factory = await container.get(moduleName);
  return factory();
}
