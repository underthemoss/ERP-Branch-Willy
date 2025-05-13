import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const SIDEBAR_PARAM_KEYS = {
  contacts: [],
  contact: ["id"],
  projects: [],
  project: ["id"],
  resources: [],
  resource: ["id"],
} as const;

type SidebarParamKeys = typeof SIDEBAR_PARAM_KEYS;

export type SidebarOpts = {
  [K in keyof SidebarParamKeys]: { sidebarType: K } & Record<SidebarParamKeys[K][number], string>;
}[keyof SidebarParamKeys];

export type SidebarOptsFor<K extends SidebarOpts["sidebarType"]> = Extract<
  SidebarOpts,
  { sidebarType: K }
>;

export function useSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openSidebar = (opts: SidebarOpts) => {
    const { sidebarType, ...args } = opts;
    const params = new URLSearchParams(searchParams.toString());

    params.set("sidebar", sidebarType);

    for (const key of SIDEBAR_PARAM_KEYS[sidebarType]) {
      if (key in args) {
        params.set(key, args[key]);
      }
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const closeSidebar = () => {
    const params = new URLSearchParams(searchParams.toString());
    const sidebarType = params.get("sidebar");

    if (!sidebarType || !(sidebarType in SIDEBAR_PARAM_KEYS)) return;

    params.delete("sidebar");

    for (const key of SIDEBAR_PARAM_KEYS[sidebarType as keyof SidebarParamKeys]) {
      params.delete(key);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  function getSidebarState<K extends SidebarOpts["sidebarType"]>(
    expectedType?: K,
  ): SidebarOptsFor<K> | null {
    const sidebarType = searchParams.get("sidebar");

    if (!sidebarType || !(sidebarType in SIDEBAR_PARAM_KEYS)) return null;

    if (expectedType && sidebarType !== expectedType) return null;

    const typedSidebarType = sidebarType as K;

    const args = Object.fromEntries(
      SIDEBAR_PARAM_KEYS[typedSidebarType]
        .map((key) => [key, searchParams.get(key)])
        .filter(([, value]) => value !== null) as [string, string][],
    );

    const allKeysPresent = SIDEBAR_PARAM_KEYS[typedSidebarType].every((key) => key in args);
    if (!allKeysPresent) return null;

    return {
      sidebarType: typedSidebarType,
      ...args,
    } as SidebarOptsFor<K>;
  }

  return { openSidebar, closeSidebar, getSidebarState };
}
