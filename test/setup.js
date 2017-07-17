var JSDom = require('jsdom');

var exposedProperties = ['window', 'navigator', 'document'];

global.document = JSDom.jsdom('<!doctype html><html><body></body></html>');

global.window = document.defaultView;
global.window.history=global.history;
global.window.localStorage=global.localStorage;
global.window.XMLHttpRequest = global.XMLHttpRequest;

Object.keys(document.defaultView).forEach((property) => {
    if (typeof global[property] === 'undefined') {
        exposedProperties.push(property);
        global[property] = document.defaultView[property];
    }
});

global.navigator = {
    userAgent: 'node.js'
};

global.documentRef = document;