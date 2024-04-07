// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {exec, execSync} from 'child_process';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { setTimeout as promises_setTimeout } from 'timers/promises';

const is_win = process.platform==='win32'
const is_mac = process.platform==='darwin'
const is_nix = process.platform==='linux'

let exportLast = 'html';

let editorKeyPressed: string[] = [];
let keyPressTimeout: NodeJS.Timeout | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "vscode-thothglyph" is now active!');

	installPyenv(context);

	context.subscriptions.push(vscode.commands.registerCommand('vscode-thothglyph.installPyenv', () => {
		installPyenv(context);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-thothglyph.exportFileAs', () => {
		exportFile(context, true);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-thothglyph.exportFileHtml', () => {
		exportLast = 'html';
		exportFile(context, false);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-thothglyph.editor.replaceSymbols', () => {
		replaceSymbols();
	}));
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
		vscode.window.showInformationMessage('Install Thothglyph: Thothglyph already exists');
		return;
	}

	vscode.window.withProgress({title: 'Install Thothglyph', location: vscode.ProgressLocation.Notification}, async progress => {
		progress.report({ message: 'mkdir <globalStrage>' });
		if (!existsSync(thothglyphHome)) {
			mkdirSync(thothglyphHome);
		}

		progress.report({ message: 'python -m venv', increment: 10 });
		if (!existsSync(pyenvPath)) {
			try {
				execSync('python -m venv ' + pyenvName, { cwd: thothglyphHome });
			}
			catch(error: any){
				if (error !== null) {
					console.log('exec error: ' + error);
					vscode.window.showErrorMessage('exec error: ' + error);
				}
				var stderr = error.stderr.toString();
				if (stderr !== null && stderr !== '') {
					console.log(stderr.toString());
					vscode.window.showErrorMessage('stderr: ' + stderr.toString());
				}
			}
		}

		progress.report({ message: 'pip install thothglyph-doc', increment: 30 });
		if (!existsSync(thothglyphCmd)) {
			try {
				execSync(path.join(pyenvName, pyenvBin, 'pip') + ' install thothglyph-doc', { cwd: thothglyphHome });
			}
			catch(error: any){
				if (error !== null) {
					console.log('exec error: ' + error);
					vscode.window.showErrorMessage('exec error: ' + error);
				}
				var stderr = error.stderr.toString();
				if (stderr !== null && stderr !== '') {
					console.log(stderr.toString());
					vscode.window.showErrorMessage('stderr: ' + stderr.toString());
				}
			}
		}
		progress.report({ message: 'finished', increment: 60 });
		await promises_setTimeout(5000);
	});
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
	if (editor.document.languageId != 'thothglyph') {
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
		let outputName = inputFilePath.name + '.' + toFmt;
		let cmd = thothglyphCmd + ' -t ' +  toFmt + ' ' + inputFilePath.base;
		try {
			execSync(cmd, { cwd: inputFilePath.dir });
			vscode.window.showInformationMessage('Exported: ' + outputName);
		}
		catch(error: any){
			if (error !== null) {
				console.log('exec error: ' + error);
				vscode.window.showErrorMessage('exec error: ' + error);
			}
			var stderr = error.stderr.toString();
			if (stderr !== null && stderr !== '') {
				console.log(stderr.toString());
				vscode.window.showErrorMessage('stderr: ' + stderr.toString());
			}
		}
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
	/* Inline symbol */
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
		editor.edit(editBuilder => {editBuilder.replace(range, '⋄');});
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
	if (symbol == 'ᛝ') {
		editor.edit(editBuilder => {editBuilder.replace(range, '⫶');});
	} else
	{
	}
}
