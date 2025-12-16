const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        background: './background.js',
        content: './content.js',
        'config/config': './config/config.js',
        'popup/action-popup': './popup/action-popup.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'manifest.json', to: '.' },
                {
                    from: 'icons',
                    to: 'icons',
                    globOptions: {
                        ignore: ['**/nadecon-115.png']
                    }
                },
                { from: 'LICENSE', to: '.' },
                { from: 'README.md', to: '.' },
                {
                    from: 'popup',
                    to: 'popup',
                    globOptions: {
                        ignore: ['**/*.js']
                    }
                },
                {
                    from: 'config',
                    to: 'config',
                    globOptions: {
                        ignore: ['**/*.js']
                    }
                }
            ]
        }),
        new ZipWebpackPlugin({
            path: '../',
            filename: 'NadeCon',
            extension: 'xpi'
        })
    ]
};
