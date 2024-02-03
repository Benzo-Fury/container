# Service Container README

## Overview

The Service Container is a comprehensive TypeScript/JavaScript module designed to manage and maintain services in a structured and efficient manner. It provides functionalities such as service registration, resolution, disposal, and automatic loading of services from a specified directory. The module is built to be versatile, handling both class-based and functional services, with support for lazy loading, custom initialization, and disposal.

## Features

- **Service Registration**: Dynamically register services with unique names.
- **Service Resolution**: Resolve and retrieve registered services as needed.
- **Service Disposal**: Dispose of services individually or collectively.
- **Automatic Service Loading**: Automatically load services from a specified directory.
- **Lazy Loading**: Option to lazily load services to optimize performance.
- **Custom Initializers and Disposers**: Execute custom logic during service initialization or disposal.
- **Logging and Error Handling**: Built-in logging capabilities and robust error handling.
- **Typed Services**: Specify what each of your services will resolve as.

## Installation

```bash
npm/bun/yarn install @neos/container
```

## Usage

### Importing Container

```ts
import { Container } from "@neos/container";
```

### Creating a Container Instance

```ts
const container = new Container(options);
```

### Registering Services

While the `register` method takes an array and registers each item... its not recommended to register to many things in a row. Instead use the auto-load feature.

```ts
await container.register([
  {
    name: "ServiceName",
    service: ServiceClass,
    options: {
      /* ... */
    },
  },
]);
```

### Resolving Services

```ts
await container.resolve("ServiceName").then((serviceInstance) => {
  // Use serviceInstance
});
```

### Disposing Services

```ts
await container.dispose("ServiceName");
```

### Auto-Loading Services

```ts
// index.ts
container.autoLoad("/path/to/services");

// someServiceFile.ts
export {
  name: "someName",
  service: someService,
  options: {
    logging: (container, options) => {
      console.log(`Loaded: ${options.name}`);
    },
  },
} as AutoLoadServiceOptions;
```

### Typing Services

```ts
// services.d.ts
import '@neos/container';

declare module "@neos/container" {
  interface ServiceMap {
    // Services here:
    ServiceName: ServiceType;
  }
}
```
