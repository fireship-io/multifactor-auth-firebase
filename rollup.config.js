import resolve from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve'

module.exports = {
    input: 'src/main.js',
    output: {
      file: 'public/bundle.js',
      format: 'cjs'
    },
    plugins: [
        resolve(), 
        serve({
            port: 5200,
            open: true,
            contentBase: 'public'
    })]
  };