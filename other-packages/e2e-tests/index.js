const execa = require('execa')
const path = require('path')
const fs = require('fs')
const waitOn = require('wait-on')
const kill = require('kill-port')

const paths = {
  doczCore: '../../core/docz-core',
  docz: '../../core/docz',
  doczUtils: '../../core/docz-utils',
  rehypeDocz: '../../core/rehype-docz',
  remarkDocz: '../../core/remark-docz',
}

const rootPath = path.join(__dirname, '../../')
const e2eTestsPath = './'
const runCommand = (
  command,
  cwd = rootPath,
  stdio = 'inherit',
  detached = false
) => {
  const [binary, ...rest] = command.split(' ')
  return execa(binary, rest, { cwd, stdio, detached })
}

const tmpPath = path.join(rootPath, 'tmp')

const examples = {
  // basic: {
  //   path: path.join(rootPath, 'examples/basic'),
  //   tmp: path.join(tmpPath, 'examples/basic'),
  // },
  gatsby: {
    path: path.join(rootPath, 'examples/gatsby'),
    tmp: path.join(tmpPath, 'examples/gatsby'),
  },
}

const setupTestProjects = async () => {
  for (let exampleName in examples) {
    const example = examples[exampleName]
    await runCommand(`cp -r ${example.path} ${path.join(example.tmp, '..')}`)
    await runCommand(`rm -rf node_modules`, example.tmp)
    await Promise.all([
      runCommand(`yarn install`, example.tmp),
      kill(3000, 'tcp'),
    ])
    runCommand(`yarn dev`, example.tmp)
    await waitOn({ resources: ['http://localhost:3000'] })
    console.log('Ready. Starting e2e tests')
    process.exit(1) //runCommand(`yarn install`, example.tmp)
  }
}

const dev = async () => {
  await runCommand('yarn packages:build')
  runCommand('yarn packages:dev', rootPath, 'ignore')
  runCommand('yarn lerna run testcafe:dev --scope e2e-tests --parallel')

  await runCommand(`mkdir -p ${tmpPath}/examples/`)
  await setupTestProjects()

  process.exit(1)

  // await runCommand(`cp -r ${basicExamplePath} ${basicTmpPath}`)
  // console.log(`Created example project in ${basicExamplePath}`)
}

const ci = async () => {
  // await runCommand('yarn packages:build')
  await runCommand(`mkdir -p ${tmpPath}/examples/`)
  await setupTestProjects()

  // await runCommand('yarn lerna run testcafe:ci --scope e2e-tests')
}

;(async () => {
  // console.log({ rootPath })
  // await ci()
  await ci()

  // console.log(output)
  // await Promise.all(Object.keys(paths).map(pathName => build(paths[pathName])))
  // const watchCommands = Object.keys(paths).map(pathName =>
  //   watch(paths[pathName])
  // )
  // runCommand('yarn test', e2eTestsPath)
  // console.log('Done building. Starting dev server')
})()
