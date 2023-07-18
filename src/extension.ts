import * as vscode from 'vscode';
import { showProblem } from './commands/showProblem';
import { headerComment } from './commands/headerComment';

export function activate(context: vscode.ExtensionContext)
{

	console.log('Congratulations, your extension "BOJ-EX" is now active!');

	// showProblem 커맨드 등록
	context.subscriptions.push(
		vscode.commands.registerCommand('BOJ-EX.showProblem', () =>
		{
			// 문제 번호를 입력받는 InputBox 띄우기
			vscode.window.showInputBox({
				prompt: "문제 번호를 입력하세요.",
				placeHolder: "예: 1000",
			}).then((problemNumber) =>
			{
				if (problemNumber)
				{
					// showProblem 함수 호출 시 context 전달
					showProblem(problemNumber, context);
				} else
				{
					vscode.window.showInformationMessage("문제 번호를 입력해주세요.");
				}
			});
		})
	);

	// headerComment 커맨드 등록
	context.subscriptions.push(
		vscode.commands.registerCommand('BOJ-EX.headerComment', () =>
		{
			headerComment();
		})
	);
}

export function deactivate() { }
