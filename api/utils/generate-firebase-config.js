const fs = require('fs')
const path = require('path')

const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json')

const raw = fs.readFileSync(serviceAccountPath, 'utf8')
const base64 = Buffer.from(raw).toString('base64')

console.log(`FIREBASE_SERVICE_ACCOUNT_B64=${base64}`)
