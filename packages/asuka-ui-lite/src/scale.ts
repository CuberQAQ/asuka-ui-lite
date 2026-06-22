import { px } from "@zos/utils";

let pxFunc: (v: Scale) => number = px as any;
export const setPxFunc = (func: (v: Scale) => number) => {
  pxFunc = func;
};


export type Scale = number | `${number}px` | string;
export function scale(v: Scale): number {
  return pxFunc(v);
}