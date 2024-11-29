import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { CustomDrawer } from "./CustomDrawer";

type DrawerContextType = {
  addDrawer: (key: string, component: React.ReactNode) => void;
  drawers: {
    key: string;
    component: React.ReactNode;
    open: boolean;
  }[];
  removeDrawer: (key: string) => void;
};

const DrawerContext = createContext<DrawerContextType>({
  drawers: [],
  addDrawer: () => {},
  removeDrawer: () => {},
});

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [components, setComponents] = useState<DrawerContextType["drawers"]>(
    []
  );

  return (
    <DrawerContext.Provider
      value={{
        addDrawer(key, component) {
          setComponents((components) => [
            ...components,
            { key, component, open: false },
          ]);
          requestAnimationFrame(() => {
            setComponents((components) =>
              components.map((c) => (c.key !== key ? c : { ...c, open: true }))
            );
          });
        },
        drawers: components,
        removeDrawer(key) {
          setComponents((components) =>
            components.map((c) => (c.key !== key ? c : { ...c, open: false }))
          );
          setTimeout(() => {
            setComponents((components) =>
              components.filter((c) => c.key !== key)
            );
          }, 500);
        },
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};

export const Drawers = () => {
  const { drawers, removeDrawer } = useDrawer();
  console.log(drawers);
  return (
    <>
      {drawers.map((drawer, i) => {
        return (
          <CustomDrawer
            key={drawer.key}
            open={drawer.open}
            // hideBackdrop={i > 0}
            size={i > 0 ? "sm" : "md"}
            setOpen={(v) => {
              removeDrawer(drawer.key);
            }}
          >
            {drawer?.component}
          </CustomDrawer>
        );
      })}
    </>
  );
};

export const useDrawer = () => {
  const context = useContext(DrawerContext);

  return context;
};
