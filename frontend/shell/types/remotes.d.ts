// Module declarations for Module Federation remote imports.
// The hr-namechange remote is a plain Webpack 5 MFE that exposes ./NameChangeApp.

declare module "hrNamechange/NameChangeApp" {
  import { ComponentType } from "react";
  interface NameChangeAppProps {
    onComplete: (requestId: string) => void;
  }
  const NameChangeApp: ComponentType<NameChangeAppProps>;
  export default NameChangeApp;
}
