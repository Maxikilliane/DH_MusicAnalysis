function showPossibleFileExtensions() {
    UIkit.notification({
        message: 'Possible file formats which can be analysed are: ' +
        'ABC, Capella, ClercqTemperley, Humdrum, MEI, Midi, MuseData, MusicXML, Noteworthy, NoteworthyBinary, ' +
        'RomanText, Scala, TinyNotation and Volpiano. ',
        status: 'default',
        pos: 'top-left',
        timeout: 5000
    });
}

