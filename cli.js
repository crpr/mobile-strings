#!/usr/bin/env node
'use strict'

const meow = require('meow')
const glob = require('glob')
const lib = require('.')
const path = require('path')

const cli = meow(`
	Usage
	  $ string-it <file> -a <file> -i <file>

	Options
      --android, -a Specify android file
      --ios -i Specify iOS file

    Examples
      $ string-it resultfile -a strings.xml -i Localizable.strings
      $ string-it resultfile -a strings.xml
      $ string-it resultfile  -i Localizable.strings
`, {
	flags: {
		a: {
			type: 'string'
        },
        i: {
			type: 'string'
		}
	}
});

if (cli.input.length === 0) {
    console.error('Missing: result file name.')
    cli.showHelp(1)
}
 
if (cli.flags.a === undefined && cli.flags.i === undefined) {
    console.error('Missing: at least one string file is needed.')
    cli.showHelp(1)
}

console.log(Object.entries(cli.flags))

const inputFiles = Object.entries(cli.flags).map(flag => {
    return flag[1]
})

var convertedFiles = 0

glob(inputFiles[0] || '', (error, files) => {
    processFile(files)
})

glob(inputFiles[1] || '', (error, files) => {
    processFile(files)
})

function processFile(files) {
    files.map((file) => {
        file = path.resolve(__dirname, file)
        lib.convert(file)
            .then(() => {
                convertedFiles++
                console.log(`Converted: ${file}.`)
                if(convertedFiles == inputFiles.length) {
                    lib.processFiles(cli.input)
                }
            })
            .catch((error) => {
                console.error(`Error converting: ${file}.`, error)
            })
    })
}