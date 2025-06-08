// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {exec, execSync} from 'child_process';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { setTimeout as promises_setTimeout } from 'timers/promises';
import * as fs from 'fs';

const is_win = process.platform==='win32'
const is_mac = process.platform==='darwin'
const is_nix = process.platform==='linux'

let exportLast = 'html';

let editorKeyPressed: string[] = [];
let keyPressTimeout: NodeJS.Timeout | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
	//installPyenv(context);
	//updatePyenv(context);

	context.subscriptions.push(vscode.commands.registerCommand('vscode-thothglyph.installPyenv', () => {
		installPyenv(context);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-thothglyph.updatePyenv', () => {
		updatePyenv(context);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-thothglyph.exportPreview', () => {
		exportPreview(context);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-thothglyph.exportFileAs', () => {
		exportFile(context, true);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-thothglyph.exportFile', () => {
		exportFile(context, false);
	}));
	// ontext.subscriptions.push(vscode.commands.registerCommand('vscode-thothglyph.exportFileHtml', () => {
	// 	exportLast = 'html';
	// 	exportFile(context, false);
	// ));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-thothglyph.editor.replaceSymbols', () => {
		replaceSymbols();
	}));

	// vscode.workspace.onDidSaveTextDocument( event => {
	// 	let editor = vscode.window.activeTextEditor;
	// 	if (!editor) {
	// 		return;
	// 	}
	// 	if (editor.document.languageId != 'thothglyph') {
	// 		return;
	// 	}
	// 	exportPreview(context);
	// });
}

export function deactivate()
{
}

function installPyenv(context: vscode.ExtensionContext) {
	let thothglyphHome = context.globalStorageUri.fsPath;
	let pyenvName = 'pyenv';
	let pyenvBin = (is_win ? 'Scripts' : 'bin');
	let pyenvPath = path.join(thothglyphHome, pyenvName);
	let thothglyphCmd = path.join(pyenvPath, pyenvBin, 'thothglyph');

	if (existsSync(thothglyphCmd)) {
		return;
	}

	vscode.window.withProgress({title: 'Install Thothglyph', location: vscode.ProgressLocation.Notification}, async progress => {
		await progress.report({ message: 'mkdir <globalStrage>' });
		if (!existsSync(thothglyphHome)) {
			mkdirSync(thothglyphHome);
		}

		await progress.report({ message: 'python -m venv', increment: 10 });
		if (!existsSync(pyenvPath)) {
			try {
				execSync('python -m venv ' + pyenvName, { cwd: thothglyphHome });
			}
			catch(error: any){
				var stderr = error.stderr.toString();
				if (stderr !== null && stderr !== '') {
					console.log(stderr.toString());
					vscode.window.showErrorMessage('Error: ' + stderr.toString());
				}
				return;
			}
		}

		await progress.report({ message: 'pip install thothglyph-doc', increment: 30 });
		if (!existsSync(thothglyphCmd)) {
			try {
				execSync(path.join(pyenvName, pyenvBin, 'pip') + ' install thothglyph-doc', { cwd: thothglyphHome });
			}
			catch(error: any){
				var stderr = error.stderr.toString();
				if (stderr !== null && stderr !== '') {
					console.log(stderr.toString());
					vscode.window.showErrorMessage('Error: ' + stderr.toString());
				}
				return;
			}
		}
		await progress.report({ message: 'finished', increment: 60 });
		await promises_setTimeout(5000);
	});
}

