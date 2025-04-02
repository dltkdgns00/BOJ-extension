import * as vscode from "vscode";
import { showProblem } from "./commands/showProblem";
import { headerComment } from "./commands/headerComment";
import { createProblem } from "./commands/createProblem";
import { pushToGithub } from "./commands/pushToGithub";
import { makeWorkflow } from "./libs/makeWorkflow";
import { showManual } from "./commands/showManual";
import { runTestCase } from "./commands/runTestCase";
import { getProbNum } from "./libs/getProbNum";
import { SidebarProvider, SubmissionProvider } from "./sidebar";
import { submitProblem } from "./commands/submitProblem";

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
		vscode.window.showInformationMessage("BOJ-EX를 설치해주셔서 감사합니다.");

		vscode.commands.executeCommand(
			"workbench.action.openSettings",
			"BOJ-extension"
		);
		showManual(context);
	}

	// 사이드바 Provider 등록
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("boj-sidebar", sidebarProvider)
	);

	// 제출 현황 Provider 등록
	const submissionProvider = new SubmissionProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"boj-submissions",
			submissionProvider
		)
	);

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
						vscode.window.showInformationMessage("문제 번호를 입력해주세요.");
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
						vscode.window.showInformationMessage("문제 번호를 입력해주세요.");
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

	// runTestCase 커맨드 등록
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"BOJ-EX.runTestCase",
			(problemNumber?: string) => {
				runTestCase(context, problemNumber);
			}
		)
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

	// submitProblem 커맨드 등록
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"BOJ-EX.submitProblem",
			(problemNumber?: string) => {
				submitProblem(problemNumber);
			}
		)
	);

	// showManual 커맨드 등록
	context.subscriptions.push(
		vscode.commands.registerCommand("BOJ-EX.showManual", () => {
			showManual(context);
		})
	);

	// showSubmissions 커맨드 등록
	context.subscriptions.push(
		vscode.commands.registerCommand("BOJ-EX.showSubmissions", () => {
			// 제출 현황 탭을 포커스
			vscode.commands.executeCommand("boj-submissions.focus");
		})
	);
}

export function deactivate() {}
