type QueueItem<T> = {
  promise: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (err: Error) => void;
};

/**
 * Self emptying promise queue. Used for running multiple promises in sequence.
 * @returns Service for enqueuing promises
 */
export default function PromiseQueue() {
  const queue: QueueItem<any>[] = [];
  let isBusy = false;

  function enqueue<T>(promise: QueueItem<T>["promise"]): Promise<T> {
    return new Promise((resolve, reject) => {
      queue.push({
        promise,
        resolve,
        reject,
      });
      dequeue();
    });
  }

  function dequeue(): void {
    if (isBusy) {
      return;
    }
    const item = queue.shift();
    if (!item) {
      return;
    }
    isBusy = true;
    item
      .promise()
      .then((value) => item.resolve(value))
      .catch((err: Error) => item.reject(err))
      .finally(() => {
        isBusy = false;
        dequeue();
      });
  }

  return {
    enqueue,
  };
}
