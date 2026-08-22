import { hashPassword } from "../src/lib/session";

const password = process.argv[2];

if (!password) {
  console.error("Pemakaian: npm run auth:hash -- <password>");
  process.exit(1);
}

console.log(hashPassword(password));
