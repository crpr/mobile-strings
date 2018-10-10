#!/usr/bin/env node
'use strict'

const meow = require('meow')
const glob = require('glob')
const lib = require('.')
const path = require('path')

const cli = meow(`
	Usage
      $ string-it <file> -a <file> -i <file>
      $ string-it -f <file>

    Options
      -a Specify android file
      -i Specify iOS file
      -f Specify csv file to generate platform string files

    Examples
      $ string-it resultfile -a strings.xml -i Localizable.strings
      $ string-it resultfile -a strings.xml
      $ string-it resultfile  -i Localizable.strings
      $ string-it -f resultfile
`, {
	flags: {
		a: {
			type: 'string'
        },
        i: {
			type: 'string'
		},
        f: {
			type: 'string'
		}
	}
});

if (cli.flags.f != undefined) {
    console.log('Starting Generate Platform Strings')
    console.log(Object.entries(cli.flags))

    const inputFile = cli.flags.f

    generatePlatformFiles(inputFile)

} else if (cli.flags.a === undefined && cli.flags.i === undefined) {
    console.error('Missing: at least one string file is needed.')
    cli.showHelp(1)
} else {
    console.log('Starting Platform Strings CSV Generation')
    console.log(Object.entries(cli.flags))
    
    var convertedFiles = 0

    const inputFiles = Object.entries(cli.flags).map(flag => {
        return flag[1]
    })

    generateCsv(inputFiles)
}

// CSV Generation

function generateCsv(inputFiles) {
    glob(inputFiles[0] || '', (error, files) => {
        processFileForCsv(inputFiles, files)
    })
    
    glob(inputFiles[1] || '', (error, files) => {
        processFileForCsv(inputFiles, files)
    })
}

function processFileForCsv(inputFiles, files) {
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

// String Platform  

function generatePlatformFiles(inputFile) {
    glob(inputFile || '', (error, files) => {
        processCsvFile(files)
    })
}

function processCsvFile(files) {
    files.map((file) => {
        file = path.resolve(__dirname, file)
        lib.loadCsvFile(file)
            .then((results) => lib.generateiOSFile(results))
            .then((results) => lib.generateAndroidFile(results))
            .then(() => {
                console.log(`Read Ok for: ${file}.`)
            })
            .catch((error) => {
                console.error(`Error: ${file}.`)
            })
    })
}