function updatePyenv(context: vscode.ExtensionContext) {
	let thothglyphHome = context.globalStorageUri.fsPath;
	let pyenvName = 'pyenv';
	let pyenvBin = (is_win ? 'Scripts' : 'bin');
	let pyenvPath = path.join(thothglyphHome, pyenvName);
	let thothglyphCmd = path.join(pyenvPath, pyenvBin, 'thothglyph');

	vscode.window.withProgress({title: 'Update Thothglyph', location: vscode.ProgressLocation.Notification}, async progress => {
		await progress.report({ message: 'update start', increment: 10 });
		if (!existsSync(thothglyphCmd)) {
			installPyenv(context);
			return;
		}
		try {
			var stdout = execSync(path.join(pyenvName, pyenvBin, 'pip') + ' list -o', { cwd: thothglyphHome }).toString();
			if (stdout.search("thothglyph") < 0) {
				// already latest version.
				await progress.report({ message: 'already latest version.', increment: 90 });
				await promises_setTimeout(5000);
				return;
			}
		}
		catch(error: any){
			// maybe pyenv is broken. so reinstall environment.
			await progress.report({ message: 'maybe pyenv is broken. so reinstall environment.', increment: 10 });
			try {
				fs.rmSync(pyenvPath, { recursive: true, force: true });
				installPyenv(context);
			}
			catch(error: any){
			}
			await progress.report({ message: 'finished: ', increment: 80 });
			await promises_setTimeout(5000);
			return;
		}

		await progress.report({ message: 'pip install -U thothglyph-doc', increment: 20 });
		try {
			execSync(path.join(pyenvName, pyenvBin, 'pip') + ' install -U thothglyph-doc', { cwd: thothglyphHome });
		}
		catch(error: any){
			var stderr = error.stderr.toString();
			if (stderr !== null && stderr !== '') {
				console.log(stderr.toString());
				vscode.window.showErrorMessage('Error: ' + stderr.toString());
			}
			return;
		}

		var stdout = "";
		try {
			stdout = execSync(path.join(pyenvName, pyenvBin, 'thothglyph') + ' -v', { cwd: thothglyphHome }).toString();
		}
		catch(error: any){
			var stderr = error.stderr.toString();
			if (stderr !== null && stderr !== '') {
				console.log(stderr.toString());
				vscode.window.showErrorMessage('Error: ' + stderr.toString());
			}
			return;
		}
		await progress.report({ message: 'finished: ' + stdout, increment: 60 });
		await promises_setTimeout(5000);
	});
}

async function exportPreview(context: vscode.ExtensionContext) {
	let thothglyphHome = context.globalStorageUri.fsPath;
	let pyenvName = 'pyenv';
	let pyenvBin = (is_win ? 'Scripts' : 'bin');
	let pyenvPath = path.join(thothglyphHome, pyenvName);
	let thothglyphCmd = path.join(pyenvPath, pyenvBin, 'thothglyph');

	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	if ((editor.document.languageId != 'thothglyph') && (editor.document.languageId != 'thothglyphMd')) {
		return;
	}

	let inputFilePath = path.parse(path.normalize(editor.document.fileName));
	
	let reject = false;
	let toFmt = 'html';

	if (!reject) {
		let extensionConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('htmlPreview');
		let templateDir = extensionConfig.get<string>("templateDirectory") ?? "";
		let templateTheme = extensionConfig.get<string>("templateTheme") ?? "";

		let outputName = 'preview.html';
		let cmd = thothglyphCmd + ' -t ' +  toFmt + ' ' + inputFilePath.base + ' -o ' + outputName;
		if (templateDir != "") {
			cmd += ' --template ' + templateDir
		}
		if (templateTheme != "") {
			cmd += ' --theme ' + templateTheme
		}
		try {
			execSync(cmd, { cwd: inputFilePath.dir });
		}
		catch(error: any){
			var stderr = error.stderr.toString();
			if (stderr !== null && stderr !== '') {
				console.log(stderr.toString());
				vscode.window.showErrorMessage('Error: ' + stderr.toString());
			}
		}
	}
}

async function exportFile(context: vscode.ExtensionContext, asnew: boolean) {
	let thothglyphHome = context.globalStorageUri.fsPath;
	let pyenvName = 'pyenv';
	let pyenvBin = (is_win ? 'Scripts' : 'bin');
	let pyenvPath = path.join(thothglyphHome, pyenvName);
	let thothglyphCmd = path.join(pyenvPath, pyenvBin, 'thothglyph');

	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	if ((editor.document.languageId != 'thothglyph') && (editor.document.languageId != 'thothglyphMd')) {
		return;
	}

	let inputFilePath = path.parse(path.normalize(editor.document.fileName));
	
	let reject = false;
	let toFmt = exportLast;
	if (asnew) {
		let items: vscode.QuickPickItem[] = [];
		items.push({ label: 'html', description: 'Export html document' });
		items.push({ label: 'pdf',  description: 'Export pdf document'  });
		items.push({ label: 'docx', description: 'Export word document' });

		let reject = false;
		await vscode.window.showQuickPick(items).then((qpSelection) => {
			if (!qpSelection) {
				reject = true;
				return;
			}

			toFmt = exportLast = qpSelection.label;
		});
	}

	if (!reject) {
		vscode.window.withProgress({title: 'Export file', location: vscode.ProgressLocation.Notification}, async progress => {
			await progress.report({ message: toFmt + ' start', increment: 10 });
	
			let outputName = inputFilePath.name + '.' + toFmt;
			let cmd = thothglyphCmd + ' -t ' +  toFmt + ' ' + inputFilePath.base;
			try {
				await progress.report({ message: 'cmd: ' + cmd, increment: 10 });
				execSync(cmd, { cwd: inputFilePath.dir });
			}
			catch(error: any){
				var stderr = error.stderr.toString();
				if (stderr !== null && stderr !== '') {
					console.log(stderr.toString());
					vscode.window.showErrorMessage('Error: ' + stderr.toString());
				}
				return;
			}
			await progress.report({ message: 'finished: ' + outputName, increment: 80 });
			await promises_setTimeout(5000);
		});
	}
}

