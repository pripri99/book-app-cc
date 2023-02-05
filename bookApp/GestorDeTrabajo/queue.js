class Queue {
  // Queue with FIFO logic
  constructor() {
    this.array = {};
    this.head = 0;
    this.tail = 0;
  }
  // add job at the tail of the queue and tail index increase by 1
  enqueue(job) {
    this.array[this.tail] = job;
    this.tail++;
  }
  // remove element at the front of the queue, empty corrresponding position, move head index by 1
  dequeue() {
    const item = this.array[this.head];
    delete this.array[this.head];
    this.head++;
    return item;
  }
  // see the current head
  peek() {
    return this.array[this.head];
  }
  // length of the quue
  get length() {
    return this.tail - this.head;
  }

  get isEmpty() {
    return this.length === 0;
  }
}

module.exports = { Queue };
