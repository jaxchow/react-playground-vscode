
const vscode = require('vscode');
const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const { createEntry } = require('react-playground-kit');
const WebpackDevServer = require('webpack-dev-server');
const addDevServerEntrypoints = require('webpack-dev-server/lib/util/addDevServerEntrypoints');

const { 
    createContentEntry, 
    createEntryHtml, 
    createWebpackConfig 
} = require('./utils');


    
let compiler;
let devServer;
function activate(context) {
    
    const { extensionPath } = context; //context.storagePath    
    const { rootPath: workspacePath } = vscode.workspace;  //users work dir    
    const contentBase = path.join(path.normalize(workspacePath), '.react-playground');
    
    const playgroundUri = vscode.Uri.file(`${contentBase}/playground.html`);
      
    //create folder
    if (!fs.existsSync(contentBase)){
        fs.mkdirSync(contentBase);
    }


    
    const disposable = vscode.commands.registerCommand('extension.openPlayground', function () {
       
        try {
            const editor = vscode.window.activeTextEditor;
            let filePath = editor.document.uri.path;
            const isWin = /^win/.test(process.platform);

            if ( isWin ) {
                filePath = filePath.substr(1);
            }
            if ( !devServer ) {
                const webpackConfig = createWebpackConfig({ contentBase, extensionPath: path.resolve(extensionPath), workspacePath: path.resolve(workspacePath)});
                fs.writeFileSync(path.join(contentBase, 'playground.html'), createContentEntry());
                fs.writeFileSync(path.join(contentBase, 'index.js'), createEntry(filePath));
                // fs.writeFileSync(path.join(contentBase, 'index.html'), createEntryHtml());

                addDevServerEntrypoints(webpackConfig, webpackConfig.devServer);                
                compiler = webpack(webpackConfig);
                devServer = new WebpackDevServer(compiler, webpackConfig.devServer);
                vscode.window.showInformationMessage("webpack服务启动中，请稍后...") 
                
                devServer.listen(webpackConfig.devServer.port, 'localhost', function(err) {
                    if(err) throw err;                                     
                    const panel = vscode.window.createWebviewPanel(
                        'catCoding',
                        'React Component Playground',
                        vscode.ViewColumn.Two,
                        {
                            enableScripts:true
                        }
                      );
                      panel.webview.html = createContentEntry()
                });
            } else {
                      panel.webview.html = createContentEntry();
            }
            
        } catch ( e ) {
            vscode.window.showInformationMessage(e)
            console.error(e);
        }

    });

    context.subscriptions.push(disposable);

}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {    
    if ( devServer ) {
        devServer.close();
        devServer = null;
    }
    if ( compiler ) {
        compiler.close();
        compiler = null;
    }
    
}
exports.deactivate = deactivate;