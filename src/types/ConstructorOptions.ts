import { Container } from "../container";

export interface ConstructorOptions {
  logger?: (container: Container) => any;
}
