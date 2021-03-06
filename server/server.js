"use strict";

var snmp = require("net-snmp");
var express = require("express"),
  http = require("http");
var app = express();
var server = http.createServer(app);
var io = require("socket.io").listen(server);

server.listen(4100, () => console.log("Servidor rodando na porta 4100"));

io.on("connection", socket => {
  socket.on("send-device-options", deviceInfo => {
    var options = {
      port: deviceInfo.port ? deviceInfo.port : 161,
      retries: deviceInfo.retransmissions ? deviceInfo.retransmissions : 1,
      timeout: deviceInfo.timeout ? deviceInfo.timeout : 1000,
      transport: "udp4",
      trapPort: 162,
      version: deviceInfo.version ? deviceInfo.version : snmp.Version2c,
      idBitsSize: 16
    };

    var session = snmp.createSession(
      deviceInfo.ipAddress,
      deviceInfo.community,
      options
    );

    var infos = [
      {
        name: "Contato",
        oid: "1.3.6.1.2.1.1.4.0"
      },
      {
        name: "Nome",
        oid: "1.3.6.1.2.1.1.5.0"
      },
      {
        name: "Localização",
        oid: "1.3.6.1.2.1.1.6.0"
      },
      {
        name: "Descrição",
        oid: "1.3.6.1.2.1.1.1.0"
      },
    ];
    var infoOids = [];

    session.get(infos.map(info => info.oid), (error, varbinds) => {
      if (error) {
        var errorSplit = error.message.split(": ");
        if (errorSplit[0] == "Request timed out") {
          io.emit("get-device-summary", "Dispositivo não encontrado.");
        }
      } else {
        for (var i = 0; i < varbinds.length; i++) {
          if (snmp.isVarbindError(varbinds[i])) {
            console.error(snmp.varbindError(varbinds[i]));
          } else {
            var oidValue =
              varbinds[i].type === 4
                ? varbinds[i].value.toString("binary")
                : varbinds[i].value;
            oidValue =
              varbinds[i].type === 67
                ? (oidValue / 100)
                    .toFixed()
                    .toString()
                    .concat(" segundos")
                : oidValue;

            infoOids.push(infos[i].name.concat(": ").concat(oidValue));
          }
        }

        io.emit("get-device-summary", infoOids);
        hehe(deviceInfo);
      }

      // If done, close the session
      session.close();
    });

    session.trap(snmp.TrapType.LinkDown, function(error) {
      if (error) console.error(error);
    });
  });

  socket.on("send-interface-options", something => {
    var options = {
      port: something.port ? something.port : 161,
      retries: something.retransmissions ? something.retransmissions : 1,
      timeout: something.timeout ? something.timeout : 1000,
      transport: "udp4",
      trapPort: 162,
      version: something.version ? something.version : snmp.Version2c,
      idBitsSize: 16
    };

    var session = snmp.createSession(
      something.ipAddress,
      something.community,
      options
    );
    var infoOids = [
      {
        name: "Velocidade (Bits por segundo)",
        oid: "1.3.6.1.2.1.2.2.1.5." + something.interfaceNumber
      },
      {
        name: "Status do administrador",
        oid: "1.3.6.1.2.1.2.2.1.7." + something.interfaceNumber
      },
      {
        name: "Descrição",
        oid: "1.3.6.1.2.1.2.2.1.2." + something.interfaceNumber
      },
      {
        name: "Endereço MAC",
        oid: "1.3.6.1.2.1.2.2.1.6." + something.interfaceNumber
      },
      {
        name: "Operacional",
        oid: "1.3.6.1.2.1.2.2.1.8." + something.interfaceNumber
      },
      {
        name: "Tipo",
        oid: "1.3.6.1.2.1.2.2.1.3." + something.interfaceNumber
      },
      {
        name: "Indice",
        oid: "1.3.6.1.2.1.2.2.1.2." + something.interfaceNumber
      }
    ];

    session.get(infoOids.map(i => i.oid), (error, varbinds) => {
      if (error) {
        console.error(error);
      } else {
        var asd = [];
        for (var i = 0; i < varbinds.length; i++) {
          if (snmp.isVarbindError(varbinds[i])) {
            console.error(snmp.varbindError(varbinds[i]));
          } else {
            var valueOid = varbinds[i].value;

            if (infoOids[i].name === "Endereço MAC") {
              if (valueOid.toString()) {
                valueOid = valueOid.toString("hex").toUpperCase();
                if (
                  !(
                    valueOid.includes(".") ||
                    valueOid.includes(":") ||
                    valueOid.includes("-")
                  )
                ) {
                  for (var x = 2; x < valueOid.length; x = x + 2) {
                    valueOid = [
                      valueOid.slice(0, x),
                      "-",
                      valueOid.slice(x)
                    ].join("");
                    x++;
                  }
                }
              } else {
                valueOid = "-";
              }
            } else {
              if (Buffer.isBuffer(valueOid)) {
                valueOid = valueOid.toString().slice(0, valueOid.length - 1);
              }
            }

            asd.push(infoOids[i].name.concat(": ").concat(valueOid));
          }
        }

        io.emit("get-interface-summary", asd);
      }

      session.close();
    });

    session.trap(snmp.TrapType.LinkDown, function(error) {
      if (error) console.error(error);
    });
  });

  socket.on("send-realtime-options", something => {
    var options = {
      port: something.port ? something.port : 161,
      retries: something.retransmissions ? something.retransmissions : 1,
      timeout: something.timeout ? something.timeout : 1000,
      transport: "udp4",
      trapPort: 162,
      version: something.version ? something.version : snmp.Version2c,
      idBitsSize: 16
    };

    var session = snmp.createSession(
      something.ipAddress,
      something.community,
      options
    );

    var infos = [
      {
        name: "Tempo ligado",
        oid: "1.3.6.1.2.1.1.3.0"
      }
    ];

    if (something.community === "abcBolinhas" && something.ipAddress === '172.16.0.201') {
      infos.push(
        {
          name: "Temperatura (C°)",
          oid: "1.3.6.1.4.1.25506.2.6.1.1.1.1.12.8"
        },
        {
          name: "Uso da CPU (%)",
          oid: "1.3.6.1.4.1.25506.2.6.1.1.1.1.6.8"
        },
        {
          name: "Memoria (%)",
          oid: "1.3.6.1.4.1.25506.2.6.1.1.1.1.8.8"
        }
      );
    };

    var infoOids = [];

    session.get(infos.map(info => info.oid), (error, varbinds) => {
      if (error) {
        var errorSplit = error.message.split(": ");
        if (errorSplit[0] == "Request timed out") {
          Console.log('Algum erro');
        }
      } else {
        for (var i = 0; i < varbinds.length; i++) {
          if (snmp.isVarbindError(varbinds[i])) {
            console.error(snmp.varbindError(varbinds[i]));
          } else {
            var oidValue =
              varbinds[i].type === 4
                ? varbinds[i].value.toString("binary")
                : varbinds[i].value;
            oidValue =
              varbinds[i].type === 67
                ? (oidValue / 100)
                    .toFixed()
                    .toString()
                    .concat(" segundos")
                : oidValue;

            infoOids.push(infos[i].name.concat(": ").concat(oidValue));
          }
        }

        io.emit("get-realtime-options", infoOids);
      }

      // If done, close the session
      session.close();
    });

    session.trap(snmp.TrapType.LinkDown, function(error) {
      if (error) console.error(error);
    });
  });

  socket.on("send-interface-index", something => {
    var options = {
      port: something.port ? something.port : 161,
      retries: something.retransmissions ? something.retransmissions : 1,
      timeout: something.timeout ? something.timeout : 1000,
      transport: "udp4",
      trapPort: 162,
      version: something.version ? something.version : snmp.Version2c,
      idBitsSize: 16
    };

    var session = snmp.createSession(
      something.ipAddress,
      something.community,
      options
    );
    var infoOids = [
      // Porcentagem de Erro/Descartes de entrada
      {
        name: "ifInErrors",
        oid: "1.3.6.1.2.1.2.2.1.14." + something.interfaceNumber
      },
      {
        name: "ifInDiscards",
        oid: "1.3.6.1.2.1.2.2.1.13." + something.interfaceNumber
      },
      {
        name: "ifInUcastPkts",
        oid: "1.3.6.1.2.1.2.2.1.11." + something.interfaceNumber
      },
      {
        name: "ifInNUcastPkts",
        oid: "1.3.6.1.2.1.2.2.1.12." + something.interfaceNumber
      },
      // Porcentagem de Erro/Descartes de saida
      {
        name: "ifOutErrors",
        oid: "1.3.6.1.2.1.2.2.1.20." + something.interfaceNumber
      },
      {
        name: "ifOutDiscards",
        oid: "1.3.6.1.2.1.2.2.1.19." + something.interfaceNumber
      },
      {
        name: "ifOutUcastPkts",
        oid: "1.3.6.1.2.1.2.2.1.17." + something.interfaceNumber
      },
      {
        name: "ifOutNUcastPkts",
        oid: "1.3.6.1.2.1.2.2.1.18." + something.interfaceNumber
      },
      // Taxa de utilização
      {
        name: "ifInOctets",
        oid: "1.3.6.1.2.1.2.2.1.10." + something.interfaceNumber
      },
      {
        name: "ifOutOctets",
        oid: "1.3.6.1.2.1.2.2.1.16." + something.interfaceNumber
      },
      {
        name: "ifSpeed",
        oid: "1.3.6.1.2.1.2.2.1.5." + something.interfaceNumber
      }
    ];

    session.get(infoOids.map(i => i.oid), (error, varbinds) => {
      if (error) {
        console.error(error);
      } else {
        var asd = [];
        for (var i = 0; i < varbinds.length; i++) {
          if (snmp.isVarbindError(varbinds[i])) {
            console.error(snmp.varbindError(varbinds[i]));
          } else {
            asd.push({ oid: varbinds[i].oid, value: varbinds[i].value });
          }
        }

        var porcErrorIn = (
          asd.find(a => a.oid === infoOids[0].oid).value /
          (asd.find(a => a.oid === infoOids[2].oid).value +
            asd.find(a => a.oid === infoOids[3].oid).value)
        ).toFixed(2);
        var porcErrorOut = (
          asd.find(a => a.oid === infoOids[4].oid).value /
          (asd.find(a => a.oid === infoOids[6].oid).value +
            asd.find(a => a.oid === infoOids[7].oid).value)
        ).toFixed(2);

        var porcDiscardIn = (
          asd.find(a => a.oid === infoOids[1].oid).value /
          (asd.find(a => a.oid === infoOids[2].oid).value +
            asd.find(a => a.oid === infoOids[3].oid).value)
        ).toFixed(2);
        var porcDiscardOut = (
          asd.find(a => a.oid === infoOids[5].oid).value /
          (asd.find(a => a.oid === infoOids[6].oid).value +
            asd.find(a => a.oid === infoOids[7].oid).value)
        ).toFixed(2);

        var inOctets = (asd.find(a => a.oid === infoOids[8].oid).value) / 2;
        var outOctets = (asd.find(a => a.oid === infoOids[9].oid).value) / 2;
        var date = new Date();

        var totalBytes =
          (inOctets - something.inOctets) + (outOctets - something.outOctets);
        var secondsBetweenDates = Math.abs(
          (date.getTime() - new Date(something.date).getTime()) / 1000
        );
        var totalBytesBySeconds = totalBytes / secondsBetweenDates;
        var totalBitsBySeconds = totalBytesBySeconds * 8;
        var usageRate =
          secondsBetweenDates >= 0.5
            ? (
                totalBitsBySeconds /
                asd.find(a => a.oid === infoOids[10].oid).value
              ).toFixed(4)
            : 0;

        usageRate = Number.isNaN(parseFloat(usageRate)) ? 0.0 : usageRate;

        porcErrorIn = Number.isNaN(parseFloat(porcErrorIn)) ? 0.0 : porcErrorIn;
        porcErrorOut = Number.isNaN(parseFloat(porcErrorOut))
          ? 0.0
          : porcErrorOut;
        porcDiscardOut = Number.isNaN(parseFloat(porcDiscardOut))
          ? 0.0
          : porcDiscardOut;
        porcDiscardIn = Number.isNaN(parseFloat(porcDiscardIn))
          ? 0.0
          : porcDiscardIn;

        usageRate = usageRate * 100;
        var options = {
          porcErrorIn,
          porcErrorOut,
          porcDiscardOut,
          porcDiscardIn,
          date,
          inOctets,
          outOctets,
          usageRate
        };

        io.emit("get-interface-usage-rate", options);
      }

      session.close();
    });

    session.trap(snmp.TrapType.LinkDown, function(error) {
      if (error) console.error(error);
    });
  });
});

