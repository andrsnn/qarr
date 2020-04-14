const LZString = require('lz-string');

var DataBlob = {
  // `data`: js object to blobify(string)
  // `encoding`: *Optional* `base64`(default) or `utf16`
  assembleBlob: function (data, /*optional*/ encoding) {
    var compressMethod =
      encoding == "utf16"
        ? LZString.compressToUTF16
        : LZString.compressToBase64;

    var escapedStringifiedData = JSON.stringify(data);
    //console.log("esc", escaped_stringified_data.length, escaped_stringified_data);

    var compressedBlob = compressMethod(escapedStringifiedData);

    return compressedBlob;
  },

  // `blob`: A string blob from `DataBlob.assembleBlob`
  // `encoding`: *Optional* `base64`(default) or `utf16`
  parseBlob: function (blob, /*optional*/ encoding) {
    var decompressMethod =
      encoding == "utf16"
        ? LZString.decompressFromUTF16
        : LZString.decompressFromBase64;

    var uncompressed = decompressMethod(blob);
    var parsedResult = JSON.parse(uncompressed);

    return parsedResult;
  },
};

export default DataBlob;
