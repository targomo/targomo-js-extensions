const rollup = require('rollup')
const uglify = require('rollup-plugin-uglify')
const typescript = require('rollup-plugin-typescript2')
const copy = require('rollup-plugin-copy')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')

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

const defaultPlugins = [
  typescript({
    tsconfig: './tsconfig.json',
    useTsconfigDeclarationDir: true
  }),
  resolve(),
  commonjs()
]


function buildTarget(indexFile, targetFile, targetVariable) {
  // --- BROWSER ---

  // Regular bundle
  rollup.rollup({
    input: indexFile,
    external,
    context: 'window',
    plugins: defaultPlugins,
  }).then(bundle => {
    bundle.write({
      globals,
      name: targetVariable,
      sourcemap: true,
      format: 'umd',
      banner: getBanner(),
      file: './dist/' +  targetFile + '.umd.js'
    })
  })

  let bannercomment0 = false;

  // Minified bundle
  rollup.rollup({
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
      copy({
        "./package.json": "dist/package.json",
        verbose: true
      })
    ],
  }).then(bundle => {
    bundle.write({
      globals,
      name: targetVariable,
      sourcemap: true,
      format: 'umd',
      banner: getBanner(),
      file: './dist/' + targetFile + '.umd.min.js',
    })
  })
}


buildTarget('./src/index.google.ts',  'targomo-googlemaps', 'tgm.googlemaps')
buildTarget('./src/index.leaflet.ts', 'targomo-leaflet', 'tgm.leaflet')