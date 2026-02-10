import { Prisma } from '@generated/prisma';

type Decimal = InstanceType<typeof Prisma.Decimal>;

type BuiltinObjects =
  | Date
  | RegExp
  | Error
  | Map<any, any>
  | Set<any>
  | WeakMap<any, any>
  | WeakSet<any>
  | Promise<any>
  | ArrayBuffer
  | DataView
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

export type DecimalToNumber<T> = T extends Decimal
  ? number // Convert Prisma.Decimal to number
  : T extends BuiltinObjects
  ? T // Leave built-in objects unchanged
  : T extends Array<infer U>
  ? Array<DecimalToNumber<U>> // Handle arrays
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DecimalToNumber<U>> // Handle readonly arrays
  : T extends object
  ? {
      // Handle plain objects only
      [K in keyof T]: DecimalToNumber<T[K]>;
    }
  : T; // Leave primitives unchanged
