"use strict";

const Express = require("express");
const path = require("path");
const hogan = require("hogan-express");
const cookieParser = require("cookie-parser");
const { Kafka, getRandomID } = require("kafkajs");
const { GestorDeTrabajos } = require("../GestorDeTrabajo/GestorDeTrabajos.js");
const configuracion = require("./configuracion");
const assert = require("assert");

const Permissions = require("./lib/permissions");
const KeyCloakService = require("./lib/keyCloakService");
const AdminClient = require("./lib/adminClient");

const clienteKafka = new Kafka({
  brokers: configuracion.kafka.BROKERS,
  clientId: configuracion.kafka.CLIENTID,
});

var gdt = new GestorDeTrabajos();
assert(gdt);

console.log(gdt);

/**
 * URL patterns for permissions. URL patterns documentation https://github.com/snd/url-pattern.
 */
const PERMISSIONS = new Permissions([]).notProtect(
  "/favicon.ico", // just to not log requests
  "/login(*)",
  "/sendJob(*)",
  "/accessDenied",
  "/permissions",
  "/checkPermission"
);
///["/send(*)", "get", "res:send", "scopes:view"],
let app = Express();

// hogan-express configuration to render html
app.set("view engine", "html");
app.engine("html", hogan);

let keyCloak = new KeyCloakService(PERMISSIONS);

let adminClient = new AdminClient({
  realm: "CC_REALM",
  serverUrl: "http://localhost:8080",
  resource: "CC_CLIENT",
  adminLogin: "admin",
  adminPassword: "admin",
});

configureMiddleware();
configureRoutes();

const server = app.listen(3000, function () {
  const port = server.address().port;
  console.log("address is %s", server.address());
  console.log("App listening at port %s", port);
});

function configureMiddleware() {
  app.use(Express.static(path.join(__dirname, "static")));

  // for a Keycloak token
  app.use(cookieParser());

  // protection middleware is configured for all links
  const logoutUrl = "/logout";
  app.use(keyCloak.middleware(logoutUrl));
}

function configureRoutes() {
  let router = Express.Router();
  app.use("/", router);

  applicationRoutes();

  app.get("*", (req, res) =>
    res.sendFile(path.join(__dirname, "/static/index.html"))
  );
}

// this routes are used by this application
function applicationRoutes() {
  app.get("/login", login);

  app.get("/sendJob", sendJob);
  AdminClient;
  //get all permissions
  app.get("/permissions", (req, res) => {
    keyCloak
      .getAllPermissions(req)
      .then((json) => res.json(json))
      .catch((error) => res.end("error " + error));
  });

  // check a specified permission
  app.get("/checkPermission", (req, res) => {
    keyCloak
      .checkPermission(req, "res:customer", "scopes:create")
      .then(() => res.end("permission granted"))
      .catch((error) => res.end("error " + error));
  });
}

function login(req, res) {
  keyCloak
    .loginUser(req.query.login, req.query.password, req, res)
    .then((grant) => {
      // console.log(grant.__raw);
      res.render("loginSuccess", {
        userLogin: req.query.login,
      });
    })
    .catch((error) => {
      // TODO put login failed code here (we can return 401 code)
      console.error(error);
      res.end("Login error: " + error);
    });
}

async function create_tema(tema) {
  const administrador = clienteKafka.admin();
  console.log("wait for admin");
  await administrador.connect();

  console.log("======================= ALL TEMAS ======================");

  var temas = await administrador.listTopics();

  if (temas.includes(tema)) {
    console.log("tema already exist");
    console.log(tema);
    return;
  }

  console.log("create topic");
  await administrador.createTopics({
    topics: [{ topic: tema }],
  });

  console.log(temas);

  await administrador.disconnect();
}

async function sendJob(req, res) {
  const productor = clienteKafka.producer();

  try {
    const tema = configuracion.kafka.TOPIC;
    await create_tema(tema);
    console.log("wait for producer");
    await productor.connect();
    var idTrabajo = getRandomJobID();
    console.log(" ===================================== ");
    console.log(" añandiendo trabajo: ", idTrabajo);
    console.log(" ===================================== ");

    var trabajoJson = {
      idTrabajo: idTrabajo,
      nombreTrabajo: "my new job",
      parametros: "test test",
    };
    await productor.send({
      topic: tema,
      messages: [{ key: idTrabajo, value: JSON.stringify(trabajoJson) }],
    });

    // getting an error with the gestor the trabajo
    //const answer = await gdt.nuevoTrabajo();

    //const answer = await
    gdt.getJobResponse();

    res.render("sendSuccess", {
      resDetail: answer.result,
      reqDetail: answer.idTrabajo,
    });

    console.log(" mensaje enviado app.js !! ");

    await productor.disconnect();
  } catch (err) {
    console.log("###### error node ###### " + err);
  }
}

function getRandomJobID() {
  let fecha = (Date.now() % 123456789).toString();
  let sufijo = Math.floor(Math.random() * 900000) + 100000;
  return fecha + "_" + sufijo;
}

function renderAdminClient(res, result) {
  res.render("adminClient", {
    result: JSON.stringify(result, null, 4),
  });
}

function showUrl(req, res) {
  res.end(
    '<a href="javascript: window.history.back()">back</a> Access acquired to ' +
      req.originalUrl
  );
}
