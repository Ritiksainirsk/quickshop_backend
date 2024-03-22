const mongoose = require("mongoose")

const Product =  mongoose.model("Product",{
    id:{
        type:Number,
        require:true
    },
    name:{
        type:String,
        require:true
    },
    image:{
        type:String,
        require:true
    },
    category:{
        type:String,
        require:true
    },
    old_price:{
        type:Number,
        require:true
    },
    new_price:{
        type:Number,
        require:true
    },
    date:{
        type:Date,
        default:Date.now
    },
    available:{
        type:Boolean,
        default:true
    }
})

module.exports = Product 

