module.exports = {
  config: {
    kafka: {
      BROKERS: ["localhost:9092"],
      CLIENTID: "cliente-gdt",
    },
    newJob: {
      TOPIC: "newJob",
      GROUPID: "grupo-job",
    },
    completeJob: {
      TOPIC: "completedJob",
      GROUPID: "grupo-completed",
    },
    observer: {
      TOPIC: "logJob",
      GROUPID: "grupo-log",
    },
  },
}; // exports