function hehe(deviceInfo) {
  var options = {
    port: deviceInfo.port ? deviceInfo.port : 161,
    retries: deviceInfo.retransmissions ? deviceInfo.retransmissions : 1,
    timeout: deviceInfo.timeout ? deviceInfo.timeout : 1000,
    transport: "udp4",
    trapPort: 162,
    version: deviceInfo.version ? deviceInfo.version : snmp.Version2c,
    idBitsSize: 16
  };

  var session = snmp.createSession(
    deviceInfo.ipAddress,
    deviceInfo.community,
    options
  );
  let qtd = ["1.3.6.1.2.1.2.1.0"];
  session.get(qtd, function(error, varbinds) {
    if (error) {
      console.log(error);
    } else {
      for (var i = 0; i < varbinds.length; i++)
        if (snmp.isVarbindError(varbinds[i])) {
          console.error(snmp.varbindError(varbinds[i]));
        } else {
          var interfaceNamesOids = [];
          for (var x = 1; x < varbinds[i].value; x++) {
            interfaceNamesOids.push("1.3.6.1.2.1.31.1.1.1.18." + x);
          }
          haha(interfaceNamesOids, deviceInfo);
        }
    }

    // If done, close the session
    session.close();
  });

  session.trap(snmp.TrapType.LinkDown, function(error) {
    if (error) console.error(error);
  });
}