function replaceSymbols()
{
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	if (editor.document.languageId != 'thothglyph') {
		return;
	}

	let pos = editor.selection.active;
	if (pos.character == 0) return;
	if (!editor.selection.isEmpty) return;

	let range = new vscode.Range(new vscode.Position(pos.line, pos.character-1), pos);
	let symbol = editor.document.getText(range);
	let range2 = range, symbol2 = symbol;
	let range3 = range, symbol3 = symbol;
	if (pos.character >= 2) {
		range2 = new vscode.Range(new vscode.Position(pos.line, pos.character-2), pos);
		symbol2 = editor.document.getText(range2);
	}
	if (pos.character >= 3) {
		range3 = new vscode.Range(new vscode.Position(pos.line, pos.character-3), pos);
		symbol3 = editor.document.getText(range3);
	}

	/* Block symbol */
	if (symbol3 == '%%%') {
		editor.edit(editBuilder => {editBuilder.replace(range3, '⑇⑇⑇');});
	} else
	if (symbol3 == '@@@') {
		editor.edit(editBuilder => {editBuilder.replace(range3, '¤¤¤');});
	} else
	if (symbol3 == '```') {
		editor.edit(editBuilder => {editBuilder.replace(range3, '⸌⸌⸌');});
	} else
	if (symbol2 == '%%') {
		editor.edit(editBuilder => {editBuilder.replace(range2, '⑇⑇');});
	} else
	if (symbol2 == '@1') {
		editor.edit(editBuilder => {editBuilder.replace(range2, '🔴');});
	} else
	if (symbol2 == '@2') {
		editor.edit(editBuilder => {editBuilder.replace(range2, '🟡');});
	} else
	if (symbol2 == '@3') {
		editor.edit(editBuilder => {editBuilder.replace(range2, '🟢');});
	} else
	if (symbol2 == '@4') {
		editor.edit(editBuilder => {editBuilder.replace(range2, '🔵');});
	} else
	if (symbol2 == '@5') {
		editor.edit(editBuilder => {editBuilder.replace(range2, '🟣');});
	} else
	if (symbol == '%') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⑇');});
	} else
	if (symbol == '#') {
		editor.edit(editBuilder => {editBuilder.replace(range, '▮');});
	} else
	if (symbol == '@') {
		editor.edit(editBuilder => {editBuilder.replace(range, '¤');});
	} else
	if (symbol == '`') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⸌');});
	} else
	if (symbol == '*') {
		editor.edit(editBuilder => {editBuilder.replace(range, '•');});
	} else
	if (symbol == '+') {
		editor.edit(editBuilder => {editBuilder.replace(range, '꓾');});
	} else
	if (symbol == ':') {
		editor.edit(editBuilder => {editBuilder.replace(range, 'ᛝ');});
	} else
	if (symbol == '-') {
		editor.edit(editBuilder => {editBuilder.replace(range, '◃');});
	} else
	if (symbol == '\\') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⊹');});
	} else
	/* Inline symbol */
	if (symbol == '⊹') {
		editor.edit(editBuilder => {editBuilder.replace(range, '↲');});
	} else
	if (symbol == '[') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⟦');});
	} else
	if (symbol == ']') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⟧');});
	} else
	if (symbol == '(') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⸨');});
	} else
	if (symbol == ')') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⸩');});
	} else
	if (symbol == '{') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⦃');});
	} else
	if (symbol == '}') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⦄');});
	} else
	if (symbol == '⟦') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⁅');});
	} else
	if (symbol == '⟧') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⁆');});
	} else
	if (symbol == '<') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⏴');});
	} else
	if (symbol == '>') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⏵');});
	} else
	if (symbol == '^') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⏶');});
	} else
	if (symbol == '~') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⏷');});
	} else
	/* Deco symbol */
	if (symbol == '•') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⧫');});
	} else
	if (symbol == '/') {
		editor.edit(editBuilder => {editBuilder.replace(range, '🙼');});
	} else
	if (symbol == '_') {
		editor.edit(editBuilder => {editBuilder.replace(range, '‗');});
	} else
	if (symbol == '◃') {
		editor.edit(editBuilder => {editBuilder.replace(range, '¬');});
	} else
	if (symbol == '⏶') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⌃');});
	} else
	if (symbol == '⏷') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⌄');});
	} else
	if (symbol == '🙼') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⁒');});
	} else
	if (symbol == ';') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⟠');});
	} else
	{
	}
}
