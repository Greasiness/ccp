
var mongoose = require('mongoose');

var itemSchema = mongoose.Schema({

    name: String,
    description: String,
    quantity: Number,
    type: String,
    ccp: Number,
    active: Boolean
});


module.exports = mongoose.model('Item', itemSchema);