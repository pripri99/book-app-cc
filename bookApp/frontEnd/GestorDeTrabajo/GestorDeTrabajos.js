const { Kafka } = require("kafkajs");

const { Queue } = require("./queue.js");
const { Observer } = require("../Observer/observer");
const configuracion = require("./configuracion");

class GestorDeTrabajos {
  // receive jobs from frontend
  // add job to queue
  // send job from queue to relevant topic
  // receive completed jobs
  // send completed jobs result
  // update observer
  constructor() {
    console.log(" GestorDeTrabajos.constructor() ======== ");
    return new Promise(async (resolver, rechazar) => {
      this.clienteKafka = new Kafka({
        brokers: configuracion.config.kafka.BROKERS,
        clientId: configuracion.config.kafka.CLIENTID,
      });
      // create queues
      this.newJobQueue = new Queue();
      this.completedJobQueue = new Queue();

      this.observer = await new Observer();

      this.productor = this.clienteKafka.producer({
        allowAutoTopicCreation: true,
      });
      this.administrador = this.clienteKafka.admin();
      this.consumidorParaWorker = this.clienteKafka.consumer({
        groupId: configuracion.config.completeJob.GROUPID,
      });
      this.consumidorParaFE = this.clienteKafka.consumer({
        groupId: configuracion.config.newJob.GROUPID,
      });

      await this.productor.connect();
      await this.administrador.connect();
      await this.consumidorParaWorker.connect();
      await this.consumidorParaFE.connect();

      await this.crearTemaSiNoExiste(configuracion.config.newJob.TOPIC);
      await this.crearTemaSiNoExiste(configuracion.config.completeJob.TOPIC);

      /*this.consumidorParaFE.subscribe({
        topics: [configuracion.config.newJob.TOPIC],
        fromBeginning: true,
      });*/
      var temaJSON = {
        topic: configuracion.config.completeJob.TOPIC,
        fromBeginning: false,
      };
      console.log("subscripte to compleJob topic");
      this.consumidorParaWorker.subscribe(temaJSON);

      console.log("done creating gdt");
      resolver(this);
    }); // new Promise
  }

  async destructor() {
    await this.administrador.disconnect();
    await this.productor.disconnect();
    await this.consumidorParaWorker.disconnect();
    await this.consumidorParaFE.disconnect();
  } // ()

  async crearTemaSiNoExiste(tema) {
    var temas = await this.administrador.listTopics();

    console.log("******************************");
    console.log("temas= ", temas);
    console.log("******************************");

    if (temas.includes(tema)) {
      return;
    }

    await this.administrador.createTopics({
      topics: [{ topic: tema }],
    });
  } // ()

  async nuevoTrabajo(nombreTrabajo, parametros) {
    // get job
    // send it to destinator
    // ask for job
    console.log("in nuevo trabajo");
    var idTrabajo = getRandomID();
    console.log("GestorDeTrabajos.producirTrabajo(): empiezo ");
    try {
      const tema = configuracion.config.newJob.TOPIC;
      await this.productor.connect();

      console.log(" ===================================== ");
      console.log(" añandiendo trabajo: ", idTrabajo);
      console.log(" ===================================== ");

      var trabajoJson = {
        idTrabajo: idTrabajo,
        nombreTrabajo: nombreTrabajo,
        parametros: parametros,
      };
      await this.productor.send({
        topic: tema,
        messages: [{ key: idTrabajo, value: JSON.stringify(trabajoJson) }],
      });

      console.log(" mensaje enviado !! ");

      this.consumidorParaWorker.run({
        eachMessage: async ({ topic, partition, message }) => {
          console.log({
            value: message.value.toString(),
          });
        },
      });

      //response = await this.pedirTrabajo(configuracion.config.completeJob.TOPIC);
      return { result: "OK", idTrabajo: idTrabajo };
    } catch (err) {
      console.log("###### error gdt ###### " + err);
      return { result: "NOK", idTrabajo: idTrabajo };
    }
  }
  //public
  async getJobResponse() {
    try {
      this.consumidorParaWorker.run({
        eachMessage: async ({ topic, partition, message }) => {
          console.log({
            value: message.value.toString(),
          });
        },
      });

      //response = await this.pedirTrabajo(configuracion.config.completeJob.TOPIC);
      return { result: "OK", idTrabajo: idTrabajo };
    } catch (err) {
      console.log("###### error getJobResponse ###### " + err);
      return { result: "NOK", idTrabajo: idTrabajo };
    }
  }

  dummyFunction() {
    console.log("dummy");
  }
}

function getRandomID() {
  let fecha = (Date.now() % 123456789).toString();
  let sufijo = Math.floor(Math.random() * 900000) + 100000;
  return fecha + "_" + sufijo;
}

module.exports = { GestorDeTrabajos, getRandomID };
