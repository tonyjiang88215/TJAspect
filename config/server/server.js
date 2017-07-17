/**
 * Created by TonyJiang on 16/12/20.
 */
var webpack = require('webpack');
var webpackDevServer = require('webpack-dev-server');
var config = require('../webpack/dev.config');

var port = 9527;

new webpackDevServer(webpack(config), {})
    .listen(port, '0.0.0.0', function(err, result){
    if(err){
        console.log(err);
    }else{
        console.log('Server Started, Listening at 127.0.0.1:', port);
    }
});