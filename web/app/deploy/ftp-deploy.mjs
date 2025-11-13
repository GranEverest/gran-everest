import ftp from "basic-ftp";
import path from "node:path";

const host = process.env.FTP_HOST;
const user = process.env.FTP_USER;
const pass = process.env.FTP_PASS;
const remoteDir = process.env.FTP_DIR || "/public_html";

if (!host || !user || !pass) {
  console.error("Faltan FTP_HOST / FTP_USER / FTP_PASS");
  process.exit(1);
}

const client = new ftp.Client(0);
client.ftp.verbose = true;

try {
  await client.access({ host, user, password: pass, secure: false });
  await client.ensureDir(remoteDir);
  await client.clearWorkingDir();               // limpia destino
  await client.uploadFromDir(path.resolve("out"));
  // sube el .htaccess guardado en el repo
  await client.uploadFrom(path.resolve("deploy/htaccess"), ".htaccess");
  console.log("Deploy OK");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  client.close();
}