function haha(oids, deviceInfo) {
  var options = {
    port: deviceInfo.port ? deviceInfo.port : 161,
    retries: deviceInfo.retransmissions ? deviceInfo.retransmissions : 1,
    timeout: deviceInfo.timeout ? deviceInfo.timeout : 1000,
    transport: "udp4",
    trapPort: 162,
    version: deviceInfo.version ? deviceInfo.version : snmp.Version2c,
    idBitsSize: 16
  };

  var session = snmp.createSession(
    deviceInfo.ipAddress,
    deviceInfo.community,
    options
  );
  session.get(oids, function(error, varbinds) {
    if (error) {
      var errorSplit = error.message.split(": ");
      if (errorSplit[0] == "NoSuchName") {
        oids.splice(oids.indexOf(errorSplit[1]), 1);
        haha(oids, deviceInfo);
      }
    } else {
      var arr = [];
      for (var i = 0; i < varbinds.length; i++) {
        if (snmp.isVarbindError(varbinds[i])) {
          console.error(snmp.varbindError(varbinds[i]));
        } else {
          arr.push({
            oid: varbinds[i].oid,
            name: varbinds[i].value.toString("binary")
          });
        }
      }
    }

    io.emit("get-interfaces", arr);
    // If done, close the session
  });

  session.trap(snmp.TrapType.LinkDown, function(error) {
    if (error) console.error(error);
  });
}
