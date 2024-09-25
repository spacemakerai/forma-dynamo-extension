type QueueItem<T> = {
  promise: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (err: any) => unknown;
};

export default function PromiseQueue<T>() {
  const queue: QueueItem<T>[] = [];
  let isBusy = false;

  function enqueue(promise: QueueItem<T>["promise"]) {
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
    console.log("Items in queue:", queue.length);
    if (isBusy) {
      return;
    }
    const item = queue.shift();
    if (!item) {
      return;
    }
    try {
      isBusy = true;
      item
        .promise()
        .then((value) => {
          isBusy = false;
          item.resolve(value);
          dequeue();
        })
        .catch((err: Error) => {
          isBusy = false;
          item.reject(err);
          dequeue();
        });
    } catch (err) {
      isBusy = false;
      item.reject(err);
      dequeue();
    }
  }

  return {
    enqueue,
  };
}
