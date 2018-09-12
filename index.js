'use strict'

const fs = require('fs-extra')
const i18nStringsFiles = require('i18n-strings-files');
const parseString = require('xml2js').parseString;
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

var iosStrings = undefined
var androidStrings = undefined

const defaultiOSFileName = "Localizable.strings"
const defaultAndroidFileName = "strings.xml"

const filesToCsv = {

    convert(file) {
        if(file.endsWith(defaultiOSFileName)) {
            return new Promise((res, rej) => {
              i18nStringsFiles.readFile(file, 'UTF-8', function(err, data){
                  if(data == undefined) {
                    rej(err);
                  }
              
                  iosStrings = data
                  res(iosStrings)
              });
          });
        }

        if(file.endsWith(defaultAndroidFileName)) {
          return new Promise((res, rej) => {
              fs.readFile(file, function(err, data) {
                  parseString(data, function (err, result) {
                    if(result == undefined) {
                      rej(err);
                    }
                    
                    androidStrings = JSON.parse(JSON.stringify(result))
                    res(androidStrings)
                  });
              });
        });
      }
        
      return () => {}
    },

    processFiles(resultFileName) {
        if(androidStrings == undefined && iosStrings != undefined) {
            prepareSingleIOSFile(iosStrings, resultFileName)
            return
        }

        if(androidStrings != undefined && iosStrings == undefined) {
            prepareSingleAndroidFile(androidStrings, resultFileName)
            return
        }

        if(androidStrings != undefined && iosStrings != undefined) {
            mergeFiles(androidStrings, iosStrings, resultFileName)
        }
    }

}

function prepareSingleAndroidFile(strings, fileName) {
    const csvAndroidWriter = createCsvWriter({
      path: fileName + '_android.csv',
      header: [
          {id: 'key', title: 'KEY'},
          {id: 'android_value', title: 'ANDROID_VALUE'}
      ]
    });

    csvAndroidWriter.writeRecords(convertAndroidRecords(strings))
    .then(() => {
        console.log('... Android Done');
    });    
}

function prepareSingleIOSFile(strings, fileName) {
    const csvIOSWriter = createCsvWriter({
      path: fileName + '_ios.csv',
      header: [
          {id: 'key', title: 'KEY'},
          {id: 'ios_value', title: 'IOS_VALUE'}
      ]
    });

    csvIOSWriter.writeRecords(convertIOSRecords(strings))
    .then(() => {
        console.log('... iOS Done');
    });
}

function convertAndroidRecords(strings) {
    var records = []

    Object.entries(strings.resources.string).forEach(([key, value]) => {
        records.push({ key: value.$.name, android_value: value._ })
    });

    return records
}

function convertIOSRecords(strings) {
    var records = []

    Object.entries(strings).forEach(([key, value]) => {
        records.push({ key: key, ios_value: value })
    });

    return records
}

function mergeRecords(aStrings, iStrings) {
    var androidRecords = convertAndroidRecords(aStrings)
    var iOSRecords = convertIOSRecords(iStrings)

    var records = []

    //compare iOS against android
    iOSRecords.forEach(string => {
        var alreadyAdded = records.find(element => {
            return element.key == string.key
        })

        if(alreadyAdded) {
            return
        }

        var foundKey = androidRecords.find(element => {
            return element.key == string.key
        })

        if(foundKey) {
            records.push({ key: string.key, ios_value: string.ios_value, ios_only: false, android_value: foundKey.android_value, android_only: false,
                 identical: string.ios_value === foundKey.android_value})
        } else {
            records.push({ key: string.key, ios_value: string.ios_value, ios_only: true, android_only: false, identical: false})
        }
    })

    //compare android against iOS
    androidRecords.forEach(string => {
        var alreadyAdded = records.find(element => {
            return element.key === string.key
        })

        if(alreadyAdded) {
            return
        }

        var foundKey = iOSRecords.find(element => {
            return element.key === string.key
        })

        if(foundKey) {
            records.push({ key: string.key, ios_value: string.ios_value, ios_only: false, android_value: foundKey.android_value, android_only: false,
                 identical: string.ios_value === foundKey.android_value})
        } else {
            records.push({ key: string.key, android_value: string.android_value, ios_only: false, android_only: true, identical: false})
        }
    })

    return records
}

function mergeFiles(aStrings, iStrings, fileName) {
    const csvIOSWriter = createCsvWriter({
        path: fileName + '_merged.csv',
        header: [
            {id: 'key', title: 'KEY'},
            {id: 'ios_value', title: 'IOS_VALUE'},
            {id: 'ios_only', title: 'IOS_ONLY'},
            {id: 'android_value', title: 'ANDROID_VALUE'},
            {id: 'android_only', title: 'ANDROID_ONLY'},
            {id: 'identical', title: 'IDENTICAL'}
        ]
    });
  
    csvIOSWriter.writeRecords(mergeRecords(aStrings, iStrings))
        .then(() => {
            console.log('... Merge Done');
        });
}
  
module.exports = filesToCsv