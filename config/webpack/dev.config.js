/**
 * Created by TonyJiang on 16/12/20.
 */
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

//定义路径
var projectRootPath = path.resolve(__dirname, '../../');
var assetsPath = path.resolve(projectRootPath, 'release');
var nodeModulesPath = path.resolve(projectRootPath, 'node_modules');
var srcPath = path.resolve(projectRootPath, 'src');


//指定打包的入口, 每个入口对应一个打包后的文件
const entry = {
    main: [
        'webpack-dev-server/client?http://0.0.0.0:9527',  //hot reloading
        path.resolve(projectRootPath, 'src/index.tsx')
    ]
};

//指定打包好的文件存放位置
const output = {
    path: assetsPath,
    //文件命名方式
    filename: '[name]-[hash].js',
    //分包文件命名方式
    chunkFilename: '[name]-[chunkhash].js'
};

//webpack 所需要的插件
const plugins = [
    new HtmlWebpackPlugin({
        // template: 'index.html', // Move the index.html file
        template: path.join(srcPath, 'index.html'),
        inject: true
    })
];

//webpack 加载器, 不同类型文件需要不同的加载器进行编译
const loaders = [
    //typescript
    {test: /\.(tsx|ts)?$/, loader: 'awesome-typescript-loader', include: [srcPath]},

    //common es6
    {test: /\.(jsx|js)?$/, loader: 'babel-loader'},

    //less
    {test: /\.less$/, loader: 'style-loader!css-loader!less-loader'},

    //css
    {test: /\.css$/, loader: 'style-loader!css-loader'},

    //文件
    {test: /\.(ttf|eot|svg|woff)(\?[a-z0-9]+)?$/, loader : 'file-loader'},

    //图片
    {test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192'}

];


//webpack.config
module.exports = {
    devtool: 'sourcemap',
    context: projectRootPath,
    // progress: true,
    warning: false,


    entry: entry,
    output: output,
    module: {
        loaders: loaders
    },
    plugins: plugins,

    resolve: {
        modulesDirectories: [
            'src',
            'node_modules'
        ],
        extensions: ['', '.json', '.js', '.jsx', '.ts', '.tsx']
    }
}