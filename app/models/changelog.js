
var mongoose = require('mongoose');

var changelogSchema = mongoose.Schema({
    name:String,
    content: String
});


module.exports = mongoose.model('Changelog', changelogSchema);