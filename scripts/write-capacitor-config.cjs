const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const configPath = path.join(rootDir, 'capacitor.config.json')

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return {}

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return env

      const separatorIndex = trimmed.indexOf('=')
      if (separatorIndex === -1) return env

      const key = trimmed.slice(0, separatorIndex).trim()
      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '')

      env[key] = value
      return env
    }, {})
}

const fileEnv = {
  ...parseEnvFile(path.join(rootDir, '.env.android')),
  ...parseEnvFile(path.join(rootDir, '.env.android.local'))
}

const androidServerUrl = (process.env.VITE_ANDROID_SERVER_URL || fileEnv.VITE_ANDROID_SERVER_URL || '').trim()

const config = {
  appId: 'com.findrill.page',
  appName: 'Findrill',
  webDir: 'dist',
  plugins: {
    CapacitorCookies: {
      enabled: true
    }
  },
  server: {
    androidScheme: 'http',
    cleartext: true
  }
}

if (androidServerUrl) {
  const url = new URL(androidServerUrl)
  config.server.url = url.toString().replace(/\/$/, '')
}

fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)
console.log(`Wrote ${path.relative(rootDir, configPath)}`)
