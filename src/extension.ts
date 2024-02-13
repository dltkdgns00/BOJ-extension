import * as vscode from "vscode";
import { showProblem } from "./commands/showProblem";
import { headerComment } from "./commands/headerComment";
import { createProblem } from "./commands/createProblem";
import { pushToGithub } from "./commands/pushToGithub";
import { makeWorkflow } from "./libs/makeWorkflow";
import { showManual } from "./commands/showManual";

export function activate(context: vscode.ExtensionContext) {
	// 확장프로그램이 처음 실행될 때, 설정이 되어있지 않으면 설정창을 띄워준다.
	const config = vscode.workspace.getConfiguration("BOJ");
	const extension = config.get<string>("extension", "");
	const author = config.get<string>("author", "");
	if (
		extension === undefined ||
		author === undefined ||
		extension === "" ||
		author === ""
	) {
		vscode.window.showInformationMessage(
			"BOJ-EX를 설치해주셔서 감사합니다."
		);

		vscode.commands.executeCommand(
			"workbench.action.openSettings",
			"BOJ-extension"
		);
		showManual(context);
	}

	// showProblem 커맨드 등록
	context.subscriptions.push(
		vscode.commands.registerCommand("BOJ-EX.showProblem", () => {
			// 문제 번호를 입력받는 InputBox 띄우기
			vscode.window
				.showInputBox({
					prompt: "문제 번호를 입력하세요.",
					placeHolder: "예: 1000",
				})
				.then((problemNumber) => {
					if (problemNumber) {
						// showProblem 함수 호출 시 context 전달
						showProblem(problemNumber, context);
					} else {
						vscode.window.showInformationMessage(
							"문제 번호를 입력해주세요."
						);
					}
				});
		})
	);

	// headerComment 커맨드 등록
	context.subscriptions.push(
		vscode.commands.registerCommand("BOJ-EX.headerComment", () => {
			// 문제 번호를 입력받는 InputBox 띄우기
			vscode.window
				.showInputBox({
					prompt: "문제 번호를 입력하세요.",
					placeHolder: "예: 1000",
				})
				.then((problemNumber) => {
					if (problemNumber) {
						// showProblem 함수 호출 시 context 전달
						headerComment(problemNumber);
					} else {
						vscode.window.showInformationMessage(
							"문제 번호를 입력해주세요."
						);
					}
				});
		})
	);

	//createProblem 커맨드 등록
	context.subscriptions.push(
		vscode.commands.registerCommand("BOJ-EX.createProblem", () => {
			createProblem(context);
		})
	);

	// pushToGithub 커맨드 등록
	context.subscriptions.push(
		vscode.commands.registerCommand("BOJ-EX.pushToGithub", () => {
			pushToGithub();
		})
	);

	// makeWorkflow 커맨드 등록
	context.subscriptions.push(
		vscode.commands.registerCommand("BOJ-EX.makeWorkflow", () => {
			makeWorkflow();
		})
	);

	// showManual 커맨드 등록
	context.subscriptions.push(
		vscode.commands.registerCommand("BOJ-EX.showManual", () => {
			showManual(context);
		})
	);
}

export function deactivate() {}
