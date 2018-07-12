const rollup = require('rollup')
const uglify = require('rollup-plugin-uglify')
const typescript = require('rollup-plugin-typescript2')
const copy = require('rollup-plugin-copy')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const fs = require('fs')
const paths = require('path')

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

function buildTarget(which) {
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
  rollup.rollup({
    input: indexFile,
    external,
    context: 'window',
    plugins: defaultPlugins,
  }).then(bundle => {
    return bundle.write({
      globals,
      name: targetVariable,
      sourcemap: true,
      format: 'umd',
      banner: getBanner(),
      file: distFolder +  targetFile + '.umd.js'
    })
  }).then(() => {
    let bannercomment0 = false;

    // Minified bundle
    return rollup.rollup({
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
  }).then(bundle => {
    return bundle.write({
      globals,
      name: targetVariable,
      sourcemap: true,
      format: 'umd',
      banner: getBanner(),
      file: distFolder + targetFile + '.umd.min.js',
    })
  }).then(() => {
    mergePackage(which, distFolder + `package.json`)
  })
}


buildTarget('googlemaps')
buildTarget('leaflet')