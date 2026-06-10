import transform from "parallel-transform";
import { PassThrough, Transform, Writable } from "stream";

export function map<X, Y>(mapper: (input: X) => Y): Transform {
  return new Transform({
    objectMode: true,
    transform: (data: X, _, done) => {
      done(null, mapper(data));
    },
  });
}

export function mapAsync<X, Y>(
  mapper: ((input: X) => Promise<Y>) | null,
  parallelism = 1,
): Transform {
  if (!mapper) {
    return passThrough();
  }
  return transform(parallelism, { objectMode: true }, (data, done) => {
    mapper(data)
      .then((value) => done(null, value))
      .catch((error) => done(error));
  });
}

export function flatMapArray<X, Y>(mapper: (input: X) => Y[]): Transform {
  return new Transform({
    objectMode: true,
    transform: function (data: X, _, done) {
      for (const item of mapper(data)) {
        this.push(item);
      }
      done();
    },
  });
}

export function passThrough(): PassThrough {
  return new PassThrough({ objectMode: true });
}

export function andFinally<X>(mapper: (input: X) => Promise<void>): Writable {
  return new Writable({
    objectMode: true,
    write: (data: X, _, done) => {
      mapper(data)
        .then(() => done())
        .catch((error) => done(error));
    },
  });
}
