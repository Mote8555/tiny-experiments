import { execSync } from 'child_process'
import { cpSync, rmSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const tmp = '/tmp/opencode/tiny-experiments-build'

if (existsSync(tmp)) rmSync(tmp, { recursive: true })
mkdirSync(tmp, { recursive: true })

cpSync(join(root, 'src'), join(tmp, 'src'), { recursive: true })
if (existsSync(join(root, '.env'))) cpSync(join(root, '.env'), join(tmp, '.env'))
cpSync(join(root, 'vite.config.js'), join(tmp, 'vite.config.js'))
cpSync(join(root, 'package.json'), join(tmp, 'package.json'))
cpSync(join(root, 'index.html'), join(tmp, 'index.html'))
cpSync(join(root, 'node_modules'), join(tmp, 'node_modules'), { recursive: true, dereference: true })

execSync('./node_modules/.bin/vite build', { cwd: tmp, stdio: 'inherit' })

const dist = join(root, 'dist')
if (existsSync(dist)) rmSync(dist, { recursive: true })
cpSync(join(tmp, 'dist'), dist, { recursive: true })

console.log('Build complete. Output in dist/')
