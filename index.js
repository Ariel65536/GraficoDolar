var fs = require('fs');
var http = require('http');
var https = require('https');
//const fetch = require('node-fetch');

let HistorialLocal = []

let HistorialLocalMapa = new Map();

try {
    HistorialLocal = JSON.parse(fs.readFileSync('HistorialLocal.json'))
    for (let i = 0; i < HistorialLocal.length; i++) {
        HistorialLocalMapa.set(HistorialLocal[i].Fecha, HistorialLocal[i]);
    }
} catch {
    HistorialLocal = [];
}

//console.log(HistorialLocal);

ejecutar()

async function ejecutar() {
    let Fecha = new Date(Date.now());
    Fecha.setDate(Fecha.getDate() - 1);

    for (let i = 0; i < 100; i++) {
        let FechaEnviable = completarConCeros(Fecha.getDate(),2) + "-" + completarConCeros(Fecha.getMonth() + 1, 2) + "-" + Fecha.getFullYear().toString().substring(2, 4);
        //console.log(FechaEnviable);
        if (HistorialLocalMapa.has(FechaEnviable)) {
            console.log(FechaEnviable + " ya guardado.");
        } else {
            let DatosEncontrados = await obtenerDatosFecha(FechaEnviable)
            guardarDatosDia(FechaEnviable, DatosEncontrados);
            console.log(FechaEnviable);
            console.log(DatosEncontrados);
            await esperar(3000);
            
        }

        Fecha.setDate(Fecha.getDate() - 1);
    }
}


function completarConCeros(Texto, Cantidad) {
    var Respuesta = new String(Texto);
    while (Respuesta.length < Cantidad) {
        Respuesta = "0" + Respuesta;
    }
    return Respuesta;
}

function guardarDatosDia(Fecha, DatosDia) {
    if (DatosDia == null) {
        DatosDia = { Compra: 0, Venta: 0, Encontrado: false };
    } else {
        DatosDia.Encontrado = true;
    }
    DatosDia.Fecha = Fecha;
    HistorialLocal.push(DatosDia);

    fs.writeFileSync('HistorialLocal.json', JSON.stringify(HistorialLocal));
    //console.log(HistorialLocal);
}


function esperar(Milisegundos) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(true), Milisegundos);
    });
}

function obtenerDatosFecha(FechaBuscada) {
    return new Promise((resolve, reject) => {

        const options = {
            hostname: 'www.cotizacion-dolar.com.ar',
            port: 443,
            path: '/dolar-blue-historico-2023.php',
            method: 'POST',
            headers: {
                'content-type': "application/x-www-form-urlencoded",
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
            }
        };

        //console.log("Request cotizacionDolar");

        const req = https.request(options, res2 => {
            console.log(`statusCode: ${res2.statusCode} \n`)


            var body = [];
            res2.on('data', function (chunk) {
                body.push(chunk);
            });
            res2.on('end', function () {
                try {
                    body = Buffer.concat(body).toString();
                    //console.log(body);
                    resolve(obtenerPrecio(body));

                } catch (e) {
                    console.log(e);
                }
            });
        })


        //req.write(JSON.stringify(DatosEnviar, null, '\t'));
        let TextoEnviar = "fecha=" + FechaBuscada;
        req.write(TextoEnviar);
        //console.log(TextoEnviar)
        req.on('error', error => {
            console.error(error)
            reject(error);
        })
        req.end()


    });
}

function obtenerPrecio(body) {
    let Respuesta = { Compra: 0, Venta: 0 };
    let Lineas = body.split("\n");

    for (let i = 0; i < Lineas.length; i++) {
        if (Lineas[i].indexOf("getElementById(\"inputDolar\")") != -1) {
            let PrecioCompra = Lineas[i].split("=valNum*")[1];
            Respuesta.Compra = parseFloat(PrecioCompra);
        }
        if (Lineas[i].indexOf("getElementById(\"inputDolarvender\")") != -1) {
            let PrecioVenta = Lineas[i].split("=valNum*")[1];
            Respuesta.Venta = parseFloat(PrecioVenta);
        }
    }
    if (Respuesta.Compra == 0 || Respuesta.Venta == 0) return null;
    return Respuesta;
}

