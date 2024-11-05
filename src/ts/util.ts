export function mergeIn(obj1: any, obj2: any) {
    for (const attrname in obj2) {
        if (obj2.hasOwnProperty(attrname)) {
            if (!obj1.hasOwnProperty(attrname) && obj1[attrname] === undefined) {
                obj1[attrname] = obj2[attrname];
            }
        }
    }
    return obj1;
}

export function pathRecur(pth: string[], str: any) {
  if (pth.length > 0) {
    const nxt = pth.shift();
    const data = nxt !== undefined ? str[nxt] : undefined;
    if (data !== undefined) {
      return pathRecur(pth, data);
    }
    return undefined;
  }
  return str;
}

export function isObject(obj: any) {
  return obj === Object(obj);
}

export function addMetaData(inst: any, meta: any) {
  inst.getMetaData = function () {
    return meta;
  };
  return inst;
}

export function construct(constructor: any, args: any[]) {
  function F(this: any):void {
    constructor.apply(this, args);
  }
  F.prototype = constructor.prototype;
  if (args.length < 1) {
    F.prototype.toString = function () {
      return '[' + constructor.cname + '()]';
    };
  } else {
    F.prototype.toString = function () {
      return '[' + constructor.cname + '(' + args + ')]';
    };
  }
  return new F();
}
