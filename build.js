const rollup = require('rollup')
const uglify = require('rollup-plugin-uglify')
const typescript = require('rollup-plugin-typescript2')
const copy = require('rollup-plugin-copy')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const fs = require('fs')
const paths = require('path')
const fsExtra = require('fs-extra')

const curVersionString = require("./package.json").version
const curVersion = JSON.stringify(require("./package.json").version)
const curYear = new Date().getFullYear()
const author = require("./package.json").author || ''
const contributors = require("./package.json").contributors || []
const description = require("./package.json").description || ''
const name = require("./package.json").name || ''

const deps = Object.keys(require("./package.json").dependencies).concat(Object.keys(require("./package.json").peerDependencies || {}))
const builtinImports = []
const external = [...deps, ...builtinImports]
const globals = {
  '@targomo/core': 'tgm',
  'leaflet': 'L'
}

const production = !process.env.ROLLUP_WATCH;

function getBanner() {
  return `/** 
* ${name} ${curVersion} http://targomo.com
* ${description}
* (c) ${curYear} ${author}
*/`
}

async function mergeFullVersion(source, withLib, destination) {
  source = paths.resolve(__dirname, source)
  destination = paths.resolve(__dirname, destination)
  withLib = paths.resolve(__dirname, 'node_modules', '@targomo', 'core', withLib)

  const libData = fs.readFileSync(withLib).toString('utf-8')
  const sourceData = fs.readFileSync(source).toString('utf-8')

  fs.writeFileSync(destination, [libData, sourceData].join('\n\n\n'))
}


function mergePackage(which, destination) {
  const mainPackage = require('./package.json')
  const specificPackage = require(`./package.${which}.json`)

  const merged = {
    ...mainPackage,
    ...specificPackage
  }

  // for (let key in merged) {
  //   let mainValue = mainPackage[key]
  //   let specificValue = specificPackage[key]

  //   let anyValue = mainValue || specificValue
  //   if (anyValue instanceof Array) {
  //     merged[key] = (mainValue || []).concat(specificValue || [])
  //   } else if (anyValue === Object(anyValue)) {
  //     merged[key] = {...(mainValue || {}), ...(specificValue || {})}
  //   }
  // }

  fs.writeFileSync(paths.join(__dirname, destination), JSON.stringify(merged))
}

async function buildTarget(which) {
  const indexFile = `./src/index.${which}.ts`
  const targetFile = `targomo-${which}`
  const targetVariable = `tgm.${which}`
  const distFolder = `./dist/${which}/`

  const defaultPlugins = [
    typescript({
      tsconfig: './tsconfig.json',
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: {
          declarationDir: `${distFolder}typings`
        }
      }
    }),
    resolve(),
    commonjs()
  ]
  
  // --- BROWSER ---

  // Regular bundle
  const bundle = await rollup.rollup({
    input: indexFile,
    external,
    context: 'window',
    plugins: defaultPlugins,
  })

  await bundle.write({
    globals,
    name: targetVariable,
    sourcemap: true,
    format: 'umd',
    banner: getBanner(),
    file: distFolder +  targetFile + '.umd.js'
  })

  mergeFullVersion(distFolder + targetFile + '.umd.js', 'targomo-core.umd.js', distFolder + targetFile + '-full.umd.js')

  let bannercomment0 = false;

    // Minified bundle
  const bundleMin = await rollup.rollup({
    input: indexFile,
    external,
    context: 'window',
    plugins: [
      ...defaultPlugins,
      uglify({
        output: {
          comments: function (node, comment) {
            var text = comment.value
            var type = comment.type
            if (type == "comment2") {
              // multiline comment
              const show = !bannercomment0
              bannercomment0 = true
              return show
            }
          }
        }
      }),
      // copy({
      //   "./package.json" : distFolder + `package.json`,
      //   // './dist/typings' : distFolder,
      //   verbose: true
      // })
    ],
  })

  await bundleMin.write({
    globals,
    name: targetVariable,
    sourcemap: true,
    format: 'umd',
    banner: getBanner(),
    file: distFolder + targetFile + '.umd.min.js',
  })

  mergeFullVersion(distFolder + targetFile + '.umd.min.js', 'targomo-core.umd.min.js', distFolder + targetFile + '-full.umd.min.js')

  mergePackage(which, distFolder + `package.json`)  


  const releaseFolder = paths.resolve(__dirname, 'dist', 'releases', 'javascript', targetFile)
  fsExtra.ensureDirSync(releaseFolder)

  const postfixes = [['', ''], ['', '.min'], ['-full', ''], ['-full', '.min']]
  postfixes.forEach((pair) => {
    const prefix = pair[0]
    const postfix = pair[1]
    fsExtra.copySync(paths.resolve(__dirname, distFolder, targetFile + `${prefix}.umd${postfix}.js`), paths.join(releaseFolder, `latest${prefix}${postfix}.js`))
    fsExtra.copySync(paths.resolve(__dirname, distFolder, targetFile + `${prefix}.umd${postfix}.js`), paths.join(releaseFolder, `${curVersionString}${prefix}${postfix}.js`))
  })
}


buildTarget('googlemaps')
buildTarget('leaflet